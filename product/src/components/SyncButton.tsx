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
 * This component manages the "4-State Relationship" logic visually.
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
    // This makes the app feel "Native" and zero-latency.
    setIsFollowing(!isFollowing);

    try {
      // Perform the actual database mutation
      await toggleFollow(targetUserId);
    } catch (error) {
      // ROLLBACK:
      // If the server fails, revert the UI
      // so the user knows the action didn't stick.
      setIsFollowing(previousState);
      console.error("Sync failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Visual System
   * Maps the current relationship state to the Industrial design language.
   */
  const getButtonStyles = () => {
    // Not Following
    if (!isFollowing) {
      if (isTargetFollowingMe) {
        return "bg-white text-black border-white animate-pulse hover:scale-105";
      }
      return "bg-transparent text-white border-white hover:bg-white hover:text-black";
    }

    // Following (Hover = Red)
    if (isHovered) {
      return "bg-transparent text-red-500 border-red-500";
    }

    // Status Styles
    if (isTargetFollowingMe) {
      return "bg-white text-black border-white"; // Solid for Mutual
    }

    return "bg-transparent text-neutral-400 border-neutral-600"; // Hollow for Pending
  };

  return (
    <button
      onClick={handleSync}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        px-6 py-2 font-bold uppercase tracking-widest text-xs border transition-all duration-300
        ${getButtonStyles()}
      `}
    >
      {buttonState}
    </button>
  );
}
