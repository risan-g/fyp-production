"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface AlbumData {
  albumId: string;
  albumName: string;
  artistName: string;
  albumImage: string;
}

export async function saveRating(albumData: AlbumData, rating: number) {
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
      .eq("album_id", albumData.albumId)
      .single();

    if (existing) {
      const { error: updateError } = await supabase
        .from("reviews")
        .update({ rating, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
        
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("reviews").insert({
        user_id: user.id,
        album_id: albumData.albumId,
        album_name: albumData.albumName,
        artist_name: albumData.artistName,
        album_image_url: albumData.albumImage,
        rating,
      });
      
      if (insertError) throw insertError;
    }

    revalidatePath(`/album/${albumData.albumId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("saveRating error:", err);
    return { error: err instanceof Error ? err.message : "Failed to save rating." };
  }
}

export async function removeRating(albumId: string) {
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
      .eq("album_id", albumId)
      .single();

    if (existing && existing.content) {
      // If content exists, just nullify the rating
      const { error: updateError } = await supabase
        .from("reviews")
        .update({ rating: null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("album_id", albumId);

      if (updateError) throw updateError;
    } else {
      // Otherwise delete the whole row
      const { error: deleteError } = await supabase
        .from("reviews")
        .delete()
        .eq("user_id", user.id)
        .eq("album_id", albumId);

      if (deleteError) throw deleteError;
    }

    revalidatePath(`/album/${albumId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("removeRating error:", err);
    return { error: err instanceof Error ? err.message : "Failed to remove rating." };
  }
}

export async function saveReview(albumData: AlbumData, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to post a review." };
  }

  const cleanContent = content.trim();
  if (!cleanContent) {
    return { error: "Review cannot be empty." };
  }

  try {
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("album_id", albumData.albumId)
      .single();

    if (existing) {
      const { error: updateError } = await supabase
        .from("reviews")
        .update({
          content: cleanContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
        
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("reviews").insert({
        user_id: user.id,
        album_id: albumData.albumId,
        album_name: albumData.albumName,
        artist_name: albumData.artistName,
        album_image_url: albumData.albumImage,
        content: cleanContent,
        rating: null,
      });
      
      if (insertError) throw insertError;
    }

    revalidatePath(`/album/${albumData.albumId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("saveReview error:", err);
    return { error: err instanceof Error ? err.message : "Failed to save review." };
  }
}

export async function removeReview(albumId: string) {
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
      .eq("album_id", albumId)
      .single();

    if (existing && existing.rating !== null) {
      // Keep row, remove content
      const { error: updateError } = await supabase
        .from("reviews")
        .update({ content: null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("album_id", albumId);

      if (updateError) throw updateError;
    } else {
      // Delete whole row
      const { error: deleteError } = await supabase
        .from("reviews")
        .delete()
        .eq("user_id", user.id)
        .eq("album_id", albumId);

      if (deleteError) throw deleteError;
    }

    revalidatePath(`/album/${albumId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("removeReview error:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete review." };
  }
}
