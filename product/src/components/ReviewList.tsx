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
 * This component fetches and displays all reviews for a specific album.
 */
export default function ReviewList({ albumId }: { albumId: string }) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<any[]>([]);

  // Fetch data when the component loads
  useEffect(() => {
    const fetchData = async () => {
      // Get the written reviews + the username of the person who wrote it.
      const { data: reviewsData } = await supabase
        .from("album_reviews")
        .select(
          `
          id, review_text, created_at, user_id,
          profiles (username)
        `
        )
        .eq("album_id", albumId)
        .order("created_at", { ascending: false });

      if (!reviewsData) return;

      // Get the numerical ratings for this album.
      const { data: ratingsData } = await supabase
        .from("album_ratings")
        .select("user_id, rating")
        .eq("album_id", albumId);

      // Create a quick lookup map for ratings.
      const ratingMap: Record<string, number> = {};
      ratingsData?.forEach((r) => {
        ratingMap[r.user_id] = r.rating;
      });

      // Combine the data.
      const combined = reviewsData.map((review) => ({
        ...review,
        rating: ratingMap[review.user_id] || null,
      }));

      setReviews(combined);
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
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold shrink-0 text-neutral-400">
              {review.profiles?.username?.[0]?.toUpperCase() || "?"}
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
                {review.review_text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
