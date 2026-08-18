"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Helper: Formats a date string into "Today", "Yesterday", or "X days ago".
 */
const timeAgo = (date: string) => {
  const days = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24)
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

interface ReviewItem {
  id: string;
  content: string | null;
  rating: number | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
}

/**
 * Review List Component.
 *
 * This component fetches and displays reviews.
 * UPDATE: It now filters out "Rating Only" entries (where content is empty).
 */
export default function ReviewList({ albumId }: { albumId: string }) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  // Fetch data when the component loads
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("reviews")
        .select(
          `
          id, content, rating, created_at, user_id,
          profiles (username, avatar_url)
        `
        )
        .eq("album_id", albumId)
        // FILTER: Only show rows where content exists and is not empty
        .not("content", "is", null)
        .neq("content", "")
        .order("created_at", { ascending: false });

      if (data) setReviews(data as unknown as ReviewItem[]);
    };

    fetchData();

    // Listen for custom event to refetch data automatically when the user posts/updates a review
    const handleUpdate = () => {
      fetchData();
    };

    window.addEventListener("review-updated", handleUpdate);
    return () => window.removeEventListener("review-updated", handleUpdate);
  }, [albumId, supabase]);

  // If there are no reviews, show a simple message
  if (reviews.length === 0)
    return (
      <div className="border-[3px] border-black border-dashed py-16 text-center bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] mt-12">
        <span className="text-black/50 font-mono text-[10px] uppercase font-bold tracking-[0.2em]">NO REVIEWS PUBLISHED.</span>
      </div>
    );

  return (
    <div className="mt-16 pt-8">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-sm text-black font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="w-2 h-2 bg-accent-red flex-shrink-0"></span>
          &quot;COMMUNITY REVIEWS&quot;
        </h2>
      </div>
      <div className="space-y-12">
        {reviews.map((review) => (
          <div key={review.id} className="flex flex-col sm:flex-row gap-6 border-[3px] border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 md:p-8">
            {/* Avatar Square */}
            <div className="w-16 h-16 bg-white border-[3px] border-black flex items-center justify-center overflow-hidden shrink-0 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              {review.profiles?.avatar_url ? (
                <img
                  src={review.profiles.avatar_url}
                  alt="User"
                  className="w-full h-full object-cover transition-all duration-300"
                />
              ) : (
                <span className="text-black text-xl font-mono font-bold">
                  {review.profiles?.username?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              {/* Header: Username, Time, and Rating Badge */}
              <div className="flex flex-wrap items-center gap-4 mb-6 border-b-[2px] border-black/10 pb-4">
                <span className="font-bold font-sans text-xl uppercase tracking-tight text-black hover:underline decoration-accent-red decoration-2 underline-offset-4 cursor-pointer">
                  {review.profiles?.username || "UNKNOWN USER"}
                </span>

                <div className="h-4 w-[2px] bg-black/20 hidden sm:block"></div>

                <span className="text-[10px] text-black/40 font-mono font-bold uppercase tracking-[0.2em]">
                  {timeAgo(review.created_at)}
                </span>

                <div className="flex-grow"></div>

                {/* Only show the rating badge if the user actually rated the album */}
                {review.rating !== null && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-black font-black text-3xl font-sans tracking-tighter underline decoration-accent-red decoration-4">{review.rating}</span>
                    <span className="text-[10px] font-sans tracking-tighter font-bold text-black/40">/100</span>
                  </div>
                )}
              </div>

              {/* The Review Content */}
              <div className="relative">
                <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-accent-red">&quot;REVIEW&quot;</div>
                <p className="text-black text-lg font-serif leading-relaxed whitespace-pre-wrap max-w-4xl border-[2px] border-black p-6 bg-neutral-50 shadow-inner">
                  {review.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
