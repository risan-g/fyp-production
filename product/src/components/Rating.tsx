"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RatingProps {
  albumId: string;
  albumName: string;
  artistName: string;
  albumImage: string;
}

/**
 * Helper: Translates the 0-100 score into text.
 */
const getTranslatorText = (value: number) => {
  if (value === 0) return "(NOT GOOD)";
  if (value === 100) return "(CLASSIC)";

  const base = Math.floor(value / 10);
  const mod = value % 10;

  let term = "";
  if (mod < 4) term = "LIGHT";
  else if (mod < 7) term = "DECENT";
  else term = "STRONG";

  if (base === 0 && value > 0) {
    return "(NOT GOOD)";
  }
  return `(${term} ${base})`;
};

export default function Rating({
  albumId,
  albumName,
  artistName,
  albumImage,
}: RatingProps) {
  const router = useRouter();
  const supabase = createClient();

  // State for the visual slider
  const [rating, setRating] = useState(0);
  const [originalRating, setOriginalRating] = useState<number | null>(null);

  // State for Dragging Physics
  const isDragging = useRef(false);
  const sliderWrapperRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  // Track if user physically touched slider
  const userHasInteracted = useRef(false);

  // State for Data/Auth
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUserRating();
  }, [albumId]);

  const loadUserRating = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: userReview } = await supabase
          .from("reviews")
          .select("rating")
          .eq("user_id", user.id)
          .eq("album_id", albumId)
          .single();

        if (userReview && userReview.rating !== null) {
          setRating(userReview.rating);
          setOriginalRating(userReview.rating);
        } else {
          setOriginalRating(null);
        }
      }
    } catch (err: any) {
      if (err.code !== "PGRST116") console.error("Error loading rating:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculates the score (0-100) based on where the mouse is vertically.
  const updateRatingFromY = (clientY: number) => {
    if (!sliderWrapperRef.current) return;

    const trackRect = sliderWrapperRef.current.getBoundingClientRect();

    // Calculate distance from top of the track
    let newTop = clientY - trackRect.top;

    // Convert to percentage (0 to 1)
    let percent = newTop / trackRect.height;
    percent = Math.max(0, Math.min(1, percent));
    return (1 - percent) * 100;
  };

  // Start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!user || saving) return;
    userHasInteracted.current = true;
    isDragging.current = true;

    // Visual feedback
    if (knobRef.current) {
      knobRef.current.style.cursor = "grabbing";
      knobRef.current.style.backgroundColor = "#111";
    }
    document.body.style.cursor = "grabbing";
    e.preventDefault();

    // Attach global listeners to handle dragging outside the component area
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // While dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const value = updateRatingFromY(e.clientY);
    if (value !== undefined) setRating(Math.round(value));
  };

  // Stop dragging
  const handleMouseUp = () => {
    isDragging.current = false;
    if (knobRef.current) {
      knobRef.current.style.cursor = "grab";
      knobRef.current.style.backgroundColor = "#fff";
    }
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Handle clicking the track directly (jump to value)
  const handleClickTrack = (e: React.MouseEvent) => {
    if (!user || saving) return;
    if (e.target === knobRef.current) return;
    userHasInteracted.current = true;
    const value = updateRatingFromY(e.clientY);
    if (value !== undefined) {
      const finalValue = Math.round(value / 10) * 10;
      setRating(finalValue);
    }
  };

  const handleRemoveRating = async () => {
    if (!user) return;

    if (!window.confirm("Are you sure you want to remove your rating?")) {
      return;
    }

    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from("reviews")
        .select("content")
        .eq("user_id", user.id)
        .eq("album_id", albumId)
        .single();

      if (existing && existing.content) {
        await supabase
          .from("reviews")
          .update({ rating: null, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("album_id", albumId);
      } else {
        await supabase
          .from("reviews")
          .delete()
          .eq("user_id", user.id)
          .eq("album_id", albumId);
      }

      setRating(0);
      setOriginalRating(null);
      userHasInteracted.current = false;
      router.refresh();
    } catch (err: any) {
      console.error("Error removing rating:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRating = async () => {
    if (!user) return router.push("/sign-in");
    if (rating === originalRating) return;

    setSaving(true);
    setError("");

    try {
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("album_id", albumId)
        .single();

      if (existing) {
        const { error: updateError } = await supabase
          .from("reviews")
          .update({ rating, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("reviews").insert({
          user_id: user.id,
          album_id: albumId,
          album_name: albumName,
          artist_name: artistName,
          album_image_url: albumImage,
          rating,
        });
        if (insertError) throw insertError;
      }

      setOriginalRating(rating);
      userHasInteracted.current = false;
      router.refresh();
    } catch (err: any) {
      console.error("Error saving rating:", err);
      setError(err.message || "Failed to save rating.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRating(originalRating || 0);
    userHasInteracted.current = false;
    setError("");
  };

  if (loading) {
    return (
      <div className="bg-black-900 rounded-lg p-4 flex flex-col items-center h-[520px] justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  const hasChanged =
    rating !== originalRating &&
    (originalRating !== null || userHasInteracted.current);

  const isSaved = originalRating !== null;

  return (
    <div className="bg-black-900 rounded-lg p-4 flex flex-col items-center">
      <div className="mb-10 h-28 flex flex-col justify-center items-center">
        <label className="block text-xs text-neutral-500 mb-2">
          {user ? "Your Rating" : ""}
        </label>
        <div className="text-7xl font-bold text-white leading-none">
          {rating}
        </div>
        <div className="font-mono text-lg text-neutral-500 mt-2 uppercase h-5">
          {getTranslatorText(rating)}
        </div>
      </div>

      <div
        className="h-72 w-20 cursor-pointer flex justify-center relative"
        ref={sliderWrapperRef}
        onClick={handleClickTrack}
      >
        <div className="w-1 h-full bg-neutral-700 absolute left-1/2 -translate-x-1/2" />
        <div className="absolute top-0 left-[calc(50%+10px)] w-2.5 h-full flex flex-col justify-between pointer-events-none">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="w-full h-0.5 bg-neutral-600" />
          ))}
        </div>
        <div
          ref={knobRef}
          className={`w-12 h-5 bg-white absolute left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white z-10 ${
            user ? "cursor-grab" : "cursor-not-allowed opacity-50"
          }`}
          style={{ top: `${100 - rating}%` }}
          onMouseDown={handleMouseDown}
        />
      </div>

      <div className="mt-10 flex flex-col items-center gap-2 h-20 w-full">
        {user ? (
          <>
            {/* Save/Cancel Buttons */}
            {hasChanged ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-2 bg-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-600 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRating}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-neutral-700 transition-colors"
                >
                  {saving ? "Saving..." : "Confirm"}
                </button>
              </div>
            ) : isSaved ? (
              <button
                onClick={handleRemoveRating}
                disabled={saving}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 mt-2 transition-colors"
              >
                Remove
              </button>
            ) : null}

            {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
          </>
        ) : (
          <p className="text-xs text-neutral-500 mt-2">
            <button
              onClick={() => router.push("/sign-in")}
              className="text-blue-400 hover:underline"
            >
              Sign in
            </button>{" "}
            to save your rating.
          </p>
        )}
      </div>
    </div>
  );
}
