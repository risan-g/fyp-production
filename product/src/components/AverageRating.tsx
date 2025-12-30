"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface AverageRatingProps {
  albumId: string;
}

/**
 * Average Rating Display.
 *
 * This component fetches every valid rating submitted by users for this specific album,
 * calculates the mathematical average, and displays it as a large "Score"
 * in the album header.
 */
export default function AverageRating({ albumId }: AverageRatingProps) {
  const supabase = createClient();

  // State to hold the calculated score
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch the data as soon as the component loads
  useEffect(() => {
    loadAverageRating();
  }, [albumId]);

  const loadAverageRating = async () => {
    try {
      // Get ALL ratings for this album from the 'reviews' table.
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

        // Round to 1 decimal place (e.g., 84.5)
        setAverageRating(Math.round(avg * 10) / 10);
        setTotalRatings(allRatings.length);
      }
    } catch (err: any) {
      console.error("Error loading community rating:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 h-82">
      {/* Rotated 90 degrees */}
      <div className="flex flex-col" style={{ transform: "rotate(-90deg)" }}>
        <span className="text-2xl text-neutral-500 uppercase tracking-widest">
          AVERAGE
        </span>
        <span className="text-2xl text-neutral-500 uppercase tracking-widest">
          RATING
        </span>
      </div>

      {/* The Big Score Number */}
      <div className="flex flex-col">
        {(() => {
          if (loading) {
            return (
              <span
                className="font-bold text-neutral-800 leading-none"
                style={{ fontSize: "160px" }}
              >
                --
              </span>
            );
          }
          // No ratings yet
          if (averageRating === null) {
            return (
              <span
                className="font-bold text-neutral-700 leading-none"
                style={{ fontSize: "160px" }}
              >
                --
              </span>
            );
          }
          // Actual Score
          return (
            <span
              className="font-bold text-white leading-none"
              style={{ fontSize: "130px" }}
            >
              {averageRating}
            </span>
          );
        })()}

        <span className="text-3xl text-neutral-500">/ 100</span>
      </div>
    </div>
  );
}
