"use client";

import { useState } from "react";
import { toggleRotation } from "@/app/actions/rotation";

interface RotationButtonProps {
  /** The unique Spotify ID used for the database composite key. */
  spotifyArtistId: string;
  /** Cached Metadata: Passed to server to populate the cache if adding. */
  artistName: string;
  artistImageUrl: string | null;
  /** Server-side state: Is this artist currently in the user's rotation? */
  initialIsInRotation: boolean;
}

/**
 * RotationButton (Client Component)
 *
 * The primary interaction mechanism.
 * Allows users to add specific artists to their tracked rotation.
 *
 * Distinct from 'SyncButton', this component handles
 * data caching alongside the relationship toggle.
 */
export default function RotationButton({
  spotifyArtistId,
  artistName,
  artistImageUrl,
  initialIsInRotation,
}: RotationButtonProps) {
  // Local state initialized with server data for immediate rendering.
  const [isInRotation, setIsInRotation] = useState(initialIsInRotation);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Interaction Handler
   * Implements the UI pattern.
   */
  const handleToggle = async () => {
    setIsLoading(true);
    const previousState = isInRotation;

    // Flip the visual state immediately before the network request starts,
    // making the app feel snappy.
    setIsInRotation(!isInRotation);

    try {
      // Trigger Server Action
      // We pass the metadata (name/image) here so the server can cache it
      // if this is a new "Add" action.
      await toggleRotation(spotifyArtistId, artistName, artistImageUrl);
    } catch (error) {
      // ROLLBACK:
      // If the database operation fails, revert the UI to the previous state
      // so the user knows the action didn't persist.
      setIsInRotation(previousState);
      console.error("Rotation toggle failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        px-8 py-3 font-bold uppercase tracking-widest text-xs transition-all duration-300
        flex items-center gap-2
        ${
          isInRotation
            ? "bg-transparent text-white border border-neutral-700 hover:border-red-500 hover:text-red-500" // State: In Rotation (Passive -> Destructive on Hover)
            : "bg-white text-black border border-white hover:bg-neutral-200" // State: Add (Active Call To Action)
        }
      `}
    >
      {isLoading ? (
        "..."
      ) : isInRotation ? (
        <>
          <span>In Rotation</span>
          <span className="text-lg leading-none mb-0.5">−</span>
        </>
      ) : (
        <>
          <span>Add to Rotation</span>
          <span className="text-lg leading-none mb-0.5">+</span>
        </>
      )}
    </button>
  );
}
