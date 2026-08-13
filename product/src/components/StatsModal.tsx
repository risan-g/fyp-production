"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getRotationList, getSyncList } from "@/app/actions/profile-lists";
import RotationButton from "./RotationButton";
import SyncButton from "./SyncButton";

type Tab = "syncs" | "rotation";

interface StatsModalProps {
  userId: string;
  initialTab: Tab;
  onClose: () => void;
}

/**
 * StatsModal (Client Component)
 *
 * A high-performance, interactive dashboard overlay.
 */
export default function StatsModal({
  userId,
  initialTab,
  onClose,
}: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  /**
   * Infinite Scroll Logic (The Sentinel)
   */
  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  // Reset State on Tab Switch
  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setLoading(true);

      try {
        let result: any[] = [];
        if (activeTab === "rotation") {
          result = await getRotationList(userId, page);
        } else {
          result = await getSyncList(userId, page);
        }

        if (isCancelled) return;

        if (result.length === 0) {
          setHasMore(false);
        } else {
          setItems((prev) => (page === 0 ? result : [...prev, ...result]));
        }
      } catch (err) {
        if (!isCancelled) console.error("Failed to load list", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, page, userId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      <div
        className="fixed inset-0 bg-white/70 backdrop-blur-sm transition-opacity z-40"
        onClick={onClose}
      />
      <div className="relative z-50 bg-white border-[3px] border-black w-full max-w-3xl max-h-[75vh] flex flex-col shadow-[16px_16px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
        <div className="flex border-b-[3px] border-black bg-neutral-100 flex-shrink-0">
          <button
            onClick={() => setActiveTab("syncs")}
            className={`flex-1 py-5 text-sm font-bold uppercase tracking-[0.2em] transition-colors border-r-[3px] border-black ${activeTab === "syncs"
              ? "text-white bg-black"
              : "text-black hover:bg-neutral-200"
              }`}
          >
            "SYNCS"
          </button>
          <button
            onClick={() => setActiveTab("rotation")}
            className={`flex-1 py-5 text-sm font-bold uppercase tracking-[0.2em] transition-colors ${activeTab === "rotation"
              ? "text-white bg-black"
              : "text-black hover:bg-neutral-200"
              }`}
          >
            "ROTATION"
          </button>

          <button
            onClick={onClose}
            className="px-8 text-black bg-accent-red border-l-[3px] border-black hover:bg-black hover:text-white transition-colors text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar min-h-[300px]">
          {activeTab === "rotation" && (
            <div className="flex flex-col">
              {items.map((artist, index) => (
                <div
                  key={`${artist.spotify_artist_id}-${index}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 p-4 border-b-[2px] border-black/10 hover:bg-neutral-100 transition-colors last:border-b-0"
                >
                  <Link
                    href={`/artist/${artist.spotify_artist_id}`}
                    onClick={onClose}
                    className="block"
                  >
                    <div className="w-16 h-16 bg-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden">
                      {artist.artist_image_url ? (
                        <img
                          src={artist.artist_image_url}
                          alt={artist.artist_name}
                          className="w-full h-full object-cover transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black font-mono text-xs font-bold bg-neutral-100">
                          ?
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-col justify-center">
                    <Link
                      href={`/artist/${artist.spotify_artist_id}`}
                      onClick={onClose}
                      className="text-2xl font-black font-sans uppercase tracking-tighter text-black truncate hover:underline decoration-accent-red decoration-2 underline-offset-4"
                    >
                      {artist.artist_name}
                    </Link>
                  </div>

                  <div>
                    <div className="scale-90 origin-right">
                      <RotationButton
                        spotifyArtistId={artist.spotify_artist_id}
                        artistName={artist.artist_name}
                        artistImageUrl={artist.artist_image_url}
                        initialIsInRotation={artist.is_in_my_rotation}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- VIEW: SYNCS --- */}
          {activeTab === "syncs" && (
            <div className="flex flex-col">
              {items.map((user, index) => (
                <div
                  key={`${user.id}-${index}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 p-4 border-b-[2px] border-black/10 hover:bg-neutral-100 transition-colors last:border-b-0"
                >
                  {/* Avatar */}
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={onClose}
                    className="block"
                  >
                    <div className="w-16 h-16 bg-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-full h-full object-cover transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-black font-mono font-bold text-lg">
                          {user.username?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Username */}
                  <div className="flex flex-col justify-center">
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={onClose}
                      className="text-2xl font-black font-sans uppercase tracking-tighter text-black truncate hover:underline decoration-accent-red decoration-2 underline-offset-4"
                    >
                      {user.username || "UNKNOWN"}
                    </Link>
                  </div>

                  {/* Sync Button */}
                  <div>
                    {!user.is_me && (
                      <div className="scale-90 origin-right">
                        <SyncButton
                          targetUserId={user.id}
                          isPrivate={user.is_private}
                          initialIsFollowing={user.is_synced}
                          initialIsPending={user.is_pending}
                          isTargetFollowingMe={user.is_following_me}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LOADING STATE */}
          <div ref={lastElementRef} className="py-8 flex justify-center">
            {loading && (
              <div className="w-6 h-6 border-[3px] border-black border-t-accent-red rounded-full animate-spin" />
            )}
            {!hasMore && items.length > 0 && (
              <span className="text-[10px] uppercase font-mono text-black font-bold tracking-[0.2em] opacity-40">
                END OF LIST //
              </span>
            )}
            {!loading && items.length === 0 && (
              <span className="text-sm text-black/50 font-mono font-bold uppercase tracking-[0.2em]">
                LIST IS EMPTY.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
