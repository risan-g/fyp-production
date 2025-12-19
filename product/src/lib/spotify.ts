/**
 * Spotify API Utility
 * Handles server-side authentication and secure data fetching from Spotify.
 */

const clientId = process.env.SPOTIFY_CLIENT_ID!;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

/**
 * Retrieves a temporary Access Token using the Client Credentials flow.
 */
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

/**
 * Higher-order fetch function that automatically handles
 * authentication and error catching for all Spotify requests.
 */
export async function fetchSpotifyData(url: string) {
  const token = await getSpotifyToken();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);

  return await response.json();
}
