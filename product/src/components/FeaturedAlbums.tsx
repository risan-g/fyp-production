import { fetchSpotifyData } from "@/lib/spotify";
import Link from "next/link";

// Hard-coded list of Spotify album IDs to highlight on the landing page
const FEATURED_ALBUM_IDS = [
  "4eLPsYPBmXABThSJ821sqY", // 1
  "7txGsnDSqVMoRl6RQ9XyZP", // 2
  "7gsWAHLeT0w7es6FofOXk1", // 3
  "3mH6qwIy9crq0I9YQbOuDf", // 4
  "6rzMufuu8sLkIizM4q9c7J", // 5
];

/**
 * FeaturedAlbums (Server Component)
 *
 * Renders a curated row of featured albums using the Spotify API.
 */
export default async function FeaturedAlbums() {
  // Fetch metadata for each featured album in parallel
  const albums = await Promise.all(
    FEATURED_ALBUM_IDS.map((id) =>
      fetchSpotifyData(`https://api.spotify.com/v1/albums/${id}`)
    )
  );

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Featured Albums</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-neutral-800 to-transparent ml-6" />
      </div>

      {/* Album row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {albums.map((album) => (
          <Link
            key={album.id}
            href={`/album/${album.id}`}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-neutral-900">
              {album.images?.[0] && (
                <img
                  src={album.images[0].url}
                  alt={album.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:underline">
                {album.name}
              </h3>
              <p className="text-xs text-neutral-400 line-clamp-1">
                {album.artists.map((artist: any) => artist.name).join(", ")}
              </p>
              <p className="text-xs text-neutral-500">
                {album.release_date.slice(0, 4)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
