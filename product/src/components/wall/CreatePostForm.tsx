"use client";

import { useState } from "react";
import { createPost } from "@/app/actions/wall";

/**
 * Form for starting new threads.
 */
export default function CreatePostForm({ spotifyArtistId, onClose }: { spotifyArtistId: string, onClose?: () => void }) {

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPost(spotifyArtistId, title, content);
      setTitle("");
      setContent("");
      if (onClose) onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create post.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col gap-4 relative">
      {onClose && (
        <button 
          type="button" 
          onClick={onClose} 
          className="absolute top-4 right-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:text-accent-red"
        >
          [ X ]
        </button>
      )}
      <div className="border-b-[2px] border-black pb-2 mb-2 flex items-center gap-2">

        <span className="w-2 h-2 bg-accent-red flex-shrink-0"></span>
        <h3 className="text-black font-mono font-bold uppercase tracking-[0.2em] text-sm">&quot;MAKE SOME NOISE&quot;</h3>
      </div>

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="THREAD TITLE..."
        className="w-full bg-neutral-50 border-[3px] border-black p-4 font-sans font-bold text-lg focus:outline-none uppercase placeholder:text-black/30 placeholder:font-mono placeholder:text-xs"
        maxLength={300}
        required
      />

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="WHAT DO YOU WANT TO SAY?"
        className="w-full bg-neutral-50 border-[3px] border-black p-4 font-serif text-lg resize-y min-h-[120px] focus:outline-none placeholder:text-black/30 placeholder:font-mono placeholder:text-xs placeholder:uppercase"
        maxLength={40000}
        required
      />

      <button
        type="submit"
        disabled={saving || !title.trim() || !content.trim()}
        className="bg-black text-white font-mono font-bold uppercase tracking-[0.2em] py-4 border-[3px] border-black hover:bg-accent-red hover:shadow-[4px_4px_0px_rgba(255,0,0,1)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {saving ? "POSTING..." : "POST"}
      </button>
    </form>
  );
}
