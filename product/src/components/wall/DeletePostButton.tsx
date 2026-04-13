"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/app/actions/wall";
import ConfirmModal from "@/components/ConfirmModal";

/**
 * Client-side delete button for posts.
 * Only visible to the post author.
 */
export default function DeletePostButton({ postId, spotifyArtistId }: { postId: string; spotifyArtistId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    setShowConfirm(false);
    try {
      await deletePost(postId, spotifyArtistId);
      router.push(`/artist/${spotifyArtistId}/wall`);
    } catch (err: any) {
      alert(err.message || "Failed to delete post.");
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={deleting}
        className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-accent-red border-b-[2px] border-transparent hover:border-accent-red transition-all disabled:opacity-50 cursor-pointer"
      >
        {deleting ? "DELETING..." : "[ DELETE ]"}
      </button>

      {showConfirm && (
        <ConfirmModal
          message="DELETE THIS POST? ALL REPLIES WILL BE REMOVED."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
