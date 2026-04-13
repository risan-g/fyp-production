"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * we only create a wall in our database when the FIRST person tries to post on it, Instead of generating a wall for all 10 million Spotify artists in advance.
 */
export async function ensureWall(spotifyArtistId: string) {
  const supabase = await createClient();

  // Try to find the wall first
  const { data: wall } = await supabase
    .from("walls")
    .select("id")
    .eq("spotify_artist_id", spotifyArtistId)
    .single();

  if (wall) return wall.id;

  // If it doesn't exist, we create it.
  const { data: newWall, error } = await supabase
    .from("walls")
    .insert({ spotify_artist_id: spotifyArtistId })
    .select("id")
    .single();

  if (error) throw new Error("Failed to create wall");
  return newWall.id;
}

/**
 * Creates a thread starter. We enforce a title and content length.
 */
export async function createPost(
  spotifyArtistId: string,
  title: string,
  content: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in to post.");
  if (title.length > 300) throw new Error("Title too long.");
  if (content.length > 40000) throw new Error("Content too long.");

  // Call function to get the internal wall ID
  const wallId = await ensureWall(spotifyArtistId);

  const { error } = await supabase.from("posts").insert({
    wall_id: wallId,
    user_id: user.id,
    title: title.trim(),
    content: content.trim(),
  });

  if (error) throw error;

  // Revalidate the cache so the new post appears immediately without refreshing
  revalidatePath(`/artist/${spotifyArtistId}`);
}

/**
 * Adds a reply to either a Post or another Comment.
 */
export async function createComment(
  postId: string,
  parentId: string | null,
  content: string,
  spotifyArtistId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in to comment.");
  if (content.length > 10000) throw new Error("Comment too long.");

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    parent_id: parentId,
    user_id: user.id,
    content: content.trim(),
  });

  if (error) throw error;

  revalidatePath(`/artist/${spotifyArtistId}`);
}

/**
 * The vote system.
 * Handles LOUD (+1) and QEIUT (-1). 
 * If you click LOUD while you are already LOUD, it cancels your vote.
 */
export async function toggleVote(
  entityId: string, // The ID of the post or comment
  entityType: "post" | "comment",
  voteValue: 1 | -1,
  spotifyArtistId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in to vote.");

  // checks first if the user has ALREADY voted on this exact item
  const query = supabase
    .from("votes")
    .select("id, vote_type")
    .eq("user_id", user.id);

  if (entityType === "post") query.eq("post_id", entityId);
  else query.eq("comment_id", entityId);

  const { data: existingVote, error: selectError } = await query.maybeSingle();

  if (selectError) throw selectError;

  if (existingVote) {
    if (existingVote.vote_type === voteValue) {
      // User clicked the exact same button they already pressed, then UNVOTE
      const { error } = await supabase.from("votes").delete().eq("id", existingVote.id);
      if (error) throw error;
    } else {
      // User changed from Loud to Quiet (or vice versa), then UPDATE
      const { error: delError } = await supabase.from("votes").delete().eq("id", existingVote.id);
      if (delError) throw delError;

      const insertData: any = {
        user_id: user.id,
        vote_type: voteValue,
      };
      if (entityType === "post") insertData.post_id = entityId;
      else insertData.comment_id = entityId;

      const { error: insError } = await supabase.from("votes").insert(insertData);
      if (insError) throw insError;
    }
  } else {
    // First time voting
    const insertData: any = {
      user_id: user.id,
      vote_type: voteValue,
    };
    if (entityType === "post") insertData.post_id = entityId;
    else insertData.comment_id = entityId;

    const { error } = await supabase.from("votes").insert(insertData);
    if (error) throw error;
  }

  revalidatePath(`/artist/${spotifyArtistId}`);
}

/**
 * delete comment
 * If the comment has replies beneath it, we "Soft Delete" so the thread doesn't break.
 * If it has no replies, we hard delete it entirely.
 * After deletion, we walk up the parent chain and clean up any voided ancestors that no longer have children (cascade cleanup).
 */
export async function voidComment(commentId: string, spotifyArtistId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  // Get the comment's parent_id before we do anything
  const { data: comment } = await supabase
    .from("comments")
    .select("parent_id")
    .eq("id", commentId)
    .single();

  // Check if this comment has any children
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", commentId);

  if (count && count > 0) {
    // Soft delete: keep the row so the thread structure is preserved
    const { error } = await supabase
      .from("comments")
      .update({ is_voided: true, content: "[DELETED]" })
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) throw error;
  } else {
    // Hard delete: no children, so just remove it
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) throw error;

    // Cascade cleanup: walk up and remove voided parents with no remaining children
    if (comment?.parent_id) {
      await cleanupVoidedAncestors(supabase, comment.parent_id);
    }
  }

  revalidatePath(`/artist/${spotifyArtistId}`);
}

/**
 * Recursively removes voided ancestor comments that no longer have children.
 */
async function cleanupVoidedAncestors(supabase: any, parentId: string) {
  // Fetch the parent comment
  const { data: parent } = await supabase
    .from("comments")
    .select("id, parent_id, is_voided")
    .eq("id", parentId)
    .single();

  if (!parent || !parent.is_voided) return;

  // Check if this voided parent still has children
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", parentId);

  if (count && count > 0) return; // Still has children, stop

  // No children left and it's voided — delete it
  await supabase.from("comments").delete().eq("id", parentId);

  // Continue walking up
  if (parent.parent_id) {
    await cleanupVoidedAncestors(supabase, parent.parent_id);
  }
}

/**
 * delete post
 * Full delete. Deletes all comments and votes automatically.
 */
export async function deletePost(postId: string, spotifyArtistId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath(`/artist/${spotifyArtistId}`);
}
