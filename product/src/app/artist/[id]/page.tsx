import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSpotifyData } from "@/lib/spotify";
import DiscographySection from "@/components/DiscographySection";

/**
 * Helper function to fetch the main artist profile metadata.
 */
async function fetchArtist(id: string) {
  return await fetchSpotifyData(`https://api.spotify.com/v1/artists/${id}`);
}

/**
 * Helper to fetch the artist's full discography.
 * Requests albums, singles, and compilations in a single batch to optimise performance.
 */
async function fetchAlbums(id: string) {
  return await fetchSpotifyData(
    `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single,compilation&limit=50`
  );
}

/**
 * Artist Page (Server Component)
 * Acts as the primary profile view for an artist, displaying metadata
 * and a categorised discography history.
 */
export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /**
   * Parallel Execution:
   * Uses allSettled to fetch profile and discography data simultaneously.
   * This prevents sequential "waterfalling" of requests, reducing total load time.
   */
  const [artistRes, albumsRes] = await Promise.allSettled([
    fetchArtist(id),
    fetchAlbums(id),
  ]);

  // Validate the artist profile; if the core data fetch fails, trigger a 404 error.
  const artist = artistRes.status === "fulfilled" ? artistRes.value : null;
  if (!artist || artist.error) return notFound();

  // Initialise albums array, defaulting to an empty list if the fetch was unsuccessful.
  const rawAlbums =
    albumsRes.status === "fulfilled" ? albumsRes.value?.items : [];

  /**
   * Deduplication Logic:
   * Removes duplicate release names (e.g., Deluxe vs Standard versions)
   * to ensure a cleaner visual presentation of the discography.
   */
  const uniqueAlbums = Array.from(
    new Map(rawAlbums.map((a: any) => [a.name, a])).values()
  );

  /**
   * Data Categorisation:
   * Filters the flat Spotify list into semantic groups based on track count and type.
   * This allows the UI to distinguish between full Albums, EPs, and Singles.
   */
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
      {/* Decorative Header: Creates a repeated film-strip effect using the artist's profile image */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "40vh", minHeight: "400px" }}
      >
        {artistImage && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${artistImage})`,
              backgroundSize: "auto 100%",
              backgroundRepeat: "repeat-x",
              backgroundPosition: "center",
              filter: "grayscale(100%)", // Matches the dark, minimalist aesthetic
              opacity: 1,
            }}
          />
        )}
      </div>

      <div className="flex flex-col items-center text-center px-4 mt-12">
        <h1 className="text-5xl md:text-7xl font-medium text-white leading-tight">
          {artist.name}
        </h1>

        {/* Genre Tags: Maps and displays the first four genre identifiers */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {artist.genres?.slice(0, 4).map((genre: string) => (
            <span
              key={genre}
              className="uppercase tracking-widest text-xs font-bold text-neutral-400 border border-neutral-800 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>

      {/* Main Discography Sections: Rendered using the categorised data objects */}
      <div className="max-w-7xl mx-auto px-6 mt-12">
        <DiscographySection title="Albums" items={discography.albums} />
        <div className="mt-16">
          <DiscographySection title="EPs" items={discography.eps} />
        </div>
        <div className="mt-16">
          <DiscographySection title="Singles" items={discography.singles} />
        </div>
        <div className="mt-16">
          <DiscographySection
            title="Compilations"
            items={discography.compilations}
          />
        </div>
      </div>
    </div>
  );
}
