"use client";

import { useState } from "react";
import { toggleFollow } from "@/app/actions/follow";

interface SyncButtonProps {
  /** The unique ID of the user we are looking at. */
  targetUserId: string;
  /** Server-side state: Am I currently following them? */
  initialIsFollowing: boolean;
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
  initialIsFollowing,
  isTargetFollowingMe,
}: SyncButtonProps) {
  // Local state initialised with server data for immediate rendering.
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  // Track hover state to switch from "Status" to "Action" text.
  const [isHovered, setIsHovered] = useState(false);

  /**
   * State Logic: The 4-State Relationship Engine
   * Determines the text label based on the bi-directional relationship.
   */
  const getButtonState = () => {
    if (isLoading) return "...";

    // Not Following (Action State)
    if (!isFollowing) {
      if (isTargetFollowingMe) return "SYNC BACK";
      return "SYNC";
    }

    // Following (Destructive/Status State)
    if (isHovered) return "UNSYNC";

    // Status State
    if (isTargetFollowingMe) return "SYNCED"; // Mutual
    return "PENDING"; // One-Way
  };

  const buttonState = getButtonState();

  /**
   * Interaction Handler
   */
  const handleSync = async () => {
    setIsLoading(true);
    const previousState = isFollowing;

    // Flips the UI state immediately before the server responds.
    setIsFollowing(!isFollowing);

    try {
      // Perform the actual database mutation
      await toggleFollow(targetUserId);
    } catch (error) {
      setIsFollowing(previousState);
      console.error("Sync failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Visual System
   * Maps the current relationship state to the Brutalist design language.
   */
  const getButtonStyles = () => {
    // Not Following
    if (!isFollowing) {
      if (isTargetFollowingMe) {
        return "bg-black text-white border-black animate-pulse hover:bg-accent-red hover:border-accent-red shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]";
      }
      return "bg-transparent text-black border-black hover:bg-black hover:text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]";
    }

    // Following (Hover = Red)
    if (isHovered) {
      return "bg-white text-accent-red border-accent-red shadow-none translate-x-[0px] translate-y-[0px]";
    }

    // Status Styles
    if (isTargetFollowingMe) {
      return "bg-black text-white border-black shadow-none translate-x-[0px] translate-y-[0px]"; // Solid for Mutual
    }

    return "bg-white text-black/40 border-black/40 shadow-none translate-x-[0px] translate-y-[0px]"; // Hollow for Pending
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
      {buttonState}
    </button>
  );
}
