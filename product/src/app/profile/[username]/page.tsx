import { createClient } from "@/lib/supabase/server";
import { fetchSpotifyData } from "@/lib/spotify";
import { notFound } from "next/navigation";
import Link from "next/link";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = await createClient();
  const username = decodeURIComponent(params.username);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, created_at")
    .ilike("username", username)
    .single();

  if (!profile) return notFound();

  const { data: rawRatings, count: ratingsCount } = await supabase
    .from("album_ratings")
    .select("*", { count: "exact" })
    .eq("user_id", profile.id)
    .order("rating", { ascending: false })
    .limit(4);

  const topRatings = rawRatings
    ? await Promise.all(
        rawRatings.map(async (rating) => {
          try {
            const spotifyAlbum = await fetchSpotifyData(
              `https://api.spotify.com/v1/albums/${rating.album_id}`
            );
            return {
              ...rating,
              fetched_image: spotifyAlbum.images?.[0]?.url || null,
              fetched_name: spotifyAlbum.name,
            };
          } catch (e) {
            return rating;
          }
        })
      )
    : [];

  const { data: rawReviews } = await supabase
    .from("album_reviews")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const reviews = rawReviews
    ? await Promise.all(
        rawReviews.map(async (review) => {
          try {
            const spotifyAlbum = await fetchSpotifyData(
              `https://api.spotify.com/v1/albums/${review.album_id}`
            );

            const { data: ratingData } = await supabase
              .from("album_ratings")
              .select("rating")
              .eq("user_id", profile.id)
              .eq("album_id", review.album_id)
              .single();

            return {
              ...review,
              album_name: spotifyAlbum.name || review.album_name,
              artist_name: spotifyAlbum.artists[0]?.name || review.artist_name,
              fetched_image: spotifyAlbum.images?.[0]?.url || null,
              rating: ratingData?.rating || null, // <--- Attach the rating
            };
          } catch (e) {
            return review;
          }
        })
      )
    : [];

  return (
    <div className="bg-black text-white min-h-screen p-8">
      <div className="max-w-4xl mx-auto pt-24">
        <div className="flex flex-col items-center text-center pb-12 border-b border-neutral-800">
          <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center text-5xl font-bold text-neutral-500 mb-6 ring-4 ring-black">
            {profile.username[0].toUpperCase()}
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            {profile.username}
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs uppercase tracking-widest font-bold">
            <span>est. {formatDate(profile.created_at)}</span>
          </div>

          <div className="flex gap-8 mt-8 text-sm text-neutral-500">
            <span>
              <strong className="text-white">{ratingsCount || 0}</strong>{" "}
              Ratings
            </span>
            <span>
              <strong className="text-white">{reviews?.length || 0}</strong>{" "}
              Reviews
            </span>
          </div>
        </div>

        <div className="mt-16 w-full">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
              Top Rated
            </h2>
            <Link
              href={`/profile/${params.username}/ratings`}
              className="text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-400 transition-colors flex items-center gap-1"
            >
              <span className="text-lg leading-none">→</span>
            </Link>
          </div>

          {topRatings && topRatings.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
                width: "100%",
              }}
            >
              {topRatings.map((rating) => (
                <Link
                  href={`/album/${rating.album_id}`}
                  key={rating.id}
                  className="block group relative aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 hover:border-neutral-500 transition-all"
                >
                  {rating.fetched_image || rating.album_image_url ? (
                    <img
                      src={rating.fetched_image || rating.album_image_url}
                      alt={rating.album_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                      <span className="text-xs text-neutral-600 font-bold">
                        {rating.fetched_name || rating.album_name || "Unknown"}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 bg-black/90 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white border border-white/10 shadow-lg">
                    {rating.rating}
                  </div>
                </Link>
              ))}

              {[...Array(4 - topRatings.length)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-neutral-900/30 rounded-lg border border-neutral-900 border-dashed"
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-neutral-800 rounded-xl">
              <p className="text-neutral-600 text-sm">No ratings yet.</p>
            </div>
          )}
        </div>

        <div className="mt-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
              Recent Reviews
            </h2>
            <Link
              href={`/profile/${params.username}/reviews`}
              className="text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-400 transition-colors flex items-center gap-1"
            >
              <span className="text-lg leading-none">→</span>
            </Link>
          </div>

          <div className="space-y-4">
            {reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="group bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 hover:border-neutral-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4 items-center">
                      {review.fetched_image && (
                        <img
                          src={review.fetched_image}
                          alt={review.album_name}
                          className="w-12 h-12 rounded object-cover shadow-sm"
                        />
                      )}

                      <div className="flex flex-col">
                        <Link
                          href={`/album/${review.album_id}`}
                          className="text-lg font-bold text-white hover:underline decoration-neutral-500 underline-offset-4"
                        >
                          {review.album_name || "Unknown Album"}
                        </Link>
                        <span className="text-sm text-neutral-500 font-medium">
                          {review.artist_name || "Unknown Artist"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-600 tabular-nums">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>

                      {review.rating !== null && (
                        <span className="bg-neutral-800 text-white text-xs font-bold px-2 py-1 rounded border border-neutral-700">
                          ★ {review.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap border-l-2 border-neutral-800 pl-4 ml-1">
                    {review.review_text}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center border border-dashed border-neutral-800 rounded-xl">
                <p className="text-neutral-600 text-sm">No reviews yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
