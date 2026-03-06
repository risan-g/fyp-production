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
      {/* TRIGGER AREA */}
      <div className="grid grid-cols-2 gap-4 border-y-[3px] border-black py-4 mb-12 w-full max-w-md mx-auto">
        {/* Syncs Trigger */}
        <button
          onClick={() => openModal("syncs")}
          className="text-center group border-[3px] border-transparent hover:border-black p-4 transition-all hover:bg-black hover:shadow-[4px_4px_0px_rgba(255,0,0,1)] focus:outline-none flex flex-col items-center justify-center cursor-pointer"
        >
          <p className="text-[10px] text-black/60 font-mono font-bold uppercase tracking-[0.2em] mb-2 group-hover:text-white/60 transition-colors">
            "SYNCS"
          </p>
          <p className="text-4xl font-black font-sans text-black group-hover:text-white transition-colors">
            {syncCount}
          </p>
        </button>

        {/* Rotation Trigger */}
        <button
          onClick={() => openModal("rotation")}
          className="text-center group border-[3px] border-transparent hover:border-black p-4 transition-all hover:bg-black hover:shadow-[4px_4px_0px_rgba(255,0,0,1)] focus:outline-none flex flex-col items-center justify-center cursor-pointer"
        >
          <p className="text-[10px] text-black/60 font-mono font-bold uppercase tracking-[0.2em] mb-2 group-hover:text-white/60 transition-colors">
            "ROTATION"
          </p>
          <p className="text-4xl font-black font-sans text-black group-hover:text-white transition-colors">
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
