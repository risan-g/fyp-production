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
        className="relative p-2 text-white hover:text-gray-300 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
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
          <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[450px] bg-neutral-900 border border-neutral-800 shadow-2xl rounded-xl overflow-hidden z-50">
          {/* Header Area */}
          <div className="px-5 py-4 border-b border-neutral-800 flex items-center bg-neutral-900/50">
            {view === "requests" && (
              <button
                onClick={() => setView("menu")}
                className="mr-3 text-neutral-400 hover:text-white transition-colors"
              >
                ←
              </button>
            )}
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              {view === "menu" ? "Notifications" : "Sync Requests"}
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {/* VIEW A: THE MAIN MENU */}
            {view === "menu" && (
              <div className="p-3">
                <button
                  onClick={() => setView("requests")}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800 transition-colors text-left group"
                >
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-white">
                      Follow Requests
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Approve or ignore incoming syncs
                    </p>
                  </div>
                  {requests.length > 0 && (
                    <span className="bg-white text-black text-xs font-bold px-2.5 py-1 rounded-full">
                      {requests.length}
                    </span>
                  )}
                </button>

                <div className="p-5 text-center mt-2 border-t border-neutral-800/50">
                  <p className="text-xs text-neutral-500">No new activity.</p>
                </div>
              </div>
            )}

            {/* VIEW B: THE ACTUAL REQUESTS */}
            {view === "requests" && (
              <div className="p-2">
                {requests.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-neutral-500">
                      No pending requests.
                    </p>
                  </div>
                ) : (
                  requests.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
                          {user.avatar_url && (
                            <img
                              src={user.avatar_url}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <Link
                          href={`/profile/${user.username}`}
                          className="text-sm font-semibold text-neutral-200 hover:text-white transition-colors"
                        >
                          {user.username}
                        </Link>
                      </div>

                      <div className="flex gap-2">
                        {/* Sync Back Button - High Contrast */}
                        <button
                          onClick={() => handleSyncBack(user.id)}
                          className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-md hover:bg-neutral-200 transition-colors"
                        >
                          Sync
                        </button>
                        {/* Decline Button - Subtle until hover */}
                        <button
                          onClick={() => handleDecline(user.id)}
                          className="px-3 py-1.5 border border-neutral-700 text-neutral-400 text-xs font-bold rounded-md hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all"
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
