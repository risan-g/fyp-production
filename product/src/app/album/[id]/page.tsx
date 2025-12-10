import { fetchSpotifyData } from "@/lib/spotify";
import ArtistLink from "@/components/ArtistLink";
import Rating from "@/components/Rating";
import AverageRating from "@/components/AverageRating";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";

/**
 * Album Detail Page (Server Component).
 *
 * This page fetches the specific data for an album using its ID.
 * It displays the cover art, allows users to rate/review the album,
 * and lists all the tracks with their durations.
 */
export default async function AlbumPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // Fetch the album details.
  const album = await fetchSpotifyData(
    `https://api.spotify.com/v1/albums/${id}`
  );

  // Calculate the total length of the album.
  const totalDurationMs = album.tracks.items.reduce(
    (acc: number, track: any) => acc + track.duration_ms,
    0
  );
  const totalMinutes = Math.floor(totalDurationMs / 60000);
  const totalSeconds = String(
    Math.floor((totalDurationMs % 60000) / 1000)
  ).padStart(2, "0");
  const durationString = `${totalMinutes}:${totalSeconds}`;

  return (
    <div className="bg-black text-white min-h-screen p-8">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-x-8 items-start">
        <div className="flex flex-col gap-6">
          {album.images?.[0] && (
            <img
              src={album.images[0].url}
              alt={album.name}
              className="w-full aspect-square object-cover shadow-lg rounded-lg"
            />
          )}
          <Rating
            albumId={album.id}
            albumName={album.name}
            artistName={album.artists[0]?.name || "Unknown Artist"}
          />

          <ReviewForm albumId={album.id} />
        </div>
        <div className="flex flex-col gap-8">
          {/* Album Header & Stats */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-6xl font-bold mb-2">{album.name}</h1>
              <p className="text-gray-400 text-3xl">
                <ArtistLink artists={album.artists} />
              </p>
              <p className="text-gray-500 text-lg mt-1">
                {album.release_date.slice(0, 4)}
              </p>
              <p className="text-gray-500 text-lg mt-1">
                {album.total_tracks}{" "}
                {album.total_tracks === 1 ? "track" : "tracks"} •{" "}
                {durationString}
              </p>
            </div>
            <AverageRating albumId={album.id} />
          </div>

          {/* Tracklist Table */}
          <div>
            <ul className="divide-y divide-gray-800">
              {album.tracks.items.map((track: any, index: number) => (
                <li
                  key={track.id}
                  className="py-3 flex justify-between items-center hover:bg-gray-900 rounded px-2 transition-colors duration-200"
                >
                  <div className="flex flex-col space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 text-sm w-8">
                        {index + 1}.
                      </span>
                      <span className="truncate">{track.name}</span>
                      {track.explicit && (
                        <span className="text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded flex-shrink-0">
                          E
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 text-sm pl-10">
                      <ArtistLink artists={track.artists} />
                    </div>
                  </div>

                  {/* Track Duration */}
                  <span className="text-gray-500 text-sm ml-4 flex-shrink-0">
                    {Math.floor(track.duration_ms / 60000)}:
                    {String(
                      Math.floor((track.duration_ms % 60000) / 1000)
                    ).padStart(2, "0")}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* User Reviews List */}
          <ReviewList albumId={album.id} />
        </div>{" "}
      </div>{" "}
    </div>
  );
}
