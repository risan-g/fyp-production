"use server";

import { createClient } from "@/lib/supabase/server";

export type CachedTopArtist = {
  name: string;
  image_url: string | null;
  spotify_id: string;
};

/**
 * Fetches the user's top artists from Spotify and caches them in Supabase.
 * Only works for the currently authenticated user (needs their OAuth token).
 */
export async function refreshTopArtists() {
  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return { error: "Not authenticated" };
  }

  const providerToken = session.provider_token;

  if (!providerToken) {
    return { error: "No Spotify token. Re-link your account." };
  }

  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5",
      {
        headers: { Authorization: `Bearer ${providerToken}` },
      }
    );

    if (!response.ok) {
      console.error("Spotify top artists error:", await response.text());
      return { error: "Failed to fetch top artists." };
    }

    const data = await response.json();

    const artists: CachedTopArtist[] = (data.items || []).map((artist: any) => ({
      name: artist.name,
      image_url: artist.images?.[0]?.url || null,
      spotify_id: artist.id,
    }));

    // Upsert into our cache table
    const { error: upsertError } = await supabase
      .from("spotify_top_artists")
      .upsert(
        {
          user_id: session.user.id,
          artists: JSON.stringify(artists),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Cache upsert error:", upsertError);
      return { error: "Failed to cache top artists." };
    }

    return { artists };
  } catch (error) {
    console.error("Error refreshing top artists:", error);
    return { error: "Internal error." };
  }
}

/**
 * Reads cached top artists for any user's profile.
 * This does NOT require Spotify auth — it reads from our database.
 */
export async function getCachedTopArtists(userId: string): Promise<CachedTopArtist[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("spotify_top_artists")
    .select("artists")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return [];
  }

  try {
    return typeof data.artists === "string"
      ? JSON.parse(data.artists)
      : data.artists;
  } catch {
    return [];
  }
}
