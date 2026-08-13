"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

// --- Schemas (module-private — must NOT be exported per "use server" rules) ---

/**
 * Spotify artist ID used as the wall identifier.
 * Plain text — not a UUID. Spotify IDs are ~22 chars; no product format rule exists.
 * max(500): TECHNICAL ANTI-ABUSE LIMIT — generous ceiling consistent with review-domain
 *   guards (reviews.ts uses 500 for albumId), not encoding an assumed Spotify format.
 */
const spotifyArtistIdSchema = z.string().trim().min(1, "Artist ID is required.").max(500);

/**
 * Post title schema.
 *
 * IMPORTANT — transform/check ordering deliberately matches pre-ARCH-03C server behaviour:
 *
 *   Pre-ARCH-03C:
 *     if (title.length > 300) throw …   // raw length checked BEFORE trim
 *     insert({ title: title.trim() })   // trimmed on DB write
 *
 *   Pattern: .max(300) on raw → .transform(trim) → .pipe(min(1))
 *
 *   This means a string of 300 chars + trailing whitespace (301 raw) is REJECTED,
 *   matching the old behaviour. The current (wrong) .trim().max(300) would have
 *   trimmed first, making such a string pass.
 *
 * max(300): PRODUCT INVARIANT — mirrors posts_title_check DB CHECK constraint.
 * min(1) after trim: ENFORCEMENT PARITY — the old server had no explicit empty check,
 *   but CreatePostForm.tsx disables submit when !title.trim() and uses HTML required.
 *   This is a deliberate server-side enforcement of the established UI product rule.
 */
const postTitleSchema = z.string()
  .max(300, "Title too long.")
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Title is required."));

/**
 * Post content schema.
 *
 * Same ordering rationale as postTitleSchema:
 *   raw max check → trim → min(1) enforcement parity.
 *
 * max(40000): PRODUCT INVARIANT — mirrors posts_content_check DB CHECK constraint.
 * min(1) after trim: ENFORCEMENT PARITY (CreatePostForm: disabled={!content.trim()}).
 */
const postContentSchema = z.string()
  .max(40000, "Content too long.")
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Content is required."));

/**
 * Comment content schema.
 *
 * Same ordering rationale as postTitleSchema:
 *   raw max check → trim → min(1) enforcement parity.
 *
 * max(10000): PRODUCT INVARIANT — mirrors comments_content_check DB CHECK constraint.
 * min(1) after trim: ENFORCEMENT PARITY (GlobalReplyForm: disabled={!content.trim()},
 *   CommentNode reply form also guards !replyContent.trim()).
 */
const commentContentSchema = z.string()
  .max(10000, "Comment too long.")
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Comment cannot be empty."));

/**
 * UUID schema for database row identifiers: post IDs, comment IDs.
 * DB columns are UUID type (gen_random_uuid()) — UUID validation is a
 * DATABASE TYPE INVARIANT.
 */
const uuidSchema = z.string().uuid("Invalid ID format.");

/**
 * Optional UUID for parentId (nullable comment parent).
 * parentId may be null (top-level comment) or a valid UUID (nested reply).
 * DATABASE TYPE INVARIANT.
 */
const optionalUuidSchema = z.string().uuid("Invalid parent ID format.").nullable();

/**
 * Vote value schema.
 * Matches DB CHECK: vote_type = ANY (ARRAY[1, -1])
 * PRODUCT INVARIANT — mirrors votes_vote_type_check DB CHECK constraint.
 * No coercion — string "1" must be rejected.
 */
const voteValueSchema = z.union([z.literal(1), z.literal(-1)]);

/**
 * Vote entity type schema.
 * Controls which FK column (post_id vs comment_id) receives the vote.
 * PRODUCT RULE.
 */
const entityTypeSchema = z.enum(["post", "comment"]);

// --- Helper (module-private) ---

/** Safely extract the first human-readable validation error message from a Zod v4 result. */
function firstIssueMessage(error: z.ZodError): string {
  if (error.issues && error.issues.length > 0) {
    return error.issues[0].message;
  }
  return "Invalid input.";
}

// --- Internal helpers (not exported, not client-callable) ---

/**
 * Ensure a wall exists for the given artist ID.
 * Internal helper — called only from createPost after spotifyArtistId has already
 * been validated by createPost's schema. Not directly callable by Client Components.
 */
async function ensureWall(spotifyArtistId: string) {
  const supabase = await createClient();

  const { data: wall } = await supabase
    .from("walls")
    .select("id")
    .eq("spotify_artist_id", spotifyArtistId)
    .single();

  if (wall) return wall.id;

  const { data: newWall, error } = await supabase
    .from("walls")
    .insert({ spotify_artist_id: spotifyArtistId })
    .select("id")
    .single();

  if (error) throw new Error("Failed to create wall");
  return newWall.id;
}

