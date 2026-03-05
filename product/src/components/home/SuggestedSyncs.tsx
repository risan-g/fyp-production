import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import SyncButton from "@/components/SyncButton";

/**
 * SuggestedSyncs (Server Component)
 * 
 * Recommends users to follow based on shared "Heavy Rotation" artists.
 * 
 * Algorithm:
 * 1. Find all artists the current user is following.
 * 2. Find other users who follow those same artists.
 * 3. Filter out users the current user already follows (and themselves).
 * 4. Rank by the number of shared artists.
 */
export default async function SuggestedSyncs({ userId }: { userId?: string }) {
    if (!userId) {
        return (
            <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col min-h-[250px]">
                <h3 className="font-mono text-sm uppercase tracking-widest text-black/60 mb-4 pb-4 border-b-[3px] border-black">"SUGGESTED SYNCS"</h3>
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 mt-4">
                    <p className="text-black/60 text-xs font-mono uppercase tracking-widest">Sign in to find users.</p>
                    <Link href="/sign-in" className="bg-black text-white px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] font-mono hover:bg-accent-red transition-all border-2 border-transparent">
                        SIGN IN
                    </Link>
                </div>
            </div>
        );
    }

    const supabase = await createClient();

    // 1. Get current user's heavy rotation (artists they follow)
    const { data: myArtists } = await supabase
        .from("artist_follows")
        .select("spotify_artist_id")
        .eq("user_id", userId);

    // If they haven't added any artists, we just return a generic empty state for now
    if (!myArtists || myArtists.length === 0) {
        return (
            <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col min-h-[250px]">
                <h3 className="font-mono text-sm uppercase tracking-widest text-black mb-4 pb-4 border-b-[3px] border-black font-bold">"SUGGESTED SYNCS"</h3>
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                    <p className="text-black/60 text-xs font-mono uppercase tracking-widest">Add artists to get syncs.</p>
                </div>
            </div>
        );
    }

    const myArtistIds = myArtists.map(a => a.spotify_artist_id);

    // 2. Find other users following the same artists
    const { data: similarFollows } = await supabase
        .from("artist_follows")
        .select("user_id, spotify_artist_id")
        .in("spotify_artist_id", myArtistIds)
        .neq("user_id", userId);

    if (!similarFollows || similarFollows.length === 0) {
        return (
            <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col min-h-[250px]">
                <h3 className="font-mono text-sm uppercase tracking-widest text-black mb-4 pb-4 border-b-[3px] border-black font-bold">"SUGGESTED SYNCS"</h3>
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                    <p className="text-black/60 text-xs font-mono uppercase tracking-widest">[NO MATCHES]</p>
                </div>
            </div>
        );
    }

    // 3. Find who I already follow so we don't recommend them again
    const { data: mySyncs } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

    const filterSet = new Set(mySyncs?.map(s => s.following_id) || []);
    filterSet.add(userId); // Add self just in case

    // 4. Calculate Taste Match Score
    const scoreMap: Record<string, number> = {};

    similarFollows.forEach(f => {
        // Skip if it's the current user or someone we already follow
        if (f.user_id === userId || filterSet.has(f.user_id)) return;

        if (!scoreMap[f.user_id]) scoreMap[f.user_id] = 0;
        scoreMap[f.user_id] += 1; // +1 score for every shared artist
    });

    // Get top 3 recommendations
    const topMatches = Object.entries(scoreMap)
        .sort((a, b) => b[1] - a[1]) // Sort by highest score desc
        .slice(0, 3);

    if (topMatches.length === 0) {
        return (
            <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col min-h-[250px]">
                <h3 className="font-mono text-sm uppercase tracking-widest text-black mb-4 pb-4 border-b-[3px] border-black font-bold">"SUGGESTED SYNCS"</h3>
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                    <p className="text-black/60 text-xs font-mono uppercase tracking-widest">You are synced with everyone.</p>
                </div>
            </div>
        );
    }

    // 5. Fetch profile data for the top matches
    const idsToFetch = topMatches.map(m => m[0]);
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", idsToFetch);

    // We also need to check if these recommended users follow me (for SyncButton state)
    const { data: followersCheck } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userId)
        .in("follower_id", idsToFetch);

    const followersSet = new Set(followersCheck?.map(f => f.follower_id) || []);

    // Merge the final array
    const recommendations = profiles?.map(p => {
        const matchScore = scoreMap[p.id];
        const percentage = Math.round((matchScore / myArtistIds.length) * 100);

        return {
            ...p,
            sharedCount: matchScore,
            matchPercentage: Math.min(100, percentage), // Cap at 100 just in case
            is_following_me: followersSet.has(p.id)
        }
    }).sort((a, b) => b.sharedCount - a.sharedCount) || [];


    return (
        <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
                <h3 className="font-mono text-sm uppercase tracking-widest text-black font-bold">
                    "SUGGESTED SYNCS"
                </h3>
            </div>

            <div className="flex flex-col gap-6 mt-2">
                {recommendations.map(profile => (
                    <div key={profile.id} className="flex flex-col gap-3 group">
                        <div className="flex items-center justify-between">
                            <Link href={`/profile/${profile.username}`} className="flex items-center gap-4 min-w-0 pr-2">
                                <div className="w-12 h-12 bg-black border-[3px] border-black shrink-0 overflow-hidden flex items-center justify-center relative">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover transition-opacity z-10" />
                                    ) : (
                                        <span className="text-white text-lg font-bold uppercase font-serif z-10">{profile.username?.[0] || '?'}</span>
                                    )}
                                    <div className="absolute top-1 left-1 w-full h-full bg-black/10 -z-0"></div>
                                </div>
                                <div className="flex flex-col truncate pl-2 border-l-[3px] border-black/10">
                                    <span className="text-black font-black text-sm uppercase tracking-wider truncate group-hover:underline decoration-accent-red decoration-2 underline-offset-2">{profile.username}</span>
                                    <span className="text-black/60 text-[10px] uppercase font-mono tracking-widest">
                                        {profile.matchPercentage}% TASTE_MATCH
                                    </span>
                                </div>
                            </Link>

                            <div className="shrink-0 scale-90 origin-right">
                                <SyncButton
                                    targetUserId={profile.id}
                                    initialIsFollowing={false} // By definition of recommendations, we don't follow them yet
                                    isTargetFollowingMe={profile.is_following_me}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
