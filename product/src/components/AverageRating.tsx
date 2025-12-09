"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface AverageRatingProps {
  albumId: string;
}

export default function AverageRating({ albumId }: AverageRatingProps) {
  const supabase = createClient();
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAverageRating();
  }, [albumId]);

  const loadAverageRating = async () => {
    try {
      const { data: allRatings, error: ratingsError } = await supabase
        .from("album_ratings")
        .select("rating")
        .eq("album_id", albumId);

      if (ratingsError) throw ratingsError;

      if (allRatings && allRatings.length > 0) {
        const sum = allRatings.reduce(
          (total, r) => total + Number(r.rating),
          0
        );
        const avg = sum / allRatings.length;
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
      <div className="flex flex-col" style={{ transform: "rotate(-90deg)" }}>
        <span className="text-2xl text-neutral-500 uppercase tracking-widest">
          AVERAGE
        </span>
        <span className="text-2xl text-neutral-500 uppercase tracking-widest">
          RATING
        </span>
      </div>

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
