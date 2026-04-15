"use client";

import { useState } from "react";
import { toggleFollow } from "@/app/actions/follow";

interface SyncButtonProps {
  /** The unique ID of the user we are looking at. */
  targetUserId: string;
  isPrivate: boolean;
  /** Server-side state: Am I currently following them? */
  initialIsFollowing: boolean;
  initialIsPending: boolean;
  /** Server-side state: Are they following me? (Used to trigger "Sync Back") */
  isTargetFollowingMe: boolean;
}

/**
 * SyncButton (Client Component)
 *
 * The core interaction point for the social graph.
 */
export default function SyncButton({
  targetUserId,
  isPrivate,
  initialIsFollowing,
  initialIsPending,
  isTargetFollowingMe,
}: SyncButtonProps) {
  // Local state initialised with server data for immediate rendering.
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, setIsPending] = useState(initialIsPending);
  const [isLoading, setIsLoading] = useState(false);

  // Track hover state to switch from "Status" to "Action" text.
  const [isHovered, setIsHovered] = useState(false);

  /**
   * State Logic: The Hybrid Relationship Engine
   */
  const getButtonState = () => {
    if (isLoading) return "...";

    if (isPending) {
      if (isHovered) return "CANCEL REQUEST";
      return "REQUESTED";
    }

    if (isFollowing) {
      if (isHovered) return "UNSYNC";
      if (isTargetFollowingMe) return "SYNCED <->";
      return "SYNCING";
    }

    if (isTargetFollowingMe) return "SYNC BACK";
    return "SYNC";
  };

  const getButtonStyles = () => {
    if (isPending) {
      if (isHovered) return "bg-white text-accent-red border-accent-red shadow-none translate-x-[0px] translate-y-[0px]";
      return "bg-neutral-200 text-black/60 border-black/40 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]";
    }

    if (isFollowing) {
      if (isHovered) return "bg-white text-accent-red border-accent-red shadow-none translate-x-[0px] translate-y-[0px]";
      return "bg-black text-white border-black shadow-none translate-x-[0px] translate-y-[0px]";
    }

    if (isTargetFollowingMe) {
      return "bg-black text-white border-black animate-pulse hover:bg-accent-red hover:border-accent-red shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]";
    }

    return "bg-white text-black border-black hover:bg-black hover:text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]";
  };

  /**
   * Interaction Handler
   */
  const handleSync = async () => {
    setIsLoading(true);

    const prevFollowing = isFollowing;
    const prevPending = isPending;

    if (isFollowing || isPending) {
      setIsFollowing(false);
      setIsPending(false);
    } else {
      if (isPrivate) setIsPending(true);
      else setIsFollowing(true);
    }

    try {
      await toggleFollow(targetUserId);
    } catch (error) {
      setIsFollowing(prevFollowing);
      setIsPending(prevPending);
      console.error("Sync failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        px-4 py-1.5 font-bold uppercase tracking-[0.2em] text-[10px] font-mono border-2 transition-all duration-300
        ${getButtonStyles()}
      `}
    >
      {getButtonState()}
    </button>
  );
}
