const clientId = process.env.SPOTIFY_CLIENT_ID!;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

// Get a new access token
export async function getSpotifyToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

export async function fetchSpotifyData(url: string) {
  const token = await getSpotifyToken();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
  return await response.json();
}
// console.log("Client ID:", process.env.SPOTIFY_CLIENT_ID);
// console.log("Client Secret:", process.env.SPOTIFY_CLIENT_SECRET);
