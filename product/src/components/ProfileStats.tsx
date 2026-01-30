"use client";

import { useState } from "react";
import StatsModal from "./StatsModal";

interface ProfileStatsProps {
  userId: string;
  syncCount: number;
  rotationCount: number;
}

/**
 * ProfileStats (Client Component)
 *
 * This acts as the "Trigger" for the interactive stats system.
 * It replaces the static numbers on the Profile Page.
 *
 * Responsibility:
 * 1. Displays the high-level metrics (Syncs/Rotation).
 * 2. Manages the open/closed state of the Modal.
 * 3. Sets the initial context (e.g.clicking "Syncs" opens the Syncs tab).
 */
export default function ProfileStats({
  userId,
  syncCount,
  rotationCount,
}: ProfileStatsProps) {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"syncs" | "rotation">("syncs");

  /**
   * Helper to open the modal with the correct tab pre-selected.
   */
  const openModal = (tab: "syncs" | "rotation") => {
    setActiveTab(tab);
    setShowModal(true);
  };

  return (
    <>
      {/* THE TRIGGER AREA */}
      <div className="grid grid-cols-2 gap-16 border-y border-neutral-800 py-6 mb-8 w-full max-w-md mx-auto">
        {/* Syncs Trigger */}
        <button
          onClick={() => openModal("syncs")}
          className="text-center group transition-opacity hover:opacity-70 focus:outline-none"
        >
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-2 group-hover:text-white transition-colors">
            Syncs
          </p>
          {/* Underline Effect: Mimics a link but stays purely CSS */}
          <p className="text-4xl font-mono text-white underline decoration-transparent group-hover:decoration-white/30 underline-offset-8 transition-all">
            {syncCount}
          </p>
        </button>

        {/* Rotation Trigger */}
        <button
          onClick={() => openModal("rotation")}
          className="text-center group transition-opacity hover:opacity-70 focus:outline-none"
        >
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-2 group-hover:text-white transition-colors">
            Rotation
          </p>
          <p className="text-4xl font-mono text-white underline decoration-transparent group-hover:decoration-white/30 underline-offset-8 transition-all">
            {rotationCount}
          </p>
        </button>
      </div>

      {showModal && (
        <StatsModal
          userId={userId}
          initialTab={activeTab}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
