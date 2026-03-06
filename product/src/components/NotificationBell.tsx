"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  getSyncRequests,
  declineSyncRequest,
} from "@/app/actions/notifications";
import { toggleFollow } from "@/app/actions/follow";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "requests">("menu");
  const [requests, setRequests] = useState<any[]>([]);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setTimeout(() => setView("menu"), 200);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch requests on initial load (for the red dot) AND when opened
  useEffect(() => {
    const fetchReqs = async () => {
      const data = await getSyncRequests();
      setRequests(data || []);
    };

    fetchReqs();
  }, [isOpen]);

  const handleSyncBack = async (targetId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== targetId));
    await toggleFollow(targetId);
  };

  const handleDecline = async (targetId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== targetId));
    await declineSyncRequest(targetId);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* THE Bell Button*/}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-black bg-white border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {/* The Red Notification Dot */}
        {requests.length > 0 && (
          <span className="absolute -top-2 -right-2 w-3 h-3 bg-accent-red border-[2px] border-black" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[400px] bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] z-50">
          {/* Header Area */}
          <div className="px-5 py-4 border-b-[3px] border-black flex items-center bg-white">
            {view === "requests" && (
              <button
                onClick={() => setView("menu")}
                className="mr-3 text-black hover:text-accent-red font-bold text-lg transition-colors leading-none"
              >
                ←
              </button>
            )}
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black">
              {view === "menu" ? '"NOTIFICATIONS"' : '"SYNC REQUESTS"'}
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {/* THE MAIN MENU */}
            {view === "menu" && (
              <div className="p-4">
                <button
                  onClick={() => setView("requests")}
                  className="w-full flex items-center justify-between p-4 border-[3px] border-black hover:bg-neutral-50 transition-colors text-left group shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <div>
                    <p className="text-sm font-bold font-mono uppercase tracking-widest text-black">
                      FOLLOW REQUESTS
                    </p>
                    <p className="text-xs font-serif text-black/60 mt-1">
                      Approve or ignore incoming syncs
                    </p>
                  </div>
                  {requests.length > 0 && (
                    <span className="bg-accent-red text-white text-[10px] font-mono font-bold px-2 py-1 border-[2px] border-black">
                      {requests.length}
                    </span>
                  )}
                </button>

                <div className="p-4 text-center mt-4 border-t-[2px] border-black/10">
                  <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-black/40">NO NEW ACTIVITY.</p>
                </div>
              </div>
            )}

            {/* THE ACTUAL REQUESTS */}
            {view === "requests" && (
              <div className="p-4 flex flex-col gap-4">
                {requests.length === 0 ? (
                  <div className="py-10 text-center border-[3px] border-black border-dashed bg-neutral-50">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-black/40">
                      NO PENDING REQUESTS.
                    </p>
                  </div>
                ) : (
                  requests.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black border-[2px] border-black flex items-center justify-center shrink-0">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-serif font-bold uppercase">{user.username?.[0] || '?'}</span>
                          )}
                        </div>
                        <Link
                          href={`/profile/${user.username}`}
                          className="text-sm font-bold font-sans uppercase tracking-tight text-black hover:underline decoration-accent-red decoration-2 underline-offset-4 transition-colors"
                        >
                          {user.username}
                        </Link>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {/* Sync Back Button */}
                        <button
                          onClick={() => handleSyncBack(user.id)}
                          className="px-4 py-2 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-widest border-[2px] border-black hover:bg-accent-red transition-colors"
                        >
                          SYNC
                        </button>
                        {/* Decline Button */}
                        <button
                          onClick={() => handleDecline(user.id)}
                          className="px-3 py-2 bg-white text-black border-[2px] border-black text-[10px] font-mono font-bold hover:bg-black hover:text-white transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
