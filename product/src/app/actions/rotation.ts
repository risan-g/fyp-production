"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Toggle Rotation
 *
 * Manages the user's "Taste Profile" by adding or removing artists
 * from their rotation.
 *
 * Key Feature: Metadata Caching.
 * When a user adds an artist, we save the Artist Name and Image URL
 * alongside the ID. This allows us to display the user's rotation
 * on their profile without making slow API calls to Spotify.
 */
export async function toggleRotation(
  spotifyArtistId: string,
  artistName: string,
  artistImageUrl: string | null,
) {
  const supabase = await createClient();

  // Authentication Check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to modify your rotation.");
  }

  // Does this user already follow this specific Spotify Artist?
  const { data: existingFollow } = await supabase
    .from("artist_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("spotify_artist_id", spotifyArtistId)
    .single();

  if (existingFollow) {
    // --- REMOVE (Unfollow) ---
    const { error } = await supabase
      .from("artist_follows")
      .delete()
      .eq("user_id", user.id)
      .eq("spotify_artist_id", spotifyArtistId);

    if (error) throw new Error(error.message);
  } else {
    // --- ADD (Follow) ---
    // We insert the ID and the metadata (Name/Image)
    const { error } = await supabase.from("artist_follows").insert({
      user_id: user.id,
      spotify_artist_id: spotifyArtistId,
      artist_name: artistName,
      artist_image_url: artistImageUrl,
    });

    if (error) throw new Error(error.message);
  }

  // Revalidate Cache
  // Refresh the Profile
  revalidatePath("/profile");
  // Refresh the Artist Page to update "Global Rotation" count.
  revalidatePath(`/artist/${spotifyArtistId}`);
}
