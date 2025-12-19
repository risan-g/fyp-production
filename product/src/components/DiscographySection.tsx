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

  // Early return if no items exist for this specific category
  if (!items || items.length === 0) return null;

  /**
   * Logical Slice:
   * If showAll is false, limit the display to the first 5 items to prevent
   * long discographies from overwhelming the UI.
   */
  const displayed = showAll ? items : items.slice(0, 5);

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold capitalize">{title}</h2>

        {/* Only render the toggle button if there are more than 5 items */}
        {items.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            {showAll ? "Show less" : "Show all"}
          </button>
        )}
      </div>

      {/* Responsive grid for album covers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayed.map((album) => (
          <Link
            key={album.id}
            href={`/album/${album.id}`}
            className="bg-purple-900 rounded-xl overflow-hidden hover:shadow-xl hover:scale-105 transition-transform"
          >
            {/* Album Artwork display */}
            {album.images[0] && (
              <img
                src={album.images[0].url}
                alt={album.name}
                className="aspect-square w-full object-cover rounded-xl"
              />
            )}
            <div className="p-3">
              <p className="text-sm font-medium truncate">{album.name}</p>
              <p className="text-xs text-gray-400">{album.release_date}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
