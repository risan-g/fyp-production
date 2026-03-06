"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * DiscographySection Component
 * Renders a categorised grid of albums (e.g., Albums, EPs, or Singles).
 * Includes a "Show All" toggle to manage vertical space on the artist page.
 */
export default function DiscographySection({
  title,
  items,
}: {
  title: string;
  items: any[];
}) {
  // Local state to manage whether the full list or a preview is shown
  const [showAll, setShowAll] = useState(false);

  if (!items || items.length === 0) return null;

  /**
   * If showAll is false, limit the display to the first 5 items.
   */
  const displayed = showAll ? items : items.slice(0, 5);

  return (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-6 pb-2 border-b-[2px] border-black/10">
        <h2 className="text-sm text-black font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="w-2 h-2 bg-accent-red flex-shrink-0"></span>
          "{title}"
        </h2>

        {/* Only render the toggle button if there are more than 5 items */}
        {items.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-4 py-2 border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
          >
            {showAll ? "SHOW LESS -" : "SHOW ALL +"}
          </button>
        )}
      </div>

      {/* Responsive grid for album covers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {displayed.map((album) => (
          <Link
            key={album.id}
            href={`/album/${album.id}`}
            className="group border-[3px] border-black bg-white hover:bg-neutral-50 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex flex-col"
          >
            {/* Album Artwork display */}
            <div className="w-full aspect-square border-b-[3px] border-black overflow-hidden relative bg-neutral-100">
              {album.images[0] ? (
                <img
                  src={album.images[0].url}
                  alt={album.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-black text-xs font-bold uppercase">NO IMAGE</div>
              )}
            </div>

            <div className="p-4 flex flex-col flex-grow">
              <p className="text-xl font-bold font-sans uppercase tracking-tight text-black leading-tight group-hover:underline decoration-accent-red decoration-2 underline-offset-4 line-clamp-2">
                {album.name}
              </p>
              <div className="flex-grow"></div>
              <p className="text-[10px] font-mono text-black/50 font-bold uppercase tracking-[0.2em] mt-3 pt-3 border-t-[2px] border-black/10">
                {album.release_date.substring(0, 4)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
