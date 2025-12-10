import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSpotifyData } from "@/lib/spotify";
import DiscographySection from "@/components/DiscographySection";

// Helper function to fetch the main artist profile.
async function fetchArtist(id: string) {
  return await fetchSpotifyData(`https://api.spotify.com/v1/artists/${id}`);
}

// Helper to fetch the artist's full discography.
// We request albums, singles, and compilations in one go to keep it fast.
async function fetchAlbums(id: string) {
  return await fetchSpotifyData(
    `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single,compilation&limit=50`
  );
}

/**
 * Artist Page (Server Component).
 *
 * This page acts as the main profile view for an artist. It fetches the
 * artist's details and their music history in parallel.
 */
export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // We use allSettled so the page attempts to load everything at once.
  // If the albums fail to load, we can still show the artist profile.
  const [artistRes, albumsRes] = await Promise.allSettled([
    fetchArtist(id),
    fetchAlbums(id),
  ]);

  // Check for the Artist.
  // The artist profile is required. If this fails, we show a 404 page.
  const artist = artistRes.status === "fulfilled" ? artistRes.value : null;
  if (!artist || artist.error) return notFound();

  // Safely get the albums (default to empty list if fetch failed).
  const rawAlbums =
    albumsRes.status === "fulfilled" ? albumsRes.value?.items : [];

  const uniqueAlbums = Array.from(
    new Map(rawAlbums.map((a: any) => [a.name, a])).values()
  );

  // Sort the releases into semantic groups for the grid layout.
  const discography = {
    albums: uniqueAlbums.filter((a: any) => a.album_type === "album"),
    eps: uniqueAlbums.filter(
      (a: any) => a.album_type === "single" && a.total_tracks > 3
    ),
    singles: uniqueAlbums.filter(
      (a: any) => a.album_type === "single" && a.total_tracks <= 3
    ),
    compilations: uniqueAlbums.filter(
      (a: any) => a.album_type === "compilation"
    ),
  };

  const artistImage = artist.images?.[0]?.url;

  return (
    <div className="bg-black text-white min-h-screen pb-24">
      {/* Uses background-repeat to create a repeated strip across the screen */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "45vh", minHeight: "400px" }}
      >
        {artistImage && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${artistImage})`,
              backgroundSize: "auto 100%",
              backgroundRepeat: "repeat-x",
              backgroundPosition: "center",
              filter: "grayscale(100%) contrast(110%)",
            }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      {/* Identity Header */}
      <div className="relative z-10 mt-8 flex flex-col items-center text-center px-4">
        <h1 className="text-7xl md:text-[8rem] lg:text-[10rem] font-black tracking-tighter text-white leading-none drop-shadow-2xl">
          {artist.name}
        </h1>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {artist.genres?.slice(0, 4).map((genre: string) => (
            <span
              key={genre}
              className="
                uppercase tracking-widest text-xs font-bold 
                text-neutral-400 border border-neutral-800 
                bg-black/50 backdrop-blur-md 
                px-4 py-2 rounded-full
              "
            >
              {genre}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-24">
          <DiscographySection title="Albums" items={discography.albums} />
          <DiscographySection title="EPs" items={discography.eps} />
          <DiscographySection title="Singles" items={discography.singles} />
          <DiscographySection
            title="Compilations"
            items={discography.compilations}
          />
        </div>
      </div>
    </div>
  );
}
