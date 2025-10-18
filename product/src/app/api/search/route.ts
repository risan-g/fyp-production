import { getSpotifyToken } from "@/lib/spotify";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return new Response("Missing query", { status: 400 });
  }

  try {
    const token = await getSpotifyToken();
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=artist&limit=8`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    const artists = data.artists?.items || [];

    return new Response(JSON.stringify(artists), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("search failed", err);
    return new Response("Spotify search failed", { status: 500 });
  }
}
