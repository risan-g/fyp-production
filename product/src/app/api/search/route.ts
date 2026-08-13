import { getSpotifyToken } from "@/lib/spotify";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// --- Schemas (module-private) ---

/**
 * Search query schema.
 * Preserves the exact previous trim/empty behavior (raw max -> trim -> min).
 * max(500): TECHNICAL ANTI-ABUSE LIMIT to prevent arbitrarily large strings
 * from reaching the Spotify API or Supabase, while remaining generous enough
 * for any legitimate music search.
 */
const searchQuerySchema = z.string()
  .max(500, "Search query is too long.")
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Search query is required."));

/** Safely extract the first human-readable validation error message. */
function firstIssueMessage(error: z.ZodError): string {
  if (error.issues && error.issues.length > 0) {
    return error.issues[0].message;
  }
  return "Invalid input.";
}

/**
 * GET Route Handler for Global Search.
 * Searches across Supabase users AND the Spotify Web API (artists + albums) in one search
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawQuery = url.searchParams.get("q") ?? "";

  const parsedQuery = searchQuerySchema.safeParse(rawQuery);

  if (!parsedQuery.success) {
    // If it failed because it was empty/whitespace (too_small), preserve existing default behaviour
    if (parsedQuery.error.issues[0].code === "too_small") {
      return Response.json([]);
    }
    // If it failed due to being too long, return 400 Bad Request
    return Response.json({ error: firstIssueMessage(parsedQuery.error) }, { status: 400 });
  }

  const query = parsedQuery.data;

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