/**
 * Recursively removes voided ancestor comments that no longer have children.
 * Internal helper — not exported, not client-callable.
 * The recursive logic is unchanged from pre-ARCH-03C; behavioural correctness
 * requires manual integration testing.
 */
async function cleanupVoidedAncestors(supabase: SupabaseClient, parentId: string) {
  const { data: parent } = await supabase
    .from("comments")
    .select("id, parent_id, is_voided")
    .eq("id", parentId)
    .single();

  if (!parent || !parent.is_voided) return;

  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", parentId);

  if (count && count > 0) return;

  await supabase.from("comments").delete().eq("id", parentId);

  if (parent.parent_id) {
    await cleanupVoidedAncestors(supabase, parent.parent_id);
  }
}

// --- Exported Server Actions ---

/**
 * Creates a thread starter. We enforce a title and content length.
 *
 * Validation order:
 *   1. spotifyArtistId schema
 *   2. title schema (raw max → trim → min)
 *   3. content schema (raw max → trim → min)
 *   4. createClient() + auth.getUser()
 *   5. ensureWall (internal, uses already-validated artistId)
 *   6. INSERT
 *   7. revalidatePath
 */
export async function createPost(
  spotifyArtistId: unknown,
  title: unknown,
  content: unknown
) {
  const parsedArtistId = spotifyArtistIdSchema.safeParse(spotifyArtistId);
  if (!parsedArtistId.success) throw new Error(firstIssueMessage(parsedArtistId.error));

  const parsedTitle = postTitleSchema.safeParse(title);
  if (!parsedTitle.success) throw new Error(firstIssueMessage(parsedTitle.error));

  const parsedContent = postContentSchema.safeParse(content);
  if (!parsedContent.success) throw new Error(firstIssueMessage(parsedContent.error));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in to post.");

  const wallId = await ensureWall(parsedArtistId.data);

  const { error } = await supabase.from("posts").insert({
    wall_id: wallId,
    user_id: user.id,
    title: parsedTitle.data,   // already trimmed by schema transform
    content: parsedContent.data, // already trimmed by schema transform
  });

  if (error) throw error;

  revalidatePath(`/artist/${parsedArtistId.data}`);
}

/**
 * Adds a reply to either a Post or another Comment.
 *
 * Validation order:
 *   1. postId (UUID)
 *   2. parentId (UUID | null)
 *   3. content (raw max → trim → min)
 *   4. spotifyArtistId
 *   5. createClient() + auth.getUser()
 *   6. INSERT
 *   7. revalidatePath
 */
export async function createComment(
  postId: unknown,
  parentId: unknown,
  content: unknown,
  spotifyArtistId: unknown
) {
  const parsedPostId = uuidSchema.safeParse(postId);
  if (!parsedPostId.success) throw new Error(firstIssueMessage(parsedPostId.error));

  const parsedParentId = optionalUuidSchema.safeParse(parentId);
  if (!parsedParentId.success) throw new Error(firstIssueMessage(parsedParentId.error));

  const parsedContent = commentContentSchema.safeParse(content);
  if (!parsedContent.success) throw new Error(firstIssueMessage(parsedContent.error));

  const parsedArtistId = spotifyArtistIdSchema.safeParse(spotifyArtistId);
  if (!parsedArtistId.success) throw new Error(firstIssueMessage(parsedArtistId.error));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in to comment.");

  const { error } = await supabase.from("comments").insert({
    post_id: parsedPostId.data,
    parent_id: parsedParentId.data,
    user_id: user.id,
    content: parsedContent.data, // already trimmed by schema transform
  });

  if (error) throw error;

  revalidatePath(`/artist/${parsedArtistId.data}`);
}

/**
 * The vote system.
 * Handles LOUD (+1) and QUIET (-1).
 * If you click LOUD while already LOUD, it cancels your vote.
 *
 * Validation order:
 *   1. entityId (UUID)
 *   2. entityType enum
 *   3. voteValue (1 | -1)
 *   4. spotifyArtistId
 *   5. createClient() + auth.getUser()
 *   6. SELECT existing vote (business logic)
 *   7. DELETE / INSERT
 *   8. revalidatePath
 */
