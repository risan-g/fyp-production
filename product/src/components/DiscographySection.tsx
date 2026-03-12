"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * ScHoolboy Q Easter Egg [all words start with capital letter, h becomes H].
 */
function scHoolboyTransform(text: string): string {
  return text
    .split("")
    .map((char, i) => {
      if (i === 0) return char.toUpperCase();
      if (char.toLowerCase() === "h") return "H";
      return char.toLowerCase();
    })
    .join("");
}

/**
 * DiscographySection Component
 * Renders a categorised grid of albums (e.g., Albums, EPs, or Singles).
 * Includes a "Show All" toggle to manage vertical space on the artist page.
 */
export default function DiscographySection({
  title,
  items,
  isQ = false,
}: {
  title: string;
  items: any[];
  isQ?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const formatText = (text: string) => isQ ? scHoolboyTransform(text) : text;

  if (!items || items.length === 0) return null;

  const displayed = showAll ? items : items.slice(0, 5);

  return (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-6 pb-2 border-b-[2px] border-black/10">
        <h2 className={`text-sm text-black font-mono font-bold tracking-[0.2em] flex items-center gap-2 ${isQ ? "" : "uppercase"}`}>
          <span className="w-2 h-2 bg-accent-red flex-shrink-0"></span>
          "{title}"
        </h2>

        {items.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className={`text-[10px] font-mono font-bold tracking-[0.2em] px-4 py-2 border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer ${isQ ? "" : "uppercase"}`}
          >
            {showAll ? formatText("Show Less -") : formatText("Show All +")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {displayed.map((album) => (
          <Link
            key={album.id}
            href={`/album/${album.id}`}
            className="group border-[3px] border-black bg-white hover:bg-neutral-50 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex flex-col"
          >
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
              <p className={`text-xl font-bold font-sans tracking-tight text-black leading-tight group-hover:underline decoration-accent-red decoration-2 underline-offset-4 line-clamp-2 ${isQ ? "" : "uppercase"}`}>
                {isQ ? formatText(album.name) : album.name}
              </p>
              <div className="flex-grow"></div>
              <p className={`text-[10px] font-mono text-black/50 font-bold tracking-[0.2em] mt-3 pt-3 border-t-[2px] border-black/10 ${isQ ? "" : "uppercase"}`}>
                {album.release_date.substring(0, 4)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
