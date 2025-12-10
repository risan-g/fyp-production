"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ReviewFormProps {
  albumId: string;
}

/**
 * Review Form Component.
 *
 * This component handles the logic for writing and editing reviews.
 * It checks if the user is logged in, pre-fills their existing review,
 * and saves changes to the database.
 */
export default function ReviewForm({ albumId }: ReviewFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // Local state to manage the text input and loading status
  const [review, setReview] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // When the component loads, we check who the current user is and if they have ALREADY written a review for this album so they can edit it.
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: existing } = await supabase
          .from("album_reviews")
          .select("review_text")
          .eq("user_id", user.id)
          .eq("album_id", albumId)
          .single();

        // If a review exists, put the text into the box so they can edit it
        if (existing) setReview(existing.review_text);
      }
      setLoading(false);
    };
    loadData();
  }, [albumId]);

  // Handle the "Publish" button click
  const handleSave = async () => {
    // If not logged in, redirect to the sign-in page
    if (!user) return router.push("/sign-in");

    // Don't save empty reviews
    if (!review.trim()) return;

    setSaving(true);

    // Save to Supabase.
    // We use "upsert" (Update or Insert) so this works for both
    // writing a new review AND editing an old one.
    const { error } = await supabase.from("album_reviews").upsert(
      {
        user_id: user.id,
        album_id: albumId,
        review_text: review.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, album_id" }
    );

    setSaving(false);

    if (!error) {
      // Refresh the page so the new review appears in the list below immediately
      router.refresh();
    } else {
      alert("Error saving review.");
      console.error(error);
    }
  };

  // Don't show anything until we know the login status
  if (loading) return null;

  return (
    <div className="bg-black-900 rounded-lg p-4 flex flex-col gap-4">
      <label className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
        {user ? "Your Review" : "Review this Album"}
      </label>

      {/* The Text Box */}
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        disabled={!user || saving}
        placeholder={user ? "Share your thoughts..." : "Sign in to write..."}
        className="w-full bg-black border border-neutral-800 rounded-md p-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors resize-none h-32 placeholder:text-neutral-700"
      />

      {/* The Button changes based on login status */}
      {user ? (
        <button
          onClick={handleSave}
          disabled={saving || !review.trim()}
          className="w-full py-2 bg-neutral-800 text-white text-xs font-bold rounded uppercase tracking-widest hover:bg-neutral-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Publish"}
        </button>
      ) : (
        <button
          onClick={() => router.push("/sign-in")}
          className="w-full py-2 bg-neutral-800 text-neutral-400 text-xs font-bold rounded uppercase tracking-widest hover:bg-neutral-700 transition-colors"
        >
          Sign in to Post
        </button>
      )}
    </div>
  );
}
