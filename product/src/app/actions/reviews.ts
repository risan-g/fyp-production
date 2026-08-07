"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Schemas ---

/**
 * Album metadata schema.
 * .strict() rejects payloads with unrecognised keys (e.g. injected user_id).
 *
 * Technical anti-abuse length guards:
 *   albumId   max 500  — Spotify IDs are ~22 chars; generous ceiling prevents pathological payloads
 *   albumName max 500  — generous ceiling; no existing product limit
 *   artistName max 500 — generous ceiling; no existing product limit
 *   albumImage max 2000 — generous ceiling for URLs; empty string permitted as existing fallback
 */
export const albumDataSchema = z.object({
  albumId: z.string().trim().min(1, "Album ID is required").max(500),
  albumName: z.string().trim().min(1, "Album name is required").max(500),
  artistName: z.string().trim().min(1, "Artist name is required").max(500),
  albumImage: z.string().max(2000).or(z.literal("")),
}).strict();

export type AlbumData = z.infer<typeof albumDataSchema>;

/**
 * Rating schema — matches DB CHECK constraint: rating >= 0 AND rating <= 100, integer only.
 * Classification: PRODUCT INVARIANT (mirrors database CHECK).
 */
const ratingSchema = z.number().int().min(0, "Rating must be at least 0").max(100, "Rating cannot exceed 100");

/**
 * Review content schema.
 * .trim().min(1) preserves the pre-ARCH-03A manual check: content.trim() must be non-empty.
 * No maximum length — the reviews.content column is unbounded TEXT with no DB or UI limit.
 */
const contentSchema = z.string().trim().min(1, "Review cannot be empty");

/**
 * Standalone album ID for remove operations.
 * Technical anti-abuse max matches albumDataSchema.albumId.
 */
const albumIdSchema = z.string().trim().min(1, "Album ID is required").max(500);

// --- Helpers ---

/** Safely extract the first human-readable validation error message from a Zod v4 result. */
function firstIssueMessage(error: z.ZodError): string {
  if (error.issues && error.issues.length > 0) {
    return error.issues[0].message;
  }
  return "Invalid input.";
}

// --- Actions ---

export async function saveRating(albumData: unknown, rating: unknown) {
  const parsedData = albumDataSchema.safeParse(albumData);
  if (!parsedData.success) return { error: firstIssueMessage(parsedData.error) };

  const parsedRating = ratingSchema.safeParse(rating);
  if (!parsedRating.success) return { error: firstIssueMessage(parsedRating.error) };

  const validData = parsedData.data;
  const validRating = parsedRating.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to rate an album." };
  }

  try {
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("album_id", validData.albumId)
      .single();

    if (existing) {
      const { error: updateError } = await supabase
        .from("reviews")
        .update({ rating: validRating, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
        
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("reviews").insert({
        user_id: user.id,
        album_id: validData.albumId,
        album_name: validData.albumName,
        artist_name: validData.artistName,
        album_image_url: validData.albumImage,
        rating: validRating,
      });
      
      if (insertError) throw insertError;
    }

    revalidatePath(`/album/${validData.albumId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("saveRating error:", err);
    return { error: err instanceof Error ? err.message : "Failed to save rating." };
  }
}

export async function removeRating(albumId: unknown) {
  const parsedId = albumIdSchema.safeParse(albumId);
  if (!parsedId.success) return { error: firstIssueMessage(parsedId.error) };
  const validAlbumId = parsedId.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to remove a rating." };
  }

  try {
    const { data: existing } = await supabase
      .from("reviews")
      .select("content")
      .eq("user_id", user.id)
      .eq("album_id", validAlbumId)
      .single();

    if (existing && existing.content) {
      // If content exists, just nullify the rating
      const { error: updateError } = await supabase
        .from("reviews")
        .update({ rating: null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("album_id", validAlbumId);

      if (updateError) throw updateError;
    } else {
      // Otherwise delete the whole row
      const { error: deleteError } = await supabase
        .from("reviews")
        .delete()
        .eq("user_id", user.id)
        .eq("album_id", validAlbumId);

      if (deleteError) throw deleteError;
    }

    revalidatePath(`/album/${validAlbumId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("removeRating error:", err);
    return { error: err instanceof Error ? err.message : "Failed to remove rating." };
  }
}

export async function saveReview(albumData: unknown, content: unknown) {
  const parsedData = albumDataSchema.safeParse(albumData);
  if (!parsedData.success) return { error: firstIssueMessage(parsedData.error) };

  const parsedContent = contentSchema.safeParse(content);
  if (!parsedContent.success) return { error: firstIssueMessage(parsedContent.error) };

  const validData = parsedData.data;
  const validContent = parsedContent.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to post a review." };
  }

  try {
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("album_id", validData.albumId)
      .single();

    if (existing) {
      const { error: updateError } = await supabase
        .from("reviews")
        .update({
          content: validContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
        
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("reviews").insert({
        user_id: user.id,
        album_id: validData.albumId,
        album_name: validData.albumName,
        artist_name: validData.artistName,
        album_image_url: validData.albumImage,
        content: validContent,
        rating: null,
      });
      
      if (insertError) throw insertError;
    }

    revalidatePath(`/album/${validData.albumId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("saveReview error:", err);
    return { error: err instanceof Error ? err.message : "Failed to save review." };
  }
}

export async function removeReview(albumId: unknown) {
  const parsedId = albumIdSchema.safeParse(albumId);
  if (!parsedId.success) return { error: firstIssueMessage(parsedId.error) };
  const validAlbumId = parsedId.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to delete a review." };
  }

  try {
    const { data: existing } = await supabase
      .from("reviews")
      .select("rating")
      .eq("user_id", user.id)
      .eq("album_id", validAlbumId)
      .single();

    if (existing && existing.rating !== null) {
      // Keep row, remove content
      const { error: updateError } = await supabase
        .from("reviews")
        .update({ content: null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("album_id", validAlbumId);

      if (updateError) throw updateError;
    } else {
      // Delete whole row
      const { error: deleteError } = await supabase
        .from("reviews")
        .delete()
        .eq("user_id", user.id)
        .eq("album_id", validAlbumId);

      if (deleteError) throw deleteError;
    }

    revalidatePath(`/album/${validAlbumId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("removeReview error:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete review." };
  }
}
