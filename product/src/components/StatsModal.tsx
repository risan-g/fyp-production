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
 *
 */
export default function StatsModal({
  userId,
  initialTab,
  onClose,
}: StatsModalProps) {
  // UI State
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  /**
   * UX Polish: Body Scroll Lock
   * Prevents the background page from scrolling while the modal is open.
   */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  /**
   * Infinite Scroll Logic (The Sentinel)
   *
   * We attach this Ref to a hidden div at the bottom of the list.
   * When that div enters the viewport (isIntersecting), we increment the page number.
   * This triggers the useEffect below to fetch more data.
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
  // When switching from "Syncs" to "Rotation", we must clear the list immediately
  // to avoid showing the wrong data while loading.
  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    setLoading(false);
  }, [activeTab]);

  /**
   * Data Fetching Pipeline
   * Triggered by: Tab Change OR Page Increment (Scroll)
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let newItems: any[] = [];

      try {
        if (activeTab === "rotation") {
          newItems = await getRotationList(userId, page);
        } else {
          newItems = await getSyncList(userId, page);
        }

        if (newItems.length === 0) {
          setHasMore(false);
        } else {
          // If page 0, replace list. If page > 0, append to list.
          setItems((prev) => (page === 0 ? newItems : [...prev, ...newItems]));
        }
      } catch (err) {
        console.error("Failed to load list", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, page, userId]);

  return (
    // WRAPPER: Fixed to viewport, Top Z-Index (100)
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Sits behind the modal but above the page content. */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity z-40"
        onClick={onClose}
      />

      {/* Explicitly higher than backdrop to ensure interactivity. */}
      <div className="relative z-50 bg-black border border-neutral-800 w-full max-w-3xl max-h-[75vh] flex flex-col shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/50 flex-shrink-0">
          <button
            onClick={() => setActiveTab("syncs")}
            className={`flex-1 py-5 text-sm font-bold uppercase tracking-[0.2em] transition-colors ${
              activeTab === "syncs"
                ? "text-white bg-white/5"
                : "text-neutral-600 hover:text-neutral-400"
            }`}
          >
            Syncs
          </button>
          <button
            onClick={() => setActiveTab("rotation")}
            className={`flex-1 py-5 text-sm font-bold uppercase tracking-[0.2em] transition-colors ${
              activeTab === "rotation"
                ? "text-white bg-white/5"
                : "text-neutral-600 hover:text-neutral-400"
            }`}
          >
            Rotation
          </button>

          <button
            onClick={onClose}
            className="px-8 text-neutral-500 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-[300px]">
          {/* --- VIEW: ROTATION --- */}
          {activeTab === "rotation" && (
            <div className="flex flex-col gap-3">
              {items.map((artist, index) => (
                <div
                  key={`${artist.spotify_artist_id}-${index}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-8 p-3 rounded-lg hover:bg-neutral-900/40 transition-colors border border-transparent hover:border-neutral-800"
                >
                  {/* Image */}
                  <Link
                    href={`/artist/${artist.spotify_artist_id}`}
                    onClick={onClose}
                    className="block"
                  >
                    <div className="w-14 h-14 bg-neutral-800 rounded-md overflow-hidden border border-neutral-800 shadow-sm">
                      {artist.artist_image_url ? (
                        <img
                          src={artist.artist_image_url}
                          alt={artist.artist_name}
                          className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600 font-mono text-xs">
                          ?
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Name */}
                  <Link
                    href={`/artist/${artist.spotify_artist_id}`}
                    onClick={onClose}
                    className="text-base font-bold text-neutral-300 truncate group-hover:text-white transition-colors"
                  >
                    {artist.artist_name}
                  </Link>

                  {/* Action Button */}
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
            <div className="flex flex-col gap-3">
              {items.map((user, index) => (
                <div
                  key={`${user.id}-${index}`}
                  // Uses the exact same Grid layout for consistency
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-8 p-3 rounded-lg hover:bg-neutral-900/40 transition-colors border border-transparent hover:border-neutral-800"
                >
                  {/* Avatar */}
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={onClose}
                    className="block"
                  >
                    <div className="w-14 h-14 bg-neutral-800 rounded-md overflow-hidden border border-neutral-800 shadow-sm">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500 font-mono text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Username */}
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={onClose}
                    className="text-base font-bold text-neutral-300 truncate group-hover:text-white transition-colors"
                  >
                    {user.username}
                  </Link>

                  {/* Sync Button */}
                  <div>
                    {!user.is_me && (
                      <div className="scale-90 origin-right">
                        <SyncButton
                          targetUserId={user.id}
                          initialIsFollowing={user.is_synced}
                          isTargetFollowingMe={false}
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
              <div className="w-6 h-6 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
            )}
            {!hasMore && items.length > 0 && (
              <span className="text-[10px] uppercase text-neutral-600 tracking-widest opacity-50">
                End of list
              </span>
            )}
            {!loading && items.length === 0 && (
              <span className="text-sm text-neutral-500 font-mono">
                List is empty.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
