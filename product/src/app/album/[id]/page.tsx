import { fetchSpotifyData } from "@/lib/spotify";
import ArtistLink from "@/components/ArtistLink";
import Rating from "@/components/Rating";
import AlbumReview from "@/components/Review";

export default async function AlbumPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const album = await fetchSpotifyData(
    `https://api.spotify.com/v1/albums/${id}`
  );

  return (
    <div className="bg-black text-white min-h-screen p-8">
      <div className="flex flex-col md:flex-row gap-6 items-center mb-8">
        {album.images?.[0] && (
          <img
            src={album.images[0].url}
            alt={album.name}
            className="w-60 h-60 object-cover shadow-lg"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">{album.name}</h1>
          <p className="text-gray-400 mt-2">
            <ArtistLink artists={album.artists} /> •{" "}
            {album.release_date.slice(0, 4)} • {album.total_tracks}{" "}
            {album.total_tracks === 1 ? "track" : "tracks"}
          </p>
        </div>
      </div>

      <div>
        <ul className="divide-y divide-gray-700">
          {album.tracks.items.map((track: any, index: number) => (
            <li
              key={track.id}
              className="py-4 flex justify-between items-center hover:bg-gray-700 rounded px-2 transition-colors duration-200"
            >
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-red-300">{index + 1}.</span>
                  <span>{track.name}</span>
                  {track.explicit && (
                    <span className="text-xs bg-purple-600 text-white px-1 rounded">
                      e
                    </span>
                  )}
                </div>
                <div className="text-blue-400 text-sm">
                  <ArtistLink artists={track.artists} />
                </div>
              </div>
              <span className="text-gray-400 text-sm">
                {Math.floor(track.duration_ms / 60000)}:
                {String(
                  Math.floor((track.duration_ms % 60000) / 1000)
                ).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
