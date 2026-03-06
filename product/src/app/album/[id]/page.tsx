import { fetchSpotifyData } from "@/lib/spotify";
import ArtistLink from "@/components/ArtistLink";
import Rating from "@/components/Rating";
import AverageRating from "@/components/AverageRating";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";

/**
 * Album Page (Server Component).
 *
 * This page fetches the specific data for an album using its ID.
 * It displays the cover art, allows users to rate/review the album,
 * and lists all the tracks with their durations.
 */
export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch the album details.
  const album = await fetchSpotifyData(
    `https://api.spotify.com/v1/albums/${id}`,
  );

  // Calculate the total length of the album.
  const totalDurationMs = album.tracks.items.reduce(
    (acc: number, track: any) => acc + track.duration_ms,
    0,
  );
  const totalMinutes = Math.floor(totalDurationMs / 60000);
  const totalSeconds = String(
    Math.floor((totalDurationMs % 60000) / 1000),
  ).padStart(2, "0");
  const durationString = `${totalMinutes}:${totalSeconds}`;

  // The image for the database cache
  const albumImage = album.images?.[0]?.url || "";

  return (
    <div className="bg-white text-black min-h-screen p-8">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-x-12 items-start max-w-7xl mx-auto pt-16">
        <div className="flex flex-col gap-6">
          {albumImage ? (
            <div className="w-full aspect-square border-[3px] border-black shadow-[16px_16px_0px_rgba(0,0,0,1)] relative group">
              <img
                src={albumImage}
                alt={album.name}
                className="w-full h-full object-cover transition-all duration-500 relative z-10"
              />
              <div className="absolute top-2 left-2 w-full h-full bg-black/10 z-0"></div>
            </div>
          ) : (
            <div className="w-full aspect-square border-[3px] border-black bg-neutral-100 flex items-center justify-center shadow-[16px_16px_0px_rgba(0,0,0,1)]">
              <span className="font-mono text-black">NO IMAGE</span>
            </div>
          )}

          {/* Passed albumImage to Rating so it can cache it. */}
          <Rating
            albumId={album.id}
            albumName={album.name}
            artistName={album.artists[0]?.name || "Unknown Artist"}
            albumImage={albumImage}
          />

          {/* Passed metadata to ReviewForm so it can cache it. */}
          <ReviewForm
            albumId={album.id}
            albumName={album.name}
            artistName={album.artists[0]?.name || "Unknown Artist"}
            albumImage={albumImage}
          />
        </div>
        <div className="flex flex-col gap-12 mt-8 md:mt-0">
          {/* Album Header & Stats */}
          <div className="flex justify-between items-start border-b-[3px] border-black pb-8">
            <div className="max-w-xl">
              <h1 className="text-6xl md:text-8xl font-serif font-black mb-4 uppercase tracking-tighter leading-none text-black">
                {album.name}
              </h1>
              <div className="text-black font-sans font-bold text-3xl uppercase tracking-tight mb-4 hover:underline decoration-accent-red decoration-4 underline-offset-8 transition-all inline-block">
                <ArtistLink artists={album.artists} />
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-black/60 uppercase tracking-[0.2em] mt-2">
                <span>{album.release_date.slice(0, 4)}</span>
                <span className="w-1 h-1 bg-black/30"></span>
                <span>
                  {album.total_tracks}{" "}
                  {album.total_tracks === 1 ? "TRACK" : "TRACKS"}
                </span>
                <span className="w-1 h-1 bg-black/30"></span>
                <span>{durationString}</span>
              </div>
            </div>
            <div className="scale-125 origin-top-right">
              <AverageRating albumId={album.id} />
            </div>
          </div>

          {/* Tracklist Table */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-sm text-black font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-red flex-shrink-0"></span>
                "TRACKLIST"
              </h2>
            </div>
            <ul className="flex flex-col">
              {album.tracks.items.map((track: any, index: number) => (
                <li
                  key={track.id}
                  className="py-4 flex justify-between items-center group border-b-[2px] border-black/10 last:border-b-0 hover:bg-neutral-100 px-4 -mx-4 transition-colors duration-200 cursor-default"
                >
                  <div className="flex flex-col space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-4">
                      <span className="text-black/40 font-mono font-bold text-xs w-8 group-hover:text-accent-red transition-colors">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="truncate font-bold font-sans text-lg text-black uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4 decoration-black/20">
                        {track.name}
                      </span>
                      {track.explicit && (
                        <span className="text-[10px] bg-black text-white px-2 py-0.5 font-mono font-bold uppercase tracking-widest flex-shrink-0">
                          E
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-black/50 font-mono uppercase tracking-[0.2em] pl-12 group-hover:text-black/70">
                      <ArtistLink artists={track.artists} />
                    </div>
                  </div>

                  {/* Track Duration */}
                  <span className="text-black/40 font-mono font-bold text-xs ml-4 flex-shrink-0 group-hover:text-black">
                    {Math.floor(track.duration_ms / 60000)}:
                    {String(
                      Math.floor((track.duration_ms % 60000) / 1000),
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
