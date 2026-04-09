"use server";

import { createClient } from "@/lib/supabase/server";

export type SpotifyPlaylist = {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { id: string; display_name: string };
};

export type PublishedPlaylist = {
  id: string;
  user_id: string;
  spotify_playlist_id: string;
  name: string;
  image_url: string | null;
  tracks_total: number;
  created_at: string;
};

/**
 * Fetches the current user's full list of Spotify playlists.
 */
export async function getMySpotifyPlaylists() {
  const supabase = await createClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return { error: "Not authenticated" };
  }

  // Supabase stores the OAuth provider token here if requested during sign in
  const providerToken = session.provider_token;

  if (!providerToken) {
    return { error: "No Spotify access token found. You may need to re-link your Spotify account." };
  }

  try {
    const response = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
      headers: {
        Authorization: `Bearer ${providerToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Spotify API Error:", errText);
      return { error: "Failed to fetch playlists from Spotify." };
    }

    const data = await response.json();
    return { playlists: data.items as SpotifyPlaylist[] };
  } catch (error) {
    console.error("Error fetching Spotify playlists:", error);
    return { error: "Internal server error." };
  }
}

/**
 * Publishes a Spotify playlist to the user's public 'Synced' profile.
 */
export async function publishPlaylist(playlist: {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  tracksTotal: number;
}) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated" };
  }

  // Check current published count to enforce the cap of 4
  const { count, error: countError } = await supabase
    .from("published_playlists")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    console.error("Error counting playlists:", countError);
    return { error: "Failed to check playlist limits." };
  }

  if (count !== null && count >= 4) {
    return { error: "You have reached the maximum limit of 4 published collections." };
  }

  const { error: insertError } = await supabase
    .from("published_playlists")
    .insert({
      user_id: user.id,
      spotify_playlist_id: playlist.spotifyId,
      name: playlist.name,
      image_url: playlist.imageUrl,
      tracks_total: playlist.tracksTotal,
    });

  if (insertError) {
    console.error("Error publishing playlist:", insertError);
    // Handle unique constraint violation gracefully
    if (insertError.code === "23505") {
      return { error: "This playlist is already published." };
    }
    return { error: "Failed to publish playlist." };
  }

  return { success: true };
}

/**
 * Unpublishes a Spotify playlist from the user's public profile.
 */
export async function unpublishPlaylist(spotifyPlaylistId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated" };
  }

  const { error: deleteError } = await supabase
    .from("published_playlists")
    .delete()
    .eq("user_id", user.id)
    .eq("spotify_playlist_id", spotifyPlaylistId);

  if (deleteError) {
    console.error("Error unpublishing playlist:", deleteError);
    return { error: "Failed to unpublish playlist." };
  }

  return { success: true };
}

/**
 * Gets the published playlists for a specific user to display on their profile.
 */
export async function getPublishedPlaylists(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("published_playlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching published playlists:", error);
    return [];
  }

  return data as PublishedPlaylist[];
}
