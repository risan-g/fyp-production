/** 
 * Vertical 0-100 rating fader.
 * Replaces standard 5-star inputs with a draggable integer scale calculated from Y-coordinates.
 */
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

  /** 
   * Normalises the vertical offset to calculate a 0-100 integer.
   * We calculate from the track's bounding box and invert it so 100 sits at the top.
   */
  const updateRatingFromY = (clientY: number) => {
    if (!sliderWrapperRef.current) return;

    const trackRect = sliderWrapperRef.current.getBoundingClientRect();

    // Calculate distance from top of the track
    let newTop = clientY - trackRect.top;

    let percent = newTop / trackRect.height;
    percent = Math.max(0, Math.min(1, percent));
    return (1 - percent) * 100;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!user || saving) return;
    userHasInteracted.current = true;
    isDragging.current = true;

    if (knobRef.current) {
      knobRef.current.style.cursor = "grabbing";
      knobRef.current.style.backgroundColor = "#111";
    }
    document.body.style.cursor = "grabbing";
    e.preventDefault();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const value = updateRatingFromY(e.clientY);
    if (value !== undefined) setRating(Math.round(value));
  };

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
        // If a text review exists alongside the rating, we only nullify the rating.
        await supabase
          .from("reviews")
          .update({ rating: null, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("album_id", albumId);
      } else {
        // If no text review exists, we completely wipe the row to avoid dangling null records.
        await supabase
          .from("reviews")
          .delete()
          .eq("user_id", user.id)
          .eq("album_id", albumId);
      }

      setRating(0);
      setOriginalRating(null);
      userHasInteracted.current = false;
      window.dispatchEvent(new CustomEvent("review-updated"));
      router.refresh();
    } catch (err: any) {
      console.error("Error removing rating:", err);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Commits the integer score to Supabase.
   * Acts as an upsert: updates the row if a text review already exists, otherwise inserts a fresh entry.
   */
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
      window.dispatchEvent(new CustomEvent("review-updated"));
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
      <div className="border-[3px] border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 flex flex-col items-center h-[520px] justify-center">
        <div className="text-black/50 font-mono font-bold uppercase tracking-[0.2em]">LOADING RATING...</div>
      </div>
    );
  }

  const hasChanged =
    rating !== originalRating &&
    (originalRating !== null || userHasInteracted.current);

  const isSaved = originalRating !== null;

  return (
    <div className="border-[3px] border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 flex flex-col items-center">
      <div className="mb-10 h-32 flex flex-col justify-center items-center">
        <label className="block text-[10px] text-black font-mono font-bold uppercase tracking-[0.2em] mb-4">
          {user ? '"YOUR RATING"' : '""'}
        </label>
        <div className="text-8xl font-black font-sans tracking-tighter text-black leading-none drop-shadow-md">
          {rating}
        </div>
        <div className="font-mono text-sm tracking-[0.2em] font-bold text-accent-red mt-4 uppercase h-5 text-center px-4 bg-black/5">
          {getTranslatorText(rating)}
        </div>
      </div>

      <div
        className="h-72 w-32 cursor-pointer flex justify-center relative touch-none"
        ref={sliderWrapperRef}
        onClick={handleClickTrack}
      >
        <div className="w-2 h-full bg-black absolute left-1/2 -translate-x-1/2" />
        <div className="absolute top-0 left-[calc(50%+16px)] w-4 h-full flex flex-col justify-between pointer-events-none">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="w-full h-1 bg-black/20" />
          ))}
        </div>
        <div
          ref={knobRef}
          className={`w-16 h-8 bg-black absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 shadow-[4px_4px_0px_rgba(255,0,0,1)] hover:bg-accent-red hover:shadow-none transition-colors ${user ? "cursor-grab" : "cursor-not-allowed opacity-50"
            }`}
          style={{ top: `${100 - rating}%` }}
          onMouseDown={handleMouseDown}
        />
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 min-h-[5rem] w-full">
        {user ? (
          <>
            {/* Save/Cancel Buttons */}
            {hasChanged ? (
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleSaveRating}
                  disabled={saving}
                  className="w-full py-4 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-[0.2em] border-[3px] border-black shadow-[4px_4px_0px_rgba(255,0,0,1)] hover:bg-accent-red hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_rgba(255,0,0,1)] disabled:hover:bg-black transition-all cursor-pointer"
                >
                  {saving ? "SAVING..." : '"CONFIRM RATING"'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="w-full py-4 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-[0.2em] border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            ) : isSaved ? (
              <button
                onClick={handleRemoveRating}
                disabled={saving}
                className="w-full py-4 bg-white text-accent-red text-[10px] font-mono font-bold uppercase tracking-[0.2em] border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-50 transition-all cursor-pointer"
              >
                REMOVE RATING
              </button>
            ) : null}

            {error && <div className="text-red-500 font-mono text-[10px] uppercase tracking-widest bg-red-100 p-2 border-[2px] border-red-500 mt-2">{error}</div>}
          </>
        ) : (
          <button
            onClick={() => router.push("/sign-in")}
            className="w-full py-4 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-[0.2em] border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer mt-4"
          >
            SIGN IN TO RATE
          </button>
        )}
      </div>
    </div>
  );
}
