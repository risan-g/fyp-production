"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Helper: Formats a date string into "Today", "Yesterday", or "X days ago".
 */
const timeAgo = (date: string) => {
    const diffInSeconds = Math.floor(
        (new Date().getTime() - new Date(date).getTime()) / 1000
    );

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;

    const days = Math.floor(diffInSeconds / (3600 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
};

interface FeedReviewItem {
    id: string;
    content: string | null;
    rating: number | null;
    created_at: string;
    user_id: string;
    album_id: string;
    album_name: string;
    artist_name: string;
    album_image_url: string | null;
    profiles: {
        username: string;
        avatar_url: string | null;
        is_private?: boolean;
    } | null;
}

interface ReviewFeedProps {
    feedType: "global" | "synced";
    optimisticReview: FeedReviewItem | null; // For optimistic UI updates
    user: { id: string } | null;
}

export default function ReviewFeed({ feedType, optimisticReview, user }: ReviewFeedProps) {
    const supabase = createClient();
    const [reviews, setReviews] = useState<FeedReviewItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchFeed = async () => {
            setIsLoading(true);
            try {
                let query = supabase
                    .from("reviews")
                    .select(`
            id, content, rating, created_at, user_id, 
            album_id, album_name, artist_name, album_image_url,
            profiles!inner (username, avatar_url, is_private)
          `)
                    .order("created_at", { ascending: false })
                    .limit(50); // Fetch top 50 recent reviews

                if (feedType === "global") {
                    query = query.eq("profiles.is_private", false);
                } else if (feedType === "synced" && user) {
                    // If synced feed, we only want reviews from users the current user follows
                    const { data: follows } = await supabase
                        .from("follows")
                        .select("following_id")
                        .eq("follower_id", user.id)
                        .eq("status", "accepted");

                    if (follows && follows.length > 0) {
                        const followingIds = follows.map((f: { following_id: string }) => f.following_id);
                        query = query.in("user_id", followingIds);
                    } else {
                        // If they don't follow anyone, fetch nothing for synced feed
                        if (isMounted) {
                            setReviews([]);
                            setIsLoading(false);
                        }
                        return;
                    }
                } else if (feedType === "synced" && !user) {
                    // Not logged in, can't see synced feed
                    if (isMounted) {
                        setReviews([]);
                        setIsLoading(false);
                    }
                    return;
                }

                const { data, error } = await query;

                if (error) throw error;

                if (isMounted && data) {
                    // Filter out rows that have no text and no rating (just in case they exist)
                    const validReviews = (data as unknown as FeedReviewItem[]).filter((r) => r.content || r.rating !== null);
                    setReviews(validReviews);
                }
            } catch (err: unknown) {
                console.error("Failed to fetch feed:", err instanceof Error ? err.message : err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchFeed();

        // Set up realtime subscription for global feed
        // Only subscribe to inserts to easily add to top of feed
        const channel = supabase
            .channel("public:reviews")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "reviews" },
                async (payload) => {
                    // Verify if it belongs in the current feed
                    let shouldAdd = false;

                    if (feedType === "global") {
                        shouldAdd = true;
                    } else if (feedType === "synced" && user) {
                        // Need to check if inserted user is followed by current user
                        const { data: isFollowing } = await supabase
                            .from("follows")
                            .select("following_id")
                            .eq("follower_id", user.id)
                            .eq("following_id", payload.new.user_id)
                            .single();

                        if (isFollowing) {
                            shouldAdd = true;
                        }
                    }

                    if (shouldAdd && isMounted) {
                        // We need to fetch the profile info for the new review since it's an insert
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("username, avatar_url")
                            .eq("id", payload.new.user_id)
                            .single();

                        const newReviewWithProfile = {
                            ...(payload.new as Record<string, unknown>),
                            profiles: profile
                        } as unknown as FeedReviewItem;

                        setReviews((current) => {
                            // Prevent duplicates (e.g. if optimistic UI already added it, or we see it twice)
                            // The optimistic post will have a temp uuid, so it's not strictly a duplicate by id,
                            // but we can check if there's already a review by this user for this album within the last few seconds.
                            // For simplicity, just prepend it.
                            return [newReviewWithProfile, ...current].filter((r) => r.content || r.rating !== null);
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [feedType, user, supabase]);

    // Handle Optimistic UI injection
    useEffect(() => {
        if (optimisticReview) {
            setReviews((current) => {
                // Find if it's already in the feed (maybe real-time got it faster)
                const alreadyExists = current.some(
                    (r) => r.user_id === optimisticReview.user_id && r.album_id === optimisticReview.album_id
                );
                if (alreadyExists) return current;
                return [optimisticReview, ...current];
            });
        }
    }, [optimisticReview]);


    if (feedType === "synced" && !user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center border-[3px] border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                <p className="text-black font-bold mb-6 font-mono uppercase tracking-[0.2em] text-sm">&quot;SIGN IN FOR SYNCED FEED&quot;</p>
                <Link href="/sign-in" className="bg-black text-white font-bold px-10 py-3 text-xs uppercase tracking-[0.2em] font-mono hover:bg-accent-red transition-colors border-2 border-transparent">
                    SIGN IN
                </Link>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-full h-48 border-[3px] border-black bg-black/5 animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-40 text-center border-[3px] border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] px-8">
                <p className="text-black font-black font-mono uppercase tracking-[0.2em] mb-4">&quot;NO ACTIVITY YET&quot;</p>
                <p className="text-black/50 font-mono text-xs uppercase tracking-widest max-w-[300px]">
                    {feedType === "synced" 
                        ? "SYNC WITH OTHER USERS TO SEE THEIR REVIEWS AND RATINGS POPULATE YOUR FEED." 
                        : "BE THE FIRST TO LOG AN ALBUM AND START THE CONVERSATION."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <AnimatePresence>
                {reviews.map((review) => (
                    <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        layout
                        className="flex gap-4 p-6 md:p-8 bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all group"
                    >
                        {/* Avatar */}
                        <Link href={`/profile/${review.profiles?.username}`} className="shrink-0">
                            <div className="w-14 h-14 bg-black border-[3px] border-black flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity">
                                {review.profiles?.avatar_url ? (
                                    <img src={review.profiles.avatar_url} alt="User avatar" className="w-full h-full object-cover transition-all" />
                                ) : (
                                    <span className="text-white font-bold text-lg uppercase font-serif">
                                        {review.profiles?.username?.[0] || "?"}
                                    </span>
                                )}
                            </div>
                        </Link>

                        {/* Content Body */}
                        <div className="flex flex-col flex-1 min-w-0">

                            {/* Header: Username & Action */}
                            <div className="flex items-center gap-2 mb-6 flex-wrap pb-4 border-b-2 border-black/10">
                                <Link href={`/profile/${review.profiles?.username}`} className="font-black text-black hover:bg-black hover:text-white px-1 text-sm tracking-wider uppercase transition-colors truncate">
                                    {review.profiles?.username || "Unknown"}
                                </Link>
                                <span className="text-black/40 text-xs font-mono tracking-widest uppercase">logged</span>
                                <Link href={`/album/${review.album_id}`} className="font-bold text-black border-b-[2px] border-black text-sm hover:text-accent-red hover:border-accent-red transition-colors flex-1 min-w-[100px]">
                                    {review.album_name}
                                </Link>
                                <span className="text-black/60 font-mono text-[10px] uppercase tracking-widest ml-auto">
                                    {timeAgo(review.created_at)}
                                </span>
                            </div>

                            {/* Album Art & Review Text Container */}
                            <div className="flex gap-6">
                                {/* Album Cover */}
                                <Link href={`/album/${review.album_id}`} className="shrink-0 relative group/cover block">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-black border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] group-hover/cover:shadow-none group-hover/cover:translate-x-[4px] group-hover/cover:translate-y-[4px] transition-all">
                                        {review.album_image_url ? (
                                            <img
                                                src={review.album_image_url}
                                                alt={review.album_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-mono">NO COVER</div>
                                        )}
                                    </div>
                                </Link>

                                {/* Text and Rating */}
                                <div className="flex flex-col flex-1 pl-2">
                                    {/* Rating display */}
                                    {review.rating !== null && (
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-black font-black text-2xl font-sans tracking-tighter underline decoration-accent-red decoration-4 underline-offset-2">{review.rating}</span>
                                            <span className="text-black/50 text-xs font-sans tracking-tighter font-bold">/ 100</span>
                                        </div>
                                    )}

                                    {/* Review text */}
                                    {review.content && (
                                        <div className="relative">
                                            <span className="absolute -left-3 -top-2 text-2xl font-serif text-accent-red font-black leading-none">&ldquo;</span>
                                            <p className="text-black text-lg leading-relaxed whitespace-pre-wrap break-words font-serif indent-2">
                                                {review.content}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
