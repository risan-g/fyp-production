"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RatingProps {
  albumId: string;
  albumName: string;
  artistName: string;
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
}: RatingProps) {
  const [rating, setRating] = useState(0);
  const isDragging = useRef(false);
  const sliderWrapperRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [originalRating, setOriginalRating] = useState(0);
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

  const updateRatingFromY = (clientY: number) => {
    if (!sliderWrapperRef.current) return;

    const trackRect = sliderWrapperRef.current.getBoundingClientRect();
    let newTop = clientY - trackRect.top;
    let percent = newTop / trackRect.height;
    percent = Math.max(0, Math.min(1, percent));

    const value = (1 - percent) * 100;
    return value;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!user || saving) return;
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
    if (value !== undefined) {
      setRating(Math.round(value));
    }
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

    const value = updateRatingFromY(e.clientY);
    if (value !== undefined) {
      const finalValue = Math.round(value / 10) * 10;
      setRating(finalValue);
    }
  };

  const handleSaveRating = async () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (rating === originalRating) return;

    setSaving(true);
    setError("");

    try {
      const { data: existing } = await supabase
        .from("album_ratings")
        .select("id")
        .eq("user_id", user.id)
        .eq("album_id", albumId)
        .single();

      if (existing) {
        const { error: updateError } = await supabase
          .from("album_ratings")
          .update({ rating, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateError) throw updateError;
      } else {
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
  const hasChanged = rating !== originalRating;

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
