import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import HomeFeedClient from "@/components/home/HomeFeedClient";
import HottestAlbums from "@/components/home/HottestAlbums";
import SuggestedSyncs from "@/components/home/SuggestedSyncs";
import LogAlbumButton from "@/components/home/LogAlbumButton";
export const dynamic = "force-dynamic";

/**
 * Home page  (Server Component).
 *
 * This route checks the user's session on the server using Supabase.
 * If the user is logged in, we fetch their profile so we can render
 * the personalised hero section. Otherwise the page shows the generic
 * landing design with sign-in and register options.
 */
export default async function Home() {
  const supabase = await createClient();

  // Read the current user from the Supabase auth cookie on the server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username = null;

  // A second lookup is needed since the auth table only stores the UserID;
  // The readable username lives in the public "profiles" table.
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    username = profile?.username;
  }

  // Get the #1 hottest album for the hero section with new fall back system.
  let topAlbum: any = null;
  const tryRanges = [24, 24 * 7, 24 * 30, 24 * 365, null];
  for (const hours of tryRanges) {
    let q = supabase
      .from("reviews")
      .select("album_id, album_name, artist_name, album_image_url, rating, profiles!inner(is_private)")
      .eq("profiles.is_private", false);
    if (hours !== null) {
      const since = new Date();
      since.setHours(since.getHours() - hours);
      q = q.gte("created_at", since.toISOString());
    }
    const { data } = await q;
    if (data && data.length > 0) {
      const agg: Record<string, any> = {};
      data.forEach((r: any) => {
        if (!agg[r.album_id]) agg[r.album_id] = { album_id: r.album_id, name: r.album_name, artist: r.artist_name, image: r.album_image_url, logCount: 0, totalRating: 0, ratingCount: 0 };
        agg[r.album_id].logCount++;
        if (r.rating !== null) { agg[r.album_id].totalRating += r.rating; agg[r.album_id].ratingCount++; }
      });
      topAlbum = Object.values(agg).sort((a: any, b: any) => b.logCount - a.logCount)[0];
      break;
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen font-sans selection:bg-accent-red selection:text-white">
      <div className="relative border-b-[3px] border-black bg-white pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute top-8 left-8 text-xs font-mono font-bold tracking-[0.2em] opacity-40">
          "ISSUE 01"
        </div>
        <div className="absolute top-8 right-8 text-xs font-mono font-bold tracking-[0.2em] opacity-40">
          <span className="text-accent-red">REC.</span> 2026
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

          <div className="flex flex-col items-start text-left">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 text-black uppercase font-serif leading-none" style={{ fontVariantLigatures: 'none' }}>
              {username ? (
                <span className="block border-b-8 border-accent-red pb-4">{username}</span>
              ) : (
                "THE SYNCED"
              )}
            </h1>

            <p className="text-lg md:text-2xl text-black/70 mb-10 font-medium max-w-lg tracking-tight border-l-[4px] border-black pl-6">
              {username
                ? "See what dropped this week and what the community is saying."
                : "THE DEFINITIVE PLATFORM FOR TRACKING YOUR MUSIC HISTORY."}
            </p>

            <div className="flex flex-wrap gap-6 w-full">
              <LogAlbumButton />

              {username ? (
                <Link
                  href={`/profile/${username}`}
                  className="bg-black text-white font-bold px-10 py-4 hover:bg-black/80 transition-transform active:scale-95 text-xs uppercase tracking-[0.2em] border-2 border-black font-mono shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] flex items-center justify-center flex-1 min-w-[160px]"
                >
                  GO TO PROFILE
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="bg-transparent text-black font-bold px-10 py-4 transition-transform active:scale-95 text-xs uppercase tracking-[0.2em] border-2 border-black font-mono shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-black/5 hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] flex items-center justify-center flex-1 min-w-[140px]"
                  >
                    SIGN IN
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-accent-red text-white font-bold px-10 py-4 transition-transform active:scale-95 text-xs uppercase tracking-[0.2em] border-2 border-black font-mono shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] flex items-center justify-center flex-1 min-w-[140px]"
                  >
                    CREATE ACCOUNT
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Hottest Album */}
          <div className="w-full flex justify-center lg:justify-end mt-12 lg:mt-0">
            {topAlbum ? (
              <div className="flex flex-col border-[4px] border-black shadow-[16px_16px_0px_rgba(0,0,0,1)] bg-white p-6 md:p-8 w-full max-w-lg relative rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="absolute -top-5 -left-5 bg-accent-red text-white py-2 px-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] border-[3px] border-black flex items-center gap-2 z-20">
                  <span className="font-mono font-bold text-xl uppercase tracking-widest leading-none">NO.1</span>
                </div>

                <div className="flex justify-between items-end border-b-[4px] border-black pb-4 mb-6">
                  <span className="text-black font-mono font-black uppercase tracking-[0.2em] text-lg">
                    "HOTTEST RIGHT NOW"
                  </span>
                  <span className="text-black/50 font-mono text-xs uppercase tracking-widest font-bold">{topAlbum.logCount} LOGS</span>
                </div>

                <Link href={`/album/${topAlbum.album_id}`} className="group relative block aspect-square border-[4px] border-black overflow-hidden bg-black mb-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
                  {topAlbum.image ? (
                    <img src={topAlbum.image} alt={topAlbum.name} className="w-full h-full object-cover transition-all duration-500 scale-105 group-hover:scale-100" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gray-100">
                      <span className="text-xs text-black font-mono font-bold uppercase">NO IMAGE</span>
                    </div>
                  )}
                </Link>

                <div className="flex flex-col">
                  <Link href={`/album/${topAlbum.album_id}`} className="text-4xl font-black font-sans uppercase tracking-tight text-black hover:underline decoration-accent-red decoration-4 underline-offset-4 truncate leading-none pb-2">
                    {topAlbum.name}
                  </Link>
                  <span className="text-black/60 font-mono uppercase tracking-[0.2em] text-sm mt-1 truncate border-t-[2px] border-black/10 pt-3">{topAlbum.artist}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col border-[4px] border-black shadow-[16px_16px_0px_rgba(0,0,0,1)] bg-white p-8 w-full max-w-lg min-h-[400px] items-center justify-center grayscale opacity-50">
                <span className="text-black/40 font-mono font-bold uppercase tracking-[0.2em] text-xl">NO DATA YET</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative items-start">

          <div className="lg:col-span-8 flex flex-col gap-8">
            <HomeFeedClient user={user} />
          </div>

          <div className="lg:col-span-4 sticky top-8 flex flex-col gap-10">
            <HottestAlbums />
            <SuggestedSyncs userId={user?.id} />
          </div>

        </div>
      </div>
    </div>
  );
}
