"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

type Range = "24h" | "week" | "month" | "year" | "all";

const RANGES: { label: string; value: Range }[] = [
  { label: "24H", value: "24h" },
  { label: "WEEK", value: "week" },
  { label: "MONTH", value: "month" },
  { label: "YEAR", value: "year" },
  { label: "ALL", value: "all" },
];

// Auto-fallback order when a range has no data on initial load
const FALLBACK_ORDER: Range[] = ["24h", "week", "month", "year", "all"];

interface Album {
  album_id: string;
  name: string;
  artist: string;
  image: string;
  average: number;
  logCount: number;
}

/**
 * HottestAlbums (Client Component)
 * Displays the top 5 albums ranked by log count for a selected timeframe.
 * On first load, auto-falls back through 24h → week → month → year → all
 * until it finds a range with actual data.
 */
export default function HottestAlbums() {
  const [activeRange, setActiveRange] = useState<Range>("24h");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAutoFallen, setHasAutoFallen] = useState(false);

  const fetchAlbums = useCallback(async (range: Range) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/hottest-albums?range=${range}`);
      const data: Album[] = await res.json();
      setAlbums(data);
      return data.length;
    } catch {
      setAlbums([]);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On mount: auto-fallback through ranges until we find data
  useEffect(() => {
    const autoFallback = async () => {
      for (const range of FALLBACK_ORDER) {
        const count = await fetchAlbums(range);
        if (count > 0) {
          setActiveRange(range);
          break;
        }
      }
      setHasAutoFallen(true);
    };
    autoFallback();
  }, [fetchAlbums]);

  // When user manually picks a range, fetch that range (no auto-fallback)
  const handleRangeChange = (range: Range) => {
    if (range === activeRange) return;
    setActiveRange(range);
    fetchAlbums(range);
  };

  return (
    <div className="border-[3px] border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b-[3px] border-black">
        <h3 className="font-mono text-sm uppercase tracking-widest text-black flex items-center gap-2 font-bold">
          <Star className="w-5 h-5 text-accent-red fill-accent-red" />
          "HOTTEST"
        </h3>
      </div>

      {/* Timeframe Tabs */}
      <div className="flex border-b-[2px] border-black/10">
        {RANGES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleRangeChange(value)}
            className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.15em] transition-all cursor-pointer border-r-[2px] border-black/10 last:border-r-0 ${
              activeRange === value
                ? "bg-black text-white"
                : "bg-white text-black/50 hover:text-black hover:bg-neutral-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-4 bg-black/10 animate-pulse" />
                <div className="w-14 h-14 bg-black/10 animate-pulse shrink-0" />
                <div className="flex flex-col gap-1 flex-1">
                  <div className="h-3 bg-black/10 animate-pulse rounded w-3/4" />
                  <div className="h-2 bg-black/5 animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-black/40 text-xs font-mono uppercase tracking-widest font-bold text-center">
            [NO DATA]
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {albums.map((album, index) => (
              <Link
                href={`/album/${album.album_id}`}
                key={album.album_id}
                className="flex items-center gap-3 group"
              >
                <span className="text-black/40 font-mono text-xl font-black w-6 text-center group-hover:text-accent-red transition-colors">
                  {index + 1}
                </span>

                <div className="w-14 h-14 border-2 border-black bg-black shrink-0 relative">
                  {album.image ? (
                    <img
                      src={album.image}
                      alt={album.name}
                      className="w-full h-full object-cover z-10 relative"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-mono">N/A</div>
                  )}
                  <div className="absolute top-1 left-1 w-full h-full bg-black/10 -z-0" />
                </div>

                <div className="flex flex-col flex-1 min-w-0 px-2 border-l-2 border-black/10">
                  <span className="text-black font-black text-sm uppercase truncate group-hover:underline decoration-accent-red decoration-2 underline-offset-2">
                    {album.name}
                  </span>
                  <span className="text-black/60 font-mono text-[10px] uppercase tracking-widest truncate">
                    {album.artist}
                  </span>
                </div>

                <div className="flex flex-col items-end justify-center shrink-0">
                  {album.average > 0 ? (
                    <span className="text-black font-black text-lg">{album.average}</span>
                  ) : (
                    <span className="text-black/20 font-black text-lg">--</span>
                  )}
                  <span className="text-black/50 font-mono text-[10px] uppercase tracking-widest font-bold">
                    {album.logCount} {album.logCount === 1 ? "LOG" : "LOGS"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
