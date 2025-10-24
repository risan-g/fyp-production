import { getSpotifyToken } from "@/lib/spotify";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return new Response("Missing query", { status: 400 });
  }

  try {
    const token = await getSpotifyToken();
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

    const [artistData, albumData, singleData] = await Promise.all([
      artistRes.json(),
      albumRes.json(),
      singleRes.json(),
    ]);

    const singles = (singleData.albums?.items || []).filter(
      (a: any) => a.album_type === "single"
    );

    const artists = artistData.artists?.items || [];
    const albums = albumData.albums?.items || [];

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
