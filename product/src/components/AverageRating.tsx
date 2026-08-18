"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface AverageRatingProps {
  albumId: string;
}

/**
 * Average Rating Display.
 *
 * This component fetches every valid rating submitted by users and display average.
 */
export default function AverageRating({ albumId }: AverageRatingProps) {
  const supabase = createClient();

  // State to hold the calculated score
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAverageRating = useCallback(async () => {
    try {
      // Get aLL ratings for this album from the 'reviews' table.
      const { data: allRatings, error: ratingsError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("album_id", albumId)
        .not("rating", "is", null);

      if (ratingsError) throw ratingsError;

      // Calculate the average
      if (allRatings && allRatings.length > 0) {
        const sum = allRatings.reduce(
          (total, r) => total + Number(r.rating),
          0
        );
        const avg = sum / allRatings.length;

        // Round to 1 decimal place
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (err: unknown) {
      console.error("Error loading community rating:", err);
    } finally {
      setLoading(false);
    }
  }, [albumId, supabase]);

  // Fetch the data as soon as the component loads
  useEffect(() => {
    loadAverageRating();

    const handleUpdate = () => {
      loadAverageRating();
    };

    window.addEventListener("review-updated", handleUpdate);
    return () => window.removeEventListener("review-updated", handleUpdate);
  }, [loadAverageRating]);

  return (
    <div className="flex flex-col items-end relative group">
      {/* Top Label */}
      <span className="text-[10px] text-black font-mono font-bold uppercase tracking-[0.2em] mb-[-15px] z-10 mr-4 bg-white px-2 border-[2px] border-black">
        &quot;AVERAGE RATING&quot;
      </span>

      {/* The Big Score Number */}
      <div className="flex items-baseline border-[3px] border-black px-6 py-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-white">
        {(() => {
          if (loading || averageRating === null) {
            return (
              <span
                className="font-black font-sans tracking-tighter text-black/20 leading-none"
                style={{ fontSize: "110px" }}
              >
                --
              </span>
            );
          }
          return (
            <span
              className="font-black font-sans tracking-tighter text-black leading-none drop-shadow-md"
              style={{ fontSize: "110px" }}
            >
              {averageRating}
            </span>
          );
        })()}

        <span className="text-3xl font-sans font-black text-black/40 tracking-tighter ml-2">/100</span>
      </div>
    </div>
  );
}
