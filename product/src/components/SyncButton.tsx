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
 *
 * It uses Optimistic UI updates to provide instant feedback,
 * while handling the server request in the background.
 */
export default function SyncButton({
  targetUserId,
  initialIsFollowing,
  isTargetFollowingMe,
}: SyncButtonProps) {
  // Local state initialised with server data for immediate rendering.
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * State Logic: The 4-State Relationship Engine
   * Determines the text label based on the bi-directional relationship.
   */
  const getButtonState = () => {
    // 1. Mutual Connection (Both sides follow)
    if (isFollowing && isTargetFollowingMe) return "SYNCED";

    // 2. One-way (I follow them, they don't follow back)
    if (isFollowing && !isTargetFollowingMe) return "PENDING";

    // 3. Incoming Request (They follow me, I don't follow them)
    // This prompts the user to "close the loop".
    if (!isFollowing && isTargetFollowingMe) return "SYNC BACK";

    // 4. Stranger (No connection)
    return "SYNC";
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
    switch (buttonState) {
      case "SYNCED":
        // White block: Represents a solid, established connection.
        return "bg-white text-black border-white hover:bg-gray-200";

      case "PENDING":
        // Dimmed/Hollow: Represents a waiting state or "Orbit".
        return "bg-transparent text-gray-400 border-gray-600 hover:border-white hover:text-white";

      case "SYNC BACK":
        // Pulsing White: Urgency. Draws attention to the incoming follow.
        return "bg-white text-black border-white animate-pulse hover:scale-105";

      default: // "SYNC"
        // White Outline: Standard action state.
        return "bg-transparent text-white border-white hover:bg-white hover:text-black";
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isLoading}
      className={`
        px-6 py-2 font-bold uppercase tracking-widest text-xs border transition-all duration-300
        ${getButtonStyles()}
      `}
    >
      {isLoading ? "..." : buttonState}
    </button>
  );
}
