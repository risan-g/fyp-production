import { getSpotifyToken } from "@/lib/spotify";

/**
 * GET Route Handler for Global Search.
 * This API endpoint handles multi-type searches (Artists, Albums, Singles)
 * by proxying requests to the Spotify Web API.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q");

  // Basic validation to ensure the search parameter is present.
  if (!query) {
    return new Response("Missing query", { status: 400 });
  }

  try {
    const token = await getSpotifyToken();

    /**
     * Parallel Data Fetching:
     * Executes three separate Spotify API requests simultaneously.
     * This optimises response times compared to sequential fetching.
     */
    const [artistRes, albumRes, singleRes] = await Promise.all([
      fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=artist&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=album&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=album&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    ]);

    // Efficiently parse all JSON responses in parallel.
    const [artistData, albumData, singleData] = await Promise.all([
      artistRes.json(),
      albumRes.json(),
      singleRes.json(),
    ]);

    /**
     * Data Normalisation:
     * Spotify returns singles within the 'albums' category.
     * We filter these manually to provide a distinct category for the UI.
     */
    const singles = (singleData.albums?.items || []).filter(
      (a: any) => a.album_type === "single"
    );

    const artists = artistData.artists?.items || [];
    const albums = albumData.albums?.items || [];

    /**
     * Results Aggregation:
     * Combines all categories into a single flat array.
     * Each object is tagged with a 'type' property to assist the frontend renderer.
     */
    const results = [
      ...artists.map((a: any) => ({ ...a, type: "artist" })),
      ...albums.map((a: any) => ({ ...a, type: "album" })),
      ...singles.map((a: any) => ({ ...a, type: "single" })),
    ];

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("search failed", err);
    return new Response("Spotify search failed", { status: 500 });
  }
}