export async function toggleVote(
  entityId: unknown,
  entityType: unknown,
  voteValue: unknown,
  spotifyArtistId: unknown
) {
  const parsedEntityId = uuidSchema.safeParse(entityId);
  if (!parsedEntityId.success) throw new Error(firstIssueMessage(parsedEntityId.error));

  const parsedEntityType = entityTypeSchema.safeParse(entityType);
  if (!parsedEntityType.success) throw new Error(firstIssueMessage(parsedEntityType.error));

  const parsedVoteValue = voteValueSchema.safeParse(voteValue);
  if (!parsedVoteValue.success) throw new Error(firstIssueMessage(parsedVoteValue.error));

  const parsedArtistId = spotifyArtistIdSchema.safeParse(spotifyArtistId);
  if (!parsedArtistId.success) throw new Error(firstIssueMessage(parsedArtistId.error));

  const validEntityId = parsedEntityId.data;
  const validEntityType = parsedEntityType.data;
  const validVoteValue = parsedVoteValue.data;
  const validArtistId = parsedArtistId.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in to vote.");

  const query = supabase
    .from("votes")
    .select("id, vote_type")
    .eq("user_id", user.id);

  if (validEntityType === "post") query.eq("post_id", validEntityId);
  else query.eq("comment_id", validEntityId);

  const { data: existingVote, error: selectError } = await query.maybeSingle();

  if (selectError) throw selectError;

  if (existingVote) {
    if (existingVote.vote_type === validVoteValue) {
      // User clicked the exact same button they already pressed — UNVOTE
      const { error } = await supabase.from("votes").delete().eq("id", existingVote.id);
      if (error) throw error;
    } else {
      // User changed from Loud to Quiet (or vice versa) — UPDATE
      const { error: delError } = await supabase.from("votes").delete().eq("id", existingVote.id);
      if (delError) throw delError;

      const insertData = validEntityType === "post"
        ? { user_id: user.id, vote_type: validVoteValue, post_id: validEntityId }
        : { user_id: user.id, vote_type: validVoteValue, comment_id: validEntityId };

      const { error: insError } = await supabase.from("votes").insert(insertData);
      if (insError) throw insError;
    }
  } else {
    // First time voting
    const insertData = validEntityType === "post"
      ? { user_id: user.id, vote_type: validVoteValue, post_id: validEntityId }
      : { user_id: user.id, vote_type: validVoteValue, comment_id: validEntityId };

    const { error } = await supabase.from("votes").insert(insertData);
    if (error) throw error;
  }

  revalidatePath(`/artist/${validArtistId}`);
}

/**
 * Void (soft-delete) or hard-delete a comment.
 * If the comment has children, soft-delete preserving thread structure.
 * If no children, hard-delete then cascade-cleanup voided ancestors.
 *
 * Validation order:
 *   1. commentId (UUID)
 *   2. spotifyArtistId
 *   3. createClient() + auth.getUser()
 *   4. SELECT comment (needed for parent_id before any write)
 *   5. SELECT children count
 *   6. UPDATE (soft) or DELETE (hard)
 *   7. cleanupVoidedAncestors (internal)
 *   8. revalidatePath
 */
export async function voidComment(commentId: unknown, spotifyArtistId: unknown) {
  const parsedCommentId = uuidSchema.safeParse(commentId);
  if (!parsedCommentId.success) throw new Error(firstIssueMessage(parsedCommentId.error));

  const parsedArtistId = spotifyArtistIdSchema.safeParse(spotifyArtistId);
  if (!parsedArtistId.success) throw new Error(firstIssueMessage(parsedArtistId.error));

  const validCommentId = parsedCommentId.data;
  const validArtistId = parsedArtistId.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  // Get the comment's parent_id before we do anything
  const { data: comment } = await supabase
    .from("comments")
    .select("parent_id")
    .eq("id", validCommentId)
    .single();

  // Check if this comment has any children
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", validCommentId);

  if (count && count > 0) {
    // Soft delete: keep the row so the thread structure is preserved
    const { error } = await supabase
      .from("comments")
      .update({ is_voided: true, content: "[DELETED]" })
      .eq("id", validCommentId)
      .eq("user_id", user.id);

    if (error) throw error;
  } else {
    // Hard delete: no children, so just remove it
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", validCommentId)
      .eq("user_id", user.id);

    if (error) throw error;

    // Cascade cleanup: walk up and remove voided parents with no remaining children
    if (comment?.parent_id) {
      await cleanupVoidedAncestors(supabase, comment.parent_id);
    }
  }

  revalidatePath(`/artist/${validArtistId}`);
}

/**
 * Delete a post (full delete; cascades to comments and votes via FK).
 *
 * Validation order:
 *   1. postId (UUID)
 *   2. spotifyArtistId
 *   3. createClient() + auth.getUser()
 *   4. DELETE
 *   5. revalidatePath
 */
export async function deletePost(postId: unknown, spotifyArtistId: unknown) {
  const parsedPostId = uuidSchema.safeParse(postId);
  if (!parsedPostId.success) throw new Error(firstIssueMessage(parsedPostId.error));

  const parsedArtistId = spotifyArtistIdSchema.safeParse(spotifyArtistId);
  if (!parsedArtistId.success) throw new Error(firstIssueMessage(parsedArtistId.error));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", parsedPostId.data)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath(`/artist/${parsedArtistId.data}`);
}
