import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSpotifyData } from "@/lib/spotify";
import DiscographySection from "@/components/DiscographySection";
import { createClient } from "@/lib/supabase/server";
import RotationButton from "@/components/RotationButton";

const SCHOOLBOY_Q_ID = "5IcR3N7QB1j6KBL8eImZ8m";
const MF_DOOM_ID = "2pAWfrd7WFF3XhVt9GooDL";
/**
 * ScHoolboy Q Easter Egg: capitalises tHe first letter and every "H" in a string.
 * All otHer letters are lowercase. Mirrors Q's signature typing style.
 */
function scHoolboyTransform(text: string): string {
  return text
    .split("")
    .map((char, i) => {
      if (i === 0) return char.toUpperCase();
      if (char.toLowerCase() === "h") return "H";
      return char.toLowerCase();
    })
    .join("");
}

/**
 * MF DOOM Easter Egg: ALL CAPS when you spell the man name.
 */
function doomTransform(text: string): string {
  return text.toLowerCase();
}

async function fetchArtist(id: string) {
  return await fetchSpotifyData(`https://api.spotify.com/v1/artists/${id}`);
}

async function fetchAlbums(id: string) {
  return await fetchSpotifyData(
    `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single,compilation&limit=50`,
  );
}

interface SpotifyAlbumSummary {
  id: string;
  name: string;
  album_type: string;
  total_tracks: number;
  images?: { url: string }[];
  release_date?: string;
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
      fetchArtist(id),
      fetchAlbums(id),
      supabase
        .from("artist_follows")
        .select("*", { count: "exact", head: true })
        .eq("spotify_artist_id", id),
      currentUser
        ? supabase
          .from("artist_follows")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("spotify_artist_id", id)
          .single()
        : Promise.resolve({ data: null }),
    ]);

  const artist = artistRes.status === "fulfilled" ? artistRes.value : null;
  if (!artist || artist.error) return notFound();

  const rawAlbums =
    albumsRes.status === "fulfilled" ? albumsRes.value?.items : [];

  const globalRotationCount =
    globalCountRes.status === "fulfilled" ? globalCountRes.value.count || 0 : 0;

  const isInRotation =
    userStatusRes.status === "fulfilled" && !!userStatusRes.value.data;

  const albumItems = (rawAlbums || []) as SpotifyAlbumSummary[];

  const uniqueAlbums = Array.from(
    new Map(albumItems.map((a) => [a.name, a])).values(),
  );

  const discography = {
    albums: uniqueAlbums.filter((a) => a.album_type === "album"),
    eps: uniqueAlbums.filter(
      (a) => a.album_type === "single" && a.total_tracks > 3,
    ),
    singles: uniqueAlbums.filter(
      (a) => a.album_type === "single" && a.total_tracks <= 3,
    ),
    compilations: uniqueAlbums.filter(
      (a) => a.album_type === "compilation",
    ),
  };

  const artistImage = artist.images?.[0]?.url;

  // Easter egg
  const isQ = id === SCHOOLBOY_Q_ID;
  const isDoom = id === MF_DOOM_ID;
  const hasEasterEgg = isQ || isDoom;
  const formatText = (text: string) => {
    if (isQ) return scHoolboyTransform(text);
    if (isDoom) return doomTransform(text);
    return text;
  };

  return (
    <div className="bg-white text-black min-h-screen pb-24 font-sans">
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
        <h1 className={`text-7xl md:text-9xl font-serif font-black tracking-tighter text-black leading-none bg-white px-8 py-4 border-[3px] border-black shadow-[16px_16px_0px_rgba(0,0,0,1)] -mt-32 relative z-10 ${hasEasterEgg ? "" : "uppercase"}`}>
          {artist.name}
        </h1>

        <Link
          href={`/artist/${id}/wall`}
          className={`mt-6 font-mono font-bold text-sm tracking-[0.3em] text-black border-b-[2px] border-transparent hover:border-accent-red hover:text-accent-red transition-all ${hasEasterEgg ? "" : "uppercase"}`}
        >
          {formatText("[ WALL ]")}
        </Link>


        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {artist.genres?.slice(0, 4).map((genre: string) => (
            <span
              key={genre}
              className={`tracking-[0.2em] text-[10px] font-mono font-bold text-black border-[3px] border-black bg-white px-4 py-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] ${hasEasterEgg ? "" : "uppercase"}`}
            >
              {formatText(genre)}
            </span>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-6">
          {currentUser ? (
            <RotationButton
              spotifyArtistId={id}
              artistName={artist.name}
              artistImageUrl={artistImage}
              initialIsInRotation={isInRotation}
              easterEgg={isQ ? "q" : isDoom ? "doom" : undefined}
            />
          ) : (
            <Link
              href="/sign-in"
              className={`px-8 py-4 bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] text-black font-mono font-bold tracking-[0.2em] text-xs hover:bg-black hover:text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all ${hasEasterEgg ? "" : "uppercase"}`}
            >
              {formatText("Sign In to Add")}
            </Link>
          )}

          <div className={`text-black/60 text-[10px] font-mono tracking-[0.2em] font-bold mt-2 bg-neutral-100 px-4 py-2 border-[2px] border-black/10 ${hasEasterEgg ? "" : "uppercase"}`}>
            <strong className="text-black">{globalRotationCount}</strong>{" "}
            {formatText(globalRotationCount === 1 ? "Listener in Rotation" : "Listeners in Rotation")}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <DiscographySection title={formatText("Albums")} items={discography.albums} easterEgg={isQ ? "q" : isDoom ? "doom" : undefined} />
        <div className="mt-16">
          <DiscographySection title={formatText("EPs")} items={discography.eps} easterEgg={isQ ? "q" : isDoom ? "doom" : undefined} />
        </div>
        <div className="mt-16">
          <DiscographySection title={formatText("Singles")} items={discography.singles} easterEgg={isQ ? "q" : isDoom ? "doom" : undefined} />
        </div>
        <div className="mt-16">
          <DiscographySection
            title={formatText("Compilations")}
            items={discography.compilations}
            easterEgg={isQ ? "q" : isDoom ? "doom" : undefined}
          />
        </div>
      </div>
    </div>
  );
}