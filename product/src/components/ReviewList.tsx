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

/**
 * Review List Component.
 *
 * This component fetches and displays reviews.
 * UPDATE: It now filters out "Rating Only" entries (where content is empty).
 */
export default function ReviewList({ albumId }: { albumId: string }) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<any[]>([]);

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

      if (data) setReviews(data);
    };

    fetchData();
  }, [albumId]);

  // If there are no reviews, show a simple message
  if (reviews.length === 0)
    return (
      <div className="text-neutral-600 text-center mt-12 text-sm">
        No reviews yet.
      </div>
    );

  return (
    <div className="mt-12 border-t border-neutral-900 pt-12">
      <h3 className="text-xl font-bold mb-8 text-white">Reviews</h3>
      <div className="space-y-8">
        {reviews.map((review) => (
          <div key={review.id} className="flex gap-4">
            {/* Avatar Circle */}
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0 border border-neutral-800">
              {review.profiles?.avatar_url ? (
                <img
                  src={review.profiles.avatar_url}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-neutral-400 text-xs font-bold">
                  {review.profiles?.username?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>

            <div className="flex-1">
              {/* Header: Username, Time, and Rating Badge */}
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-white text-sm">
                  {review.profiles?.username || "Unknown User"}
                </span>
                <span className="text-xs text-neutral-600">
                  {timeAgo(review.created_at)}
                </span>

                {/* Only show the rating badge if the user actually rated the album */}
                {review.rating !== null && (
                  <span className="px-2 py-0.5 bg-white text-black text-xs font-bold rounded">
                    {review.rating}
                  </span>
                )}
              </div>

              {/* The Review Content */}
              <p className="text-neutral-300 text-sm leading-relaxed max-w-4xl">
                {review.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
