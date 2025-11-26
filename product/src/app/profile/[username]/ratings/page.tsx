import { createClient } from "@/lib/supabase/server";
import { fetchSpotifyData } from "@/lib/spotify";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AllRatingsPage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = await createClient();
  const username = decodeURIComponent(params.username);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", username)
    .single();

  if (!profile) return notFound();

  const { data: rawRatings } = await supabase
    .from("album_ratings")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const ratings = rawRatings
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
              fetched_artist:
                spotifyAlbum.artists?.[0]?.name || "Unknown Artist",
              fetched_year: spotifyAlbum.release_date?.slice(0, 4) || "",
            };
          } catch (e) {
            return rating;
          }
        })
      )
    : [];

  return (
    <div className="bg-black text-white min-h-screen p-8">
      <div className="max-w-7xl mx-auto pt-8">
        <div className="flex items-center gap-6 mb-16 border-b border-neutral-800 pb-8">
          <Link
            href={`/profile/${params.username}`}
            className="group flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-colors"
          >
            <span className="text-xl group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
          </Link>

          <div className="flex flex-col">
            <h1 className="text-4xl font-bold tracking-tight">Library</h1>
            <p className="text-neutral-500 text-sm uppercase tracking-widest font-medium mt-1">
              Rated by {profile.username}
            </p>
          </div>
        </div>

        {ratings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
            {ratings.map((rating) => (
              <Link
                href={`/album/${rating.album_id}`}
                key={rating.id}
                className="group flex flex-col gap-3"
              >
                <div className="relative aspect-square bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-sm group-hover:border-neutral-600 transition-colors">
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

                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white border border-white/10 shadow-lg">
                    {rating.rating}
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white truncate group-hover:text-neutral-300 transition-colors">
                    {rating.fetched_name || rating.album_name}
                  </span>
                  <span className="text-xs text-neutral-500 truncate">
                    {rating.fetched_artist || rating.artist_name}
                    {rating.fetched_year && ` • ${rating.fetched_year}`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-neutral-800 rounded-xl">
            <p className="text-neutral-500">No ratings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
