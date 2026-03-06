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
 * Handles writing reviews and deleting them.
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

  const handleSave = async () => {
    // If not logged in, redirect to the sign-in page
    if (!user) return router.push("/sign-in");

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
      window.dispatchEvent(new CustomEvent("review-updated"));
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
      window.dispatchEvent(new CustomEvent("review-updated"));
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="border-[3px] border-black p-6 bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
      <div className="flex justify-between items-center border-b-[2px] border-black/10 pb-4">
        <label className="text-[10px] text-black font-mono font-bold uppercase tracking-[0.2em]">
          {user ? '"YOUR REVIEW"' : '"REVIEW THIS ALBUM"'}
        </label>
      </div>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        disabled={!user || saving}
        placeholder={user ? "Share your thoughts..." : "Sign in to write..."}
        className="w-full bg-neutral-50 border-[3px] border-black p-4 text-lg font-serif text-black focus:outline-none focus:bg-white transition-colors resize-none h-32 placeholder:text-black/30 placeholder:font-mono placeholder:text-xs placeholder:uppercase tracking-widest shadow-inner shadow-black/5"
      />

      {user ? (
        <div className="flex flex-col gap-3 mt-4">
          {/* Publish/Update */}
          <button
            onClick={handleSave}
            disabled={saving || !review.trim()}
            className="w-full py-4 bg-black text-white text-xs font-mono font-bold uppercase tracking-[0.2em] border-[3px] border-black shadow-[4px_4px_0px_rgba(255,0,0,1)] hover:bg-accent-red hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_rgba(255,0,0,1)] disabled:hover:bg-black transition-all cursor-pointer"
          >
            {saving ? "SAVING..." : hasExistingReview ? "UPDATE REVIEW" : "PUBLISH REVIEW"}
          </button>

          {/* Delete Button */}
          {hasExistingReview && (
            <button
              onClick={handleDeleteReview}
              disabled={saving}
              className="w-full py-3 bg-white text-accent-red text-xs font-mono font-bold uppercase tracking-[0.2em] border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] disabled:hover:bg-white disabled:hover:text-accent-red transition-all cursor-pointer mt-2"
            >
              DELETE REVIEW
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => router.push("/sign-in")}
          className="w-full py-4 mt-4 bg-white text-black text-xs font-mono font-bold uppercase tracking-[0.2em] border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer"
        >
          SIGN IN TO POST
        </button>
      )}
    </div>
  );
}
