import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import AvatarUpload from "@/components/Avatar-Upload";
import SyncButton from "@/components/SyncButton";

/**
 * Helper utility to format dates into a readable string.
 * Example: "January 2024"
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

/**
 * ProfilePage (Server Component)
 *
 * Displays a public user profile, including their bio, avatar,
 * social connections (Syncs), and content history.
 *
 * This component uses parallel data fetching to load the
 * Identity, Social Graph, and Content Stats simultaneously.
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
   * We need this to determine if we should show the "Sync" button.
   */
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  /**
   * Fetch Profile Identity
   * Retrieves basic user details for the profile being viewed.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, created_at, avatar_url")
    .ilike("username", username)
    .single();

  if (!profile) return notFound();

  const isOwnProfile = currentUser?.id === profile.id;

  /**
   * Fetch All Data (Parallel Execution)
   * Instead of awaiting queries one by one (Waterfall), we fire
   * all database requests simultaneously for maximum performance.
   */
  const [
    syncCountData,
    // rotationCountData, // <-- Placeholder for future "Artist Rotations" feature
    amIFollowingData, // Check A: Do I follow them?
    areTheyFollowingMeData, // Check B: Do they follow me?
    ratingsCountData,
    reviewsCountData,
    topRatingsData,
    recentReviewsData,
  ] = await Promise.all([
    // Sync Count (Calculated via SQL RPC function)
    supabase.rpc("get_sync_count", { target_user_id: profile.id }),

    // Relationship Check: Am I following them?
    // Only runs if logged in and viewing someone else.
    currentUser && !isOwnProfile
      ? supabase
          .from("follows")
          .select("*")
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.id)
          .single()
      : Promise.resolve({ data: null }),

    // Relationship Check: Are they following me?
    // Necessary for the "SYNC BACK" button state.
    currentUser && !isOwnProfile
      ? supabase
          .from("follows")
          .select("*")
          .eq("follower_id", profile.id)
          .eq("following_id", currentUser.id)
          .single()
      : Promise.resolve({ data: null }),

    // Count Ratings (where rating is not null)
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .not("rating", "is", null),

    // Count Reviews (where content exists)
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
  ]);

  /**
   * Process Data
   * Normalise database results into clean variables for the UI.
   */
  const syncCount = syncCountData.data || 0;
  const rotationCount = 0; // Placeholder

  // Convert relationship checks to booleans
  const isFollowing = !!amIFollowingData.data;
  const isFollower = !!areTheyFollowingMeData.data;

  const ratingsCount = ratingsCountData.count || 0;
  const reviewsCount = reviewsCountData.count || 0;
  const topRatings = topRatingsData.data || [];
  const recentReviews = recentReviewsData.data || [];

  return (
    <div className="bg-black text-white min-h-screen p-8">
      <div className="max-w-4xl mx-auto pt-24">
        {/* Profile Header Section */}
        <div className="flex flex-col items-center text-center pb-8">
          {/* Avatar Component */}
          <div className="mb-6">
            <AvatarUpload
              uid={profile.id}
              url={profile.avatar_url}
              username={profile.username}
              editable={isOwnProfile}
              size={128}
            />
          </div>

          <h1 className="text-5xl font-serif font-medium mb-4 tracking-normal text-white">
            {profile.username}
          </h1>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-mono tracking-tight mb-6">
            <span>est. {formatDate(profile.created_at)}</span>
          </div>

          {/* Action Button Logic:
             - If Visitor (Logged In): Show "Sync Button" with 4-state logic.
             - If Owner: Show spacer (or Edit Profile in future).
          */}
          {!isOwnProfile && currentUser ? (
            <div className="mb-8">
              <SyncButton
                targetUserId={profile.id}
                initialIsFollowing={isFollowing}
                isTargetFollowingMe={isFollower}
              />
            </div>
          ) : isOwnProfile ? (
            <div className="mb-8 h-8"></div>
          ) : null}

          {/*
             Displays social metrics (Syncs & Rotation).
          */}
          <div className="grid grid-cols-2 gap-16 border-y border-neutral-800 py-6 mb-8 w-full max-w-md mx-auto">
            {/* Syncs */}
            <div className="text-center cursor-pointer hover:opacity-70 transition-opacity">
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-2">
                Syncs
              </p>
              <p className="text-4xl font-mono text-white">{syncCount}</p>
            </div>
            {/* Rotation */}
            <div className="text-center cursor-pointer hover:opacity-70 transition-opacity">
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-2">
                Rotation
              </p>
              <p className="text-4xl font-mono text-white">{rotationCount}</p>
            </div>
          </div>

          {/* Ratings/Reviews */}
          <div className="flex gap-8 text-sm text-neutral-500">
            <span>
              <strong className="text-white">{ratingsCount}</strong> Ratings
            </span>
            <span>
              <strong className="text-white">{reviewsCount}</strong> Reviews
            </span>
          </div>
        </div>

        {/* Top Rated Albums Grid */}
        <div className="mt-16 w-full">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
              Top Rated
            </h2>
            <Link
              href={`/profile/${rawUsername}/ratings`}
              className="text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
            >
              View All <span className="text-lg leading-none">→</span>
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
                  className="block group relative aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 hover:border-neutral-500 transition-all"
                >
                  {/* Uses Cached Image URL from Database */}
                  {rating.album_image_url ? (
                    <img
                      src={rating.album_image_url}
                      alt={rating.album_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                      <span className="text-xs text-neutral-600 font-bold">
                        {rating.album_name || "Unknown"}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 bg-black/90 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white border border-white/10 shadow-lg">
                    {rating.rating}
                  </div>
                </Link>
              ))}

              {/* Empty State Placeholders to maintain grid layout */}
              {[...Array(Math.max(0, 4 - topRatings.length))].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-neutral-900/30 rounded-lg border border-neutral-900 border-dashed"
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-neutral-800 rounded-xl">
              <p className="text-neutral-600 text-sm">No ratings yet.</p>
            </div>
          )}
        </div>

        {/* Recent Reviews List */}
        <div className="mt-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
              Recent Reviews
            </h2>
            <Link
              href={`/profile/${rawUsername}/reviews`}
              className="text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
            >
              View All <span className="text-lg leading-none">→</span>
            </Link>
          </div>

          <div className="space-y-4">
            {recentReviews && recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="group bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 hover:border-neutral-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4 items-center">
                      {review.album_image_url && (
                        <img
                          src={review.album_image_url}
                          alt={review.album_name}
                          className="w-12 h-12 rounded object-cover shadow-sm"
                        />
                      )}

                      <div className="flex flex-col">
                        <Link
                          href={`/album/${review.album_id}`}
                          className="text-lg font-bold text-white hover:underline decoration-neutral-500 underline-offset-4"
                        >
                          {review.album_name || "Unknown Album"}
                        </Link>
                        <span className="text-sm text-neutral-500 font-medium">
                          {review.artist_name || "Unknown Artist"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-600 tabular-nums">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>

                      {/* Display rating if it exists in the row */}
                      {review.rating !== null && (
                        <span className="bg-neutral-800 text-white text-xs font-bold px-2 py-1 rounded border border-neutral-700">
                          ★ {review.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap border-l-2 border-neutral-800 pl-4 ml-1">
                    {/* Using 'content' column from unified table */}
                    {review.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center border border-dashed border-neutral-800 rounded-xl">
                <p className="text-neutral-600 text-sm">No reviews yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
