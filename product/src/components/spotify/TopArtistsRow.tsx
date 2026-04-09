"use client";

import { useEffect, useState } from "react";
import { refreshTopArtists, CachedTopArtist } from "@/app/actions/spotify-stats";

interface TopArtistsRowProps {
  initialArtists: CachedTopArtist[];
  isOwnProfile: boolean;
  isSpotifyLinked: boolean;
}

export default function TopArtistsRow({
  initialArtists,
  isOwnProfile,
  isSpotifyLinked,
}: TopArtistsRowProps) {
  const [artists, setArtists] = useState<CachedTopArtist[]>(initialArtists);

  // Silently refresh the cache when the owner views their own profile
  useEffect(() => {
    if (isOwnProfile && isSpotifyLinked) {
      refreshTopArtists().then((res) => {
        if (res.artists) {
          setArtists(res.artists);
        }
      });
    }
  }, [isOwnProfile, isSpotifyLinked]);

  if (artists.length === 0) return null;

  return (
    <div className="mt-16 w-full">
      <div className="flex items-end justify-between border-b-[3px] border-black pb-4 mb-8">
        <h2 className="text-sm text-black font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="w-2 h-2 bg-[#1DB954] flex-shrink-0"></span>
          &quot;TOP SPOTIFY ARTISTS&quot;
        </h2>

      </div>

      <div className="flex items-start justify-between gap-4">
        {artists.map((artist, index) => (
          <div key={artist.spotify_id} className="flex flex-col items-center gap-3 flex-1 min-w-0">
            <div className="relative w-full aspect-square border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden bg-neutral-200 group">
              {artist.image_url ? (
                <img
                  src={artist.image_url}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-xs text-black/40">
                  ?
                </div>
              )}
              <div className="absolute top-0 left-0 bg-black text-white text-[10px] font-mono font-black px-2 py-1">
                {index + 1}
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-center truncate w-full">
              {artist.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
