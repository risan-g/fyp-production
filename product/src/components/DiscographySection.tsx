"use client";

import Link from "next/link";
import { useState } from "react";

export default function DiscographySection({
  title,
  items,
}: {
  title: string;
  items: any[];
}) {
  const [showAll, setShowAll] = useState(false);

  if (!items || items.length === 0) return null;

  const displayed = showAll ? items : items.slice(0, 5);

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold capitalize">{title}</h2>
        {items.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            {showAll ? "Show less" : "Show all"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayed.map((album) => (
          <Link
            key={album.id}
            href={`/album/${album.id}`}
            className="bg-purple-900 rounded-xl overflow-hidden hover:shadow-xl hover:scale-105 transition-transform"
          >
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
