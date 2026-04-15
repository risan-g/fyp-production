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
 * Interactive stats row for Syncs and Rotation.
 * Clicking either stat opens the StatsModal.
 */
export default function ProfileStats({
  userId,
  syncCount,
  rotationCount,
}: ProfileStatsProps) {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"syncs" | "rotation">("syncs");

  /**
   * Helper to open the modal.
   */
  const openModal = (tab: "syncs" | "rotation") => {
    setActiveTab(tab);
    setShowModal(true);
  };

  return (
    <>
      {/* Social Stats Row */}
      <div className="flex w-full">
        {/* Syncs — Clickable */}
        <button
          onClick={() => openModal("syncs")}
          className="flex-1 text-center group py-4 border-r-[2px] border-black transition-all hover:bg-black focus:outline-none cursor-pointer"
        >
          <p className="text-xl font-black font-sans text-black group-hover:text-white transition-colors">
            {syncCount}
          </p>
          <p className="text-[9px] text-black/40 font-mono font-bold uppercase tracking-[0.15em] group-hover:text-white/50 transition-colors">
            SYNCS
          </p>
        </button>

        {/* Rotation — Clickable */}
        <button
          onClick={() => openModal("rotation")}
          className="flex-1 text-center group py-4 transition-all hover:bg-black focus:outline-none cursor-pointer"
        >
          <p className="text-xl font-black font-sans text-black group-hover:text-white transition-colors">
            {rotationCount}
          </p>
          <p className="text-[9px] text-black/40 font-mono font-bold uppercase tracking-[0.15em] group-hover:text-white/50 transition-colors">
            ROTATION
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
