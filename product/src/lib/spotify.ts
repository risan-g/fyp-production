let spotifyToken = "";
let tokenExpiry = 0;

export async function getSpotifyToken(): Promise<string> {
  const now = Date.now();

  // If token is still valid, return it.
  if (spotifyToken && now < tokenExpiry) {
    return spotifyToken;
  }

  // Fetch a new token from Spotify.
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret)
    throw new Error("Missing Spotify credentials");

  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();

  if (!data.access_token) throw new Error("Failed to get Spotify token");

  spotifyToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000; //in seconds

  return spotifyToken;
}

// console.log("Client ID:", process.env.SPOTIFY_CLIENT_ID);
// console.log("Client Secret:", process.env.SPOTIFY_CLIENT_SECRET);
