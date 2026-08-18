"use client";

import { useState } from "react";
import { createComment } from "@/app/actions/wall";

export default function GlobalReplyForm({ postId, spotifyArtistId }: { postId: string, spotifyArtistId: string }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      // pass null for parentId to make it a top level comment
      await createComment(postId, null, content, spotifyArtistId);
      setContent("");
      // optionally router.refresh() if not already handled
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to post reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="WRITE A STANDALONE REPLY..."
        className="w-full bg-white border-[3px] border-black p-4 font-serif text-sm focus:outline-none min-h-[100px] placeholder:text-black/20 placeholder:uppercase"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={handlePost}
          disabled={isSubmitting || !content.trim()}
          className="bg-black text-white text-[10px] font-mono font-bold py-2 px-6 border-[2px] border-black hover:bg-accent-red transition-all disabled:opacity-50 tracking-[0.2em]"
        >
          {isSubmitting ? "POSTING..." : "POST REPLY"}
        </button>
      </div>
    </div>
  );
}
