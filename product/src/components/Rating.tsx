"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RatingProps {
  albumId: string;
  albumName: string;
  artistName: string;
}

/**
 * Helper: Translates the 0-100 score into text.
 * e.g., 72 -> "LIGHT 7", 88 -> "STRONG 8", 100 -> "CLASSIC"
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

/**
 * Interactive Rating Slider.
 *
 * This component allows users to rate an album by dragging a vertical knob.
 * It handles the physics of the slider, calculating the percentage based on
 * mouse position, and syncs the final result with Supabase.
 */
export default function Rating({
  albumId,
  albumName,
  artistName,
}: RatingProps) {
  const router = useRouter();
  const supabase = createClient();

  // State for the visual slider
  const [rating, setRating] = useState(0);
  const [originalRating, setOriginalRating] = useState(0); // Used to detect changes

  // State for Dragging Physics
  const isDragging = useRef(false);
  const sliderWrapperRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  // State for Data/Auth
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load existing data on mount
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
        // Check if the user has already rated this album
        const { data: userRating } = await supabase
          .from("album_ratings")
          .select("rating")
          .eq("user_id", user.id)
          .eq("album_id", albumId)
          .single();

        if (userRating) {
          const savedRating = Number(userRating.rating);
          setRating(savedRating);
          setOriginalRating(savedRating);
        }
      }
    } catch (err: any) {
      console.error("Error loading user rating:", err);
      setError("Failed to load your rating.");
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

    // Invert because 100 is at the top (0% distance), 0 is at the bottom (100% distance)
    const value = (1 - percent) * 100;
    return value;
  };

  // Start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!user || saving) return; // Read-only if not logged in

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
    if (value !== undefined) {
      setRating(Math.round(value));
    }
  };

  // Stop dragging
  const handleMouseUp = () => {
    isDragging.current = false;

    // Reset visuals
    if (knobRef.current) {
      knobRef.current.style.cursor = "grab";
      knobRef.current.style.backgroundColor = "#fff";
    }
    document.body.style.cursor = "default";

    // Clean up listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Handle clicking the track directly (jump to value)
  const handleClickTrack = (e: React.MouseEvent) => {
    if (!user || saving) return;
    if (e.target === knobRef.current) return;

    const value = updateRatingFromY(e.clientY);
    if (value !== undefined) {
      // Snap to nearest 10 for cleaner clicks
      const finalValue = Math.round(value / 10) * 10;
      setRating(finalValue);
    }
  };

  // Save to Database
  const handleSaveRating = async () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Don't save if nothing changed
    if (rating === originalRating) return;

    setSaving(true);
    setError("");

    try {
      // Check if we need to INSERT (new) or UPDATE (existing)
      const { data: existing } = await supabase
        .from("album_ratings")
        .select("id")
        .eq("user_id", user.id)
        .eq("album_id", albumId)
        .single();

      if (existing) {
        // Update
        const { error: updateError } = await supabase
          .from("album_ratings")
          .update({ rating, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from("album_ratings")
          .insert({
            user_id: user.id,
            album_id: albumId,
            album_name: albumName,
            artist_name: artistName,
            rating,
          });
        if (insertError) throw insertError;
      }

      // Sync state so the "Save" button disappears
      setOriginalRating(rating);
    } catch (err: any) {
      console.error("Error saving rating:", err);
      setError(err.message || "Failed to save rating.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRating(originalRating);
    setError("");
  };

  if (loading) {
    return (
      <div className="bg-black-900 rounded-lg p-4 flex flex-col items-center h-[520px] justify-center">
        <div className="text-neutral-500">Loading your rating...</div>
      </div>
    );
  }

  // Determine if we should show the Save/Cancel buttons
  const hasChanged = rating !== originalRating;

  return (
    <div className="bg-black-900 rounded-lg p-4 flex flex-col items-center">
      {/* Score Display */}
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

      {/* The Vertical Slider Track */}
      <div
        className="h-72 w-20 cursor-pointer flex justify-center relative"
        ref={sliderWrapperRef}
        onClick={handleClickTrack}
      >
        {/* Central Line */}
        <div className="w-1 h-full bg-neutral-700 absolute left-1/2 -translate-x-1/2" />

        {/* Ticks (Visual markers) */}
        <div className="absolute top-0 left-[calc(50%+10px)] w-2.5 h-full flex flex-col justify-between pointer-events-none">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="w-full h-0.5 bg-neutral-600" />
          ))}
        </div>

        {/* The Draggable Knob */}
        <div
          ref={knobRef}
          className={`w-12 h-5 bg-white absolute left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white z-10 ${
            user ? "cursor-grab" : "cursor-not-allowed opacity-50"
          }`}
          style={{ top: `${100 - rating}%` }} // Position based on rating
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Action Buttons (Only visible if user changed the rating) */}
      <div className="mt-10 flex flex-col items-center gap-2 h-20">
        {user ? (
          <>
            {hasChanged && (
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-2 bg-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRating}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-neutral-700"
                >
                  {saving ? "Saving..." : "Confirm"}
                </button>
              </div>
            )}

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
