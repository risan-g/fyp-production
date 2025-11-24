"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ReviewFormProps {
  albumId: string;
}

export default function ReviewForm({ albumId }: ReviewFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [review, setReview] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

        if (existing) setReview(existing.review_text);
      }
      setLoading(false);
    };
    loadData();
  }, [albumId]);

  const handleSave = async () => {
    if (!user) return router.push("/sign-in");
    if (!review.trim()) return;

    setSaving(true);

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
      router.refresh();
    } else {
      alert("Error saving review.");
      console.error(error);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-black-900 rounded-lg p-4 flex flex-col gap-4">
      <label className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
        {user ? "Your Review" : "Review this Album"}
      </label>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        disabled={!user || saving}
        placeholder={user ? "Share your thoughts..." : "Sign in to write..."}
        className="w-full bg-black border border-neutral-800 rounded-md p-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors resize-none h-32 placeholder:text-neutral-700"
      />

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
