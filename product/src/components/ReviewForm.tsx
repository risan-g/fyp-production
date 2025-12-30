"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ReviewFormProps {
  albumId: string;
  albumName: string;
  artistName: string;
  albumImage: string;
}

/**
 * Review Form Component.
 * Handles writing reviews and deleting them (leaving rating intact if it exists).
 */
export default function ReviewForm({
  albumId,
  albumName,
  artistName,
  albumImage,
}: ReviewFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [review, setReview] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch from 'reviews' table
        const { data: existing } = await supabase
          .from("reviews")
          .select("content")
          .eq("user_id", user.id)
          .eq("album_id", albumId)
          .single();

        if (existing && existing.content) {
          setReview(existing.content);
          setHasExistingReview(true);
        }
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

    try {
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("album_id", albumId)
        .single();

      if (existing) {
        // Update content only
        await supabase
          .from("reviews")
          .update({
            content: review.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("reviews").insert({
          user_id: user.id,
          album_id: albumId,
          album_name: albumName,
          artist_name: artistName,
          album_image_url: albumImage,
          content: review.trim(),
          rating: null,
        });
      }

      setHasExistingReview(true);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error saving review.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    setSaving(true);

    try {
      // Check if rating exists
      const { data: existing } = await supabase
        .from("reviews")
        .select("rating")
        .eq("user_id", user.id)
        .eq("album_id", albumId)
        .single();

      if (existing && existing.rating !== null) {
        // Keep the row, just dlete the text
        await supabase
          .from("reviews")
          .update({ content: null })
          .eq("user_id", user.id)
          .eq("album_id", albumId);
      } else {
        // Delete the whole row
        await supabase
          .from("reviews")
          .delete()
          .eq("user_id", user.id)
          .eq("album_id", albumId);
      }

      setReview("");
      setHasExistingReview(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-black-900 rounded-lg p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <label className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
          {user ? "Your Review" : "Review this Album"}
        </label>
      </div>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        disabled={!user || saving}
        placeholder={user ? "Share your thoughts..." : "Sign in to write..."}
        className="w-full bg-black border border-neutral-800 rounded-md p-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors resize-none h-32 placeholder:text-neutral-700"
      />

      {/* The Button changes based on login status */}
      {user ? (
        <div className="flex flex-col gap-3">
          {/* Publish/Update */}
          <button
            onClick={handleSave}
            disabled={saving || !review.trim()}
            className="w-full py-2 bg-neutral-800 text-white text-xs font-bold rounded uppercase tracking-widest hover:bg-neutral-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : hasExistingReview ? "Update" : "Publish"}
          </button>

          {/* Delete Button */}
          {hasExistingReview && (
            <button
              onClick={handleDeleteReview}
              disabled={saving}
              className="w-full py-2 bg-red-600 text-white text-xs font-bold rounded uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
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
