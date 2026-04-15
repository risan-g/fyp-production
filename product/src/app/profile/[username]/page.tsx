/** 
 * User profile page.
 * Fetches all social and listening data in parallel, with a rigid privacy guard for non-synced visitors. 
 */
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import AvatarUpload from "@/components/Avatar-Upload";
import SyncButton from "@/components/SyncButton";
import ProfileStats from "@/components/ProfileStats";
import CurrentlyPlaying from "@/components/CurrentlyPlaying";
import { getPublishedPlaylists } from "@/app/actions/playlists";
import { getCachedTopArtists } from "@/app/actions/spotify-stats";
import TopArtistsRow from "@/components/spotify/TopArtistsRow";
import ShareButton from "@/components/ShareButton";
import { Metadata } from "next";

/**
 * Format dates into a readable string.
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

/**
 * Dynamic SEO and social metadata generation.
 * Pulls the user's avatar and bio for rich link previews (Twitter Cards/Open Graph).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, bio")
    .ilike("username", username)
    .single();

  if (!profile) return { title: "PROFILE NOT FOUND | DOTWV" };

  const title = `${profile.username.toUpperCase()} | DOTWV ARCHIVE`;
  const description = profile.bio || `Explore ${profile.username}'s archived music and rotation on DotWV.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

/**
 * ProfilePage (React Server Component)
 *
 * Orchestrates the rendering of the user's identity, stats, heavy rotation, and review archive.
 */
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const supabase = await createClient();
  const username = decodeURIComponent(rawUsername);

  /**
   * Get Current Session
   * Check if the person viewing the page is logged in.
   */
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  /**
   * Retrieves basic user details for the profile being viewed.
   */
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, created_at, avatar_url, is_private, show_currently_playing, show_top_artists, show_playlists, bio")
    .ilike("username", username)
    .single();

  if (profileError) console.error("Profile Query Error:", profileError);

  if (!profile) return notFound();

  const isOwnProfile = currentUser?.id === profile.id;

  /**
   * Parallel Data Fetching.
   * We execute all 10 network requests concurrently via Promise.all 
   * to completely bypass traditional waterfall rendering delays.
   */
  const [
    syncCountData,
    rotationCountData,
    amIFollowingData,
    areTheyFollowingMeData,
    ratingsCountData,
    reviewsCountData,
    topRatingsData,
    recentReviewsData,
    publishedPlaylistsData,
    cachedTopArtistsData,
  ] = await Promise.all([
    supabase.rpc("get_sync_count", { target_user_id: profile.id }),

    // Rotation Count
    supabase
      .from("artist_follows")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id),

    // Relationship Check. Is User A following or requesting to follow User B
    currentUser && !isOwnProfile
      ? supabase
        .from("follows")
        .select("*")
        .eq("follower_id", currentUser.id)
        .eq("following_id", profile.id)
        .single()
      : Promise.resolve({ data: null }),

    // Relationship Check: Is User B following User A.
    currentUser && !isOwnProfile
      ? supabase
        .from("follows")
        .select("*")
        .eq("follower_id", profile.id)
        .eq("following_id", currentUser.id)
        .single()
      : Promise.resolve({ data: null }),

    // Count Ratings
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .not("rating", "is", null),

    // Count Reviews
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .not("content", "is", null)
      .neq("content", ""),

    // Get 4 highest rated albums
    supabase
      .from("reviews")
      .select("*")
      .eq("user_id", profile.id)
      .not("rating", "is", null)
      .order("rating", { ascending: false })
      .limit(4),

    // Get 3 most recent texts
    supabase
      .from("reviews")
      .select("*")
      .eq("user_id", profile.id)
      .not("content", "is", null)
      .neq("content", "")
      .order("created_at", { ascending: false })
      .limit(3),

    // Get published playlists
    getPublishedPlaylists(profile.id),

    // Get cached top artists
    getCachedTopArtists(profile.id),
  ]);

  /**
   * Process Data
   * Normalise database results into clean variables for the UI.
   */
  const syncCount = syncCountData.data || 0;
  const rotationCount = rotationCountData.count || 0;

  const isFollowing = amIFollowingData.data?.status === "accepted";
  const isPending = amIFollowingData.data?.status === "pending";
  const isFollower = !!areTheyFollowingMeData.data;

  // Strict RLS emulation on the frontend layout level.
  // We only render private data if the visitor is the owner or an accepted Sync.
  const isApprovedToView = isOwnProfile || (profile.is_private === false) || (profile.is_private === true && isFollowing);

  const ratingsCount = ratingsCountData.count || 0;
  const reviewsCount = reviewsCountData.count || 0;
  const topRatings = topRatingsData.data || [];
  const recentReviews = recentReviewsData.data || [];
  const publishedPlaylists = publishedPlaylistsData || [];
  const cachedTopArtists = cachedTopArtistsData || [];

  // Check if the profile owner has Spotify linked (only relevant for own profile refresh)
  let isSpotifyLinked = false;
  if (isOwnProfile) {
    const { data: identitiesData } = await supabase.auth.getUserIdentities();
    isSpotifyLinked = !!identitiesData?.identities?.find((id: any) => id.provider === "spotify");
  }

  return (
    <div className="bg-white text-black min-h-screen p-8">
      <div className="max-w-4xl mx-auto pt-24 relative">
        {/* Profile Header Section */}
        <div className="flex flex-col items-center text-center pb-12 border-b-[3px] border-black">

          {/* Privacy Status Badge*/}
          {isOwnProfile && (
            <div className={`mb-8 inline-flex items-center gap-2 px-4 py-2 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] text-xs font-mono font-bold tracking-[0.2em] ${profile.is_private ? "bg-accent-red text-white" : "bg-white text-black"}`}>
              <span>{profile.is_private ? "<-> PRIVATE <->" : "<o> PUBLIC <o>"}</span>
            </div>
          )}

          {/* Avatar */}
          <div className="mb-6">
            <AvatarUpload
              uid={profile.id}
              url={profile.avatar_url}
              username={profile.username}
              editable={isOwnProfile}
              size={128}
            />
          </div>

          {/* Username*/}
          <h1 className="text-6xl md:text-8xl font-serif font-black mb-1 tracking-tighter text-black uppercase">
            {profile.username}
          </h1>

          {/* EST date & Share Link */}
          <div className="flex items-center gap-4 mb-4">
            <p className="text-[10px] text-black/40 font-mono font-bold uppercase tracking-[0.2em]">
              EST. {formatDate(profile.created_at)}
            </p>
            <ShareButton username={profile.username} />
          </div>

          {profile.bio && (
            <p className="font-mono text-[13px] text-accent-red font-bold uppercase tracking-tight leading-relaxed max-w-sm mb-8">
              {profile.bio}
            </p>
          )}

          {/* Currently Playing ON SPOTIFY*/}
          {((isOwnProfile && isSpotifyLinked) ||
            (!isOwnProfile && (!profile.is_private && (isFollowing || isPending))) ||
            (!isOwnProfile && (profile.is_private && isFollowing))) && (
              <div className="w-full max-w-md mb-6">
                <CurrentlyPlaying
                  targetUserId={profile.id}
                  isOwnProfile={isOwnProfile}
                  showCurrentlyPlaying={profile.show_currently_playing ?? true}
                />
              </div>
            )}

          {/* Sync Button*/}
          {!isOwnProfile && currentUser && (
            <div className="mb-12">
              <SyncButton
                targetUserId={profile.id}
                isPrivate={profile.is_private}
                initialIsFollowing={isFollowing}
                initialIsPending={isPending}
                isTargetFollowingMe={isFollower}
              />
            </div>
          )}

          <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
            {/* Syncs & Rotation*/}
            <div className="border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] bg-white">
              <ProfileStats
                userId={profile.id}
                syncCount={syncCount}
                rotationCount={rotationCount}
              />
            </div>

            {/* Ratings & Reviews */}
            <div className="flex border-[3px] border-black shadow-[4px_4px_0px_rgba(255,0,0,1)] bg-black">
              <div className="flex-1 text-center py-4 border-r-[2px] border-white/20">
                <p className="text-xl font-black font-sans text-white">{ratingsCount}</p>
                <p className="text-[9px] text-white/90 font-mono font-bold uppercase tracking-[0.15em]">RATINGS</p>
              </div>
              <div className="flex-1 text-center py-4">
                <p className="text-xl font-black font-sans text-white">{reviewsCount}</p>
                <p className="text-[9px] text-white/90 font-mono font-bold uppercase tracking-[0.15em]">REVIEWS</p>
              </div>
            </div>
          </div>
        </div>

        {!isApprovedToView ? (
          <div className="mt-16 w-full flex flex-col items-center justify-center border-[3px] border-black bg-neutral-100 p-16 shadow-[8px_8px_0px_rgba(0,0,0,1)] text-center">
            <h2 className="text-4xl font-serif font-black uppercase tracking-tighter mb-4 text-black">
              THIS ACCOUNT IS PRIVATE
            </h2>
            <p className="text-sm font-mono tracking-[0.1em] text-black/60 font-bold">
              SYNC TO VIEW THEIR REVIEWS, RATINGS, AND ROTATIONS.
            </p>
          </div>
        ) : (
          <>
            {/* TOP RATED ALBUMS */}
            <div className="mt-16 w-full">
              <div className="flex items-end justify-between border-b-[3px] border-black pb-4 mb-8">
                <h2 className="text-sm text-black font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent-red flex-shrink-0"></span>
                  &quot;TOP RATED ALBUMS&quot;
                </h2>
                <Link
                  href={`/profile/${rawUsername}/ratings`}
                  className="text-[10px] text-black font-mono font-bold uppercase tracking-[0.2em] hover:text-accent-red hover:underline decoration-2 underline-offset-4 transition-colors flex items-center gap-1"
                >
                  VIEW ALL <span className="text-lg leading-none">&rarr;</span>
                </Link>
              </div>

              {topRatings && topRatings.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "16px",
                    width: "100%",
                  }}
                >
                  {topRatings.map((rating) => (
                    <Link
                      href={`/album/${rating.album_id}`}
                      key={rating.id}
                      className="block group relative aspect-square bg-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
                    >
                      {rating.album_image_url ? (
                        <img
                          src={rating.album_image_url}
                          alt={rating.album_name}
                          className="w-full h-full object-cover transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gray-100">
                          <span className="text-xs text-black font-mono font-bold uppercase">
                            {rating.album_name || "UNKNOWN"}
                          </span>
                        </div>
                      )}

                      <div className="absolute top-0 right-0 bg-white px-3 py-2 text-xs font-mono font-bold text-black border-l-[3px] border-b-[3px] border-black shadow-[-2px_2px_0px_rgba(0,0,0,1)]">
                        {rating.rating}
                      </div>
                    </Link>
                  ))}

                  {[...Array(Math.max(0, 4 - topRatings.length))].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-white border-[3px] border-black border-dashed shadow-[4px_4px_0px_rgba(0,0,0,0.1)] relative"
                    >
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <span className="font-mono text-4xl">X</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center border-[3px] border-black border-dashed bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                  <p className="text-black/50 text-xs font-mono font-bold uppercase tracking-[0.2em]">NO RATINGS LOGGED.</p>
                </div>
              )}
            </div>

            {/* TOP ARTISTS ON SPOTIFY*/}
            {(profile.show_top_artists ?? true) && (
              <TopArtistsRow
                initialArtists={cachedTopArtists}
                isOwnProfile={isOwnProfile}
                isSpotifyLinked={isSpotifyLinked}
              />
            )}

            {/* RECENT REVIEWS*/}
            <div className="mt-20">
              <div className="flex items-end justify-between border-b-[3px] border-black pb-4 mb-8">
                <h2 className="text-sm text-black font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent-red flex-shrink-0"></span>
                  &quot;RECENT REVIEWS&quot;
                </h2>
                <Link
                  href={`/profile/${rawUsername}/reviews`}
                  className="text-[10px] text-black font-mono font-bold uppercase tracking-[0.2em] hover:text-accent-red hover:underline decoration-2 underline-offset-4 transition-colors flex items-center gap-1"
                >
                  VIEW ALL <span className="text-lg leading-none">&rarr;</span>
                </Link>
              </div>

              <div className="space-y-8">
                {recentReviews && recentReviews.length > 0 ? (
                  recentReviews.map((review) => (
                    <div
                      key={review.id}
                      className="group bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 md:p-8 flex flex-col transition-all"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 border-b-[2px] border-black/10 pb-6">
                        <div className="flex gap-4 items-center">
                          {review.album_image_url && (
                            <div className="w-16 h-16 border-[2px] border-black shrink-0 relative">
                              <img
                                src={review.album_image_url}
                                alt={review.album_name}
                                className="w-full h-full object-cover transition-all relative z-10"
                              />
                              <div className="absolute top-1 left-1 w-full h-full bg-black/10 z-0"></div>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <Link
                              href={`/album/${review.album_id}`}
                              className="text-xl font-bold font-sans uppercase tracking-tight text-black hover:underline decoration-accent-red decoration-2 underline-offset-4"
                            >
                              {review.album_name || "UNKNOWN ALBUM"}
                            </Link>
                            <span className="text-[10px] text-black/60 font-mono uppercase tracking-widest mt-1">
                              {review.artist_name || "UNKNOWN ARTIST"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {review.rating !== null && (
                            <div className="flex items-baseline gap-1">
                              <span className="text-black font-black text-3xl font-sans tracking-tighter underline decoration-accent-red decoration-4">{review.rating}</span>
                              <span className="text-[10px] font-sans tracking-tighter font-bold text-black/40">/100</span>
                            </div>
                          )}
                          <div className="h-8 w-[2px] bg-black/10 mx-2 hidden sm:block"></div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-black/40 font-mono uppercase tracking-[0.2em]">LOGGED</span>
                            <span className="text-xs text-black font-mono font-bold uppercase">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-accent-red">&quot;REVIEW&quot;</div>
                        <p className="text-black text-lg font-serif leading-relaxed whitespace-pre-wrap border-[2px] border-black p-6 pl-8 bg-neutral-50">
                          {review.content}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center border-[3px] border-black border-dashed bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                    <p className="text-black/50 text-xs font-mono font-bold uppercase tracking-[0.2em]">NO REVIEWS PUBLISHED.</p>
                  </div>
                )}
              </div>
            </div>

            {/* PUBLISHED SPOTIFY PLAYLISTS*/}
            {(profile.show_playlists ?? true) && publishedPlaylists.length > 0 && (
              <div className="mt-20 w-full">
                <div className="flex items-end justify-between border-b-[3px] border-black pb-4 mb-8">
                  <h2 className="text-sm text-black font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#1DB954] flex-shrink-0"></span>
                    &quot;PLAYLISTS&quot;
                  </h2>
                  <div className="text-[10px] text-black font-mono font-bold uppercase tracking-[0.2em] px-2 py-1 border-[2px] border-black bg-white shadow-[2px_2px_0px_#1DB954]">
                    {publishedPlaylists.length} / 4
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {publishedPlaylists.map(playlist => (
                    <a
                      key={playlist.id}
                      href={`https://open.spotify.com/playlist/${playlist.spotify_playlist_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex bg-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
                    >
                      <div className="w-28 h-28 shrink-0 bg-neutral-200 border-r-[3px] border-black relative overflow-hidden">
                        {playlist.image_url ? (
                          <img src={playlist.image_url} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 delay-75" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-mono">NO IMG</div>
                        )}
                        <div className="absolute top-2 left-2 bg-[#1DB954] text-black text-[8px] font-black tracking-widest px-1 py-0.5 border-[2px] border-black"></div>
                      </div>
                      <div className="flex flex-col justify-center p-4 flex-grow overflow-hidden">
                        <h5 className="font-black font-serif text-xl uppercase truncate leading-none mb-2 group-hover:text-[#1DB954] transition-colors">{playlist.name}</h5>
                        <p className="font-mono text-[10px] text-black/60 uppercase tracking-widest font-bold">
                          {playlist.tracks_total} TRACKS
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
