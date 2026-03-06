import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSpotifyData } from "@/lib/spotify";
import DiscographySection from "@/components/DiscographySection";
import { createClient } from "@/lib/supabase/server";
import RotationButton from "@/components/RotationButton";

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
    `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single,compilation&limit=50`,
  );
}

/**
 * Artist Page (Server Component)
 * Acts as the primary profile view for an artist, displaying metadata,
 * community stats (Global Rotation), and a categorised discography history.
 */
export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // determine if current user still follows this artist
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  /**
   * Uses allSettled to fetch Spotify Data AND Supabase Data simultaneously.
   */
  const [artistRes, albumsRes, globalCountRes, userStatusRes] =
    await Promise.allSettled([
      // Artist Metadata
      fetchArtist(id),

      // Discography
      fetchAlbums(id),

      // Global Rotation Count
      // Leverages the DB index to instantly count how many users follow this artist.
      supabase
        .from("artist_follows")
        .select("*", { count: "exact", head: true })
        .eq("spotify_artist_id", id),

      // User's Status
      // Checks if the current authenticated user has this artist in their rotation.
      currentUser
        ? supabase
          .from("artist_follows")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("spotify_artist_id", id)
          .single()
        : Promise.resolve({ data: null }),
    ]);

  // Validate the artist profile; if the core data fetch fails, trigger a 404 error.
  const artist = artistRes.status === "fulfilled" ? artistRes.value : null;
  if (!artist || artist.error) return notFound();

  // Initialise albums array, defaulting to an empty list if the fetch was unsuccessful.
  const rawAlbums =
    albumsRes.status === "fulfilled" ? albumsRes.value?.items : [];

  // Extract the count and status, defaulting to 0/false if fetch failed.
  const globalRotationCount =
    globalCountRes.status === "fulfilled" ? globalCountRes.value.count || 0 : 0;

  const isInRotation =
    userStatusRes.status === "fulfilled" && !!userStatusRes.value.data;

  /**
   * Removes duplicate release names
   */
  const uniqueAlbums = Array.from(
    new Map(rawAlbums.map((a: any) => [a.name, a])).values(),
  );

  /**
   * Filters the flat Spotify list into semantic groups based on track count and type.
   */
  const discography = {
    albums: uniqueAlbums.filter((a: any) => a.album_type === "album"),
    eps: uniqueAlbums.filter(
      (a: any) => a.album_type === "single" && a.total_tracks > 3,
    ),
    singles: uniqueAlbums.filter(
      (a: any) => a.album_type === "single" && a.total_tracks <= 3,
    ),
    compilations: uniqueAlbums.filter(
      (a: any) => a.album_type === "compilation",
    ),
  };

  const artistImage = artist.images?.[0]?.url;

  return (
    <div className="bg-white text-black min-h-screen pb-24 font-sans">
      {/*Creates a repeated film-strip effect using the artist's profile image */}
      <div
        className="relative w-full overflow-hidden border-b-[3px] border-black bg-black"
        style={{ height: "40vh", minHeight: "400px" }}
      >
        {artistImage && (
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage: `url(${artistImage})`,
              backgroundSize: "auto 100%",
              backgroundRepeat: "repeat-x",
              backgroundPosition: "center",
              filter: "grayscale(100%) contrast(150%)",
            }}
          />
        )}
      </div>

      <div className="flex flex-col items-center text-center px-4 mt-12 max-w-6xl mx-auto">
        <h1 className="text-7xl md:text-9xl font-serif font-black uppercase tracking-tighter text-black leading-none bg-white px-8 py-4 border-[3px] border-black shadow-[16px_16px_0px_rgba(0,0,0,1)] -mt-32 relative z-10">
          {artist.name}
        </h1>

        {/* Maps and displays the first four genre identifiers */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {artist.genres?.slice(0, 4).map((genre: string) => (
            <span
              key={genre}
              className="uppercase tracking-[0.2em] text-[10px] font-mono font-bold text-black border-[3px] border-black bg-white px-4 py-2 shadow-[4px_4px_0px_rgba(0,0,0,1)]"
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Allows users to add artist to their taste profile */}
        <div className="mt-12 flex flex-col items-center gap-6">
          {currentUser ? (
            <RotationButton
              spotifyArtistId={id}
              artistName={artist.name}
              artistImageUrl={artistImage}
              initialIsInRotation={isInRotation}
            />
          ) : (
            <Link
              href="/sign-in"
              className="px-8 py-4 bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] text-black font-mono font-bold uppercase tracking-[0.2em] text-xs hover:bg-black hover:text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
            >
              Sign In to Add
            </Link>
          )}

          {/* Displays the total number of users following this artist */}
          <div className="text-black/60 text-[10px] font-mono uppercase tracking-[0.2em] font-bold mt-2 bg-neutral-100 px-4 py-2 border-[2px] border-black/10">
            <strong className="text-black">{globalRotationCount}</strong>{" "}
            {globalRotationCount === 1 ? "LISTENER" : "LISTENERS"} IN ROTATION
          </div>
        </div>
      </div>

      {/* Main Discography Section */}
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
