"use client";

import { useState, useEffect } from "react";
import { getMySpotifyPlaylists, publishPlaylist, unpublishPlaylist, getPublishedPlaylists, SpotifyPlaylist, PublishedPlaylist } from "@/app/actions/playlists";

export default function PlaylistGrid({ userId }: { userId: string }) {
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [publishedPlaylists, setPublishedPlaylists] = useState<PublishedPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      const [spotifyRes, publishedRes] = await Promise.all([
        getMySpotifyPlaylists(),
        getPublishedPlaylists(userId)
      ]);

      if (spotifyRes.error) {
        setError(spotifyRes.error);
      } else if (spotifyRes.playlists) {
        setSpotifyPlaylists(spotifyRes.playlists);
      }

      setPublishedPlaylists(publishedRes);
      setIsLoading(false);
    }

    loadData();
  }, [userId]);

  const handleTogglePublish = async (playlist: SpotifyPlaylist, isPublished: boolean) => {
    setActionLoadingId(playlist.id);

    if (isPublished) {
      // Unpublish
      const res = await unpublishPlaylist(playlist.id);
      if (res.success) {
        setPublishedPlaylists(prev => prev.filter(p => p.spotify_playlist_id !== playlist.id));
      } else {
        alert(res.error || "Failed to unpublish");
      }
    } else {
      // Publish
      if (publishedPlaylists.length >= 4) {
        alert("You have reached the maximum limit of 4 published collections.");
        setActionLoadingId(null);
        return;
      }

      const res = await publishPlaylist({
        spotifyId: playlist.id,
        name: playlist.name,
        imageUrl: playlist.images?.[0]?.url || null,
        tracksTotal: playlist.tracks?.total || 0,
      });

      if (res.success) {
        setPublishedPlaylists(prev => [...prev, {
          id: "temp-" + Date.now(),
          user_id: userId,
          spotify_playlist_id: playlist.id,
          name: playlist.name,
          image_url: playlist.images?.[0]?.url || null,
          tracks_total: playlist.tracks?.total || 0,
          created_at: new Date().toISOString()
        }]);
      } else {
        alert(res.error || "Failed to publish");
      }
    }

    setActionLoadingId(null);
  };

  if (isLoading) {
    return (
      <div className="w-full p-8 border-[3px] border-black border-dashed flex items-center justify-center bg-neutral-50 mb-8 mt-4">
        <p className="font-mono text-xs uppercase font-bold tracking-[0.2em] animate-pulse">
          LOADING COLLECTIONS...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8 border-[3px] border-accent-red flex flex-col items-center justify-center bg-red-50 mt-4 text-center gap-2">
        <p className="font-mono text-xs font-bold text-accent-red uppercase tracking-widest">
          SYNC ERROR
        </p>
        <p className="font-mono text-[10px] text-accent-red/70 uppercase">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
        <h4 className="font-black uppercase tracking-tighter text-xl">Curate Collections</h4>
        <div className="font-mono text-[10px] font-bold tracking-[0.2em] bg-black text-white px-3 py-1 border-[2px] border-black shadow-[2px_2px_0px_#C8102E]">
          {publishedPlaylists.length} / 4 PUBLISHED
        </div>
      </div>

      {spotifyPlaylists.length === 0 ? (
        <p className="font-mono text-xs text-black/50 uppercase">No playlists found on your Spotify account.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {spotifyPlaylists.map(playlist => {
            const isPublished = publishedPlaylists.some(p => p.spotify_playlist_id === playlist.id);
            const isActionLoading = actionLoadingId === playlist.id;

            return (
              <div
                key={playlist.id}
                className={`flex border-[3px] border-black bg-white transition-all ${isPublished ? "shadow-[4px_4px_0px_rgba(0,0,0,1)]" : "shadow-none opacity-80 hover:opacity-100"}`}
              >
                {/* Image */}
                <div className="w-24 h-24 shrink-0 bg-neutral-200 border-r-[3px] border-black">
                  {playlist.images?.[0]?.url ? (
                    <img src={playlist.images[0].url} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-mono">NO IMG</div>
                  )}
                </div>

                {/* Info & Button */}
                <div className="flex flex-col justify-between p-3 flex-grow overflow-hidden">
                  <div>
                    <h5 className="font-bold text-sm uppercase truncate leading-tight">{playlist.name}</h5>
                    <p className="font-mono text-[9px] text-black/60 uppercase tracking-widest mt-1">
                      {playlist.tracks?.total || 0} TRACKS
                    </p>
                  </div>

                  <button
                    onClick={() => handleTogglePublish(playlist, isPublished)}
                    disabled={isActionLoading || (!isPublished && publishedPlaylists.length >= 4)}
                    className={`font-mono text-[10px] font-bold uppercase tracking-widest py-1.5 px-2 border-[2px] border-black transition-all text-center
                      ${isActionLoading ? "opacity-50 cursor-wait bg-neutral-200 text-black" :
                        isPublished ? "bg-accent-red text-white hover:bg-black" :
                          "bg-white text-black hover:bg-black hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"}
                    `}
                  >
                    {isActionLoading ? "..." : isPublished ? "UNPUBLISH" : "PUBLISH"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
