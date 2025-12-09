import { createClient } from "@/lib/supabase/server";
import { fetchSpotifyData } from "@/lib/spotify";
import Link from "next/link";

/**
 * Format a Supabase timestamp into a compact readable date.
 * Used for the Live Activity feed where space is limited.
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * LiveActivity (Server Component)
 *
 * Displays a small feed of recent album reviews from the community.
 */
export default async function LiveActivity() {
  const supabase = await createClient();

  /**
   * Fetch the raw review entries.
   * These contain only: review text, user_id, timestamp, and album_id.
   * We enrich the display later with Spotify + user data.
   */
  const { data: rawReviews } = await supabase
    .from("album_reviews")
    .select(
      `
      id, review_text, created_at, album_id, user_id
    `
    )
    .order("created_at", { ascending: false })
    .limit(6);

  /**
   * For each review, we attach:
   * - album name, artist, artwork (from Spotify)
   * - the reviewer’s rating (if they left one)
   * - their username (from the profiles table)
   *
   * If any external request fails, we fall back to safe defaults
   * so that the feed doesn’t break.
   */
  const reviews = rawReviews
    ? await Promise.all(
        rawReviews.map(async (review: any) => {
          try {
            const spotifyAlbum = await fetchSpotifyData(
              `https://api.spotify.com/v1/albums/${review.album_id}`
            );

            const { data: ratingData } = await supabase
              .from("album_ratings")
              .select("rating")
              .eq("user_id", review.user_id)
              .eq("album_id", review.album_id)
              .single();

            const { data: profileData } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", review.user_id)
              .single();

            return {
              ...review,
              album_name: spotifyAlbum.name,
              artist_name: spotifyAlbum.artists[0]?.name,
              album_image: spotifyAlbum.images?.[0]?.url,
              rating: ratingData?.rating || null,
              username: profileData?.username || "Anonymous",
            };
          } catch (e) {
            // Any failure (Spotify/network/profile lookup) -> fallback
            return {
              ...review,
              album_name: "Unknown Album",
              artist_name: "Unknown Artist",
              album_image: null,
              rating: null,
              username: "Anonymous",
            };
          }
        })
      )
    : [];

  // Hide this entire section if no activity exists
  if (reviews.length === 0) return null;

  return (
    <div className="w-full border-t border-neutral-900 pt-9 mt-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Live Activity
          </h2>
        </div>
      </div>

      {/* Responsive grid of reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="group flex flex-col bg-neutral-900/30 border border-neutral-800 rounded-xl p-5 hover:border-neutral-600 transition-colors h-full"
          >
            {/* Header: avatar, username, timestamp */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-800/50">
              <div className="flex items-center gap-2">
                {/* Simple first-letter avatar */}
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                  {review.username[0]?.toUpperCase() || "?"}
                </div>

                <Link
                  href={`/profile/${review.username}`}
                  className="text-xs font-bold text-neutral-300 hover:text-white transition-colors"
                >
                  @{review.username}
                </Link>
              </div>

              <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
                {formatDate(review.created_at)}
              </span>
            </div>

            {/* Review body: image + metadata + short text */}
            <div className="flex gap-4">
              <Link href={`/album/${review.album_id}`} className="shrink-0">
                {review.album_image ? (
                  <div className="relative">
                    <img
                      src={review.album_image}
                      alt={review.album_name}
                      className="w-20 h-20 rounded-md object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    {review.rating !== null && (
                      <div className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md border border-neutral-200">
                        {review.rating}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-neutral-800 rounded-md flex items-center justify-center">
                    <span className="text-[10px] text-neutral-600">N/A</span>
                  </div>
                )}
              </Link>

              <div className="flex flex-col min-w-0 flex-1">
                <Link
                  href={`/album/${review.album_id}`}
                  className="text-sm font-bold text-white truncate hover:underline decoration-neutral-600 underline-offset-4"
                >
                  {review.album_name || "Unknown"}
                </Link>

                <p className="text-xs text-neutral-500 mb-2 truncate">
                  {review.artist_name}
                </p>

                <p className="text-neutral-400 text-xs line-clamp-3 leading-relaxed">
                  "{review.review_text}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
