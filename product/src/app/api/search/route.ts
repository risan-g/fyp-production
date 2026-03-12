import { getSpotifyToken } from "@/lib/spotify";
import { createClient } from "@/lib/supabase/server";

/**
 * GET Route Handler for Global Search.
 * Searches across Supabase users AND the Spotify Web API (artists + albums) in one search
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q");

  if (!query || !query.trim()) {
    return Response.json([]);
  }

  try {
    const supabase = await createClient();

    // Run Supabase user search and Spotify search in parallel
    const [userResults, spotifyResults] = await Promise.all([
      // Search Supabase profiles by username.
      supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${query}%`)
        .limit(3),

      // Single Spotify API call searching for both artists and albums
      (async () => {
        const token = await getSpotifyToken();
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,album&limit=3`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return { artists: [], albums: [] };
        return res.json();
      })(),
    ]);

    // Normalise users from Supabase
    const users = (userResults.data || []).map((u: any) => ({
      id: u.username,
      name: u.username,
      image: u.avatar_url,
      type: "user",
    }));

    // Normalise artists from Spotify
    const artists = (spotifyResults.artists?.items || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url || null,
      type: "artist",
    }));

    // Normalise albums from Spotify
    const albums = (spotifyResults.albums?.items || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url || null,
      subtitle: a.artists?.map((ar: any) => ar.name).join(", ") || "",
      type: "album",
    }));

    return Response.json({ users, artists, albums });
  } catch (err) {
    console.error("Search failed:", err);
    return Response.json({ users: [], artists: [], albums: [] });
  }
}
