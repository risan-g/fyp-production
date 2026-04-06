"use client";

import { useState } from "react";
import CreatePostForm from "./CreatePostForm";

export default function NewPostButton({ spotifyArtistId }: { spotifyArtistId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-white border-[3px] border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all focus:outline-none"
        aria-label="Create Post"
      >
        <span className="font-serif text-4xl mb-1">+</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl relative animate-in fade-in zoom-in duration-200">
            <CreatePostForm 
              spotifyArtistId={spotifyArtistId} 
              onClose={() => setIsOpen(false)} 
            />
          </div>
        </div>
      )}
    </>
  );
}
