"use client";

import { useState } from "react";
import { toggleRotation } from "@/app/actions/rotation";

interface RotationButtonProps {
  /** The unique Spotify ID used for the database composite key. */
  spotifyArtistId: string;
  artistName: string;
  artistImageUrl: string | null;
  initialIsInRotation: boolean;
}

/**
 * RotationButton (Client Component)
 *
 * Allows users to add specific artists to their tracked rotation.
 */
export default function RotationButton({
  spotifyArtistId,
  artistName,
  artistImageUrl,
  initialIsInRotation,
}: RotationButtonProps) {
  const [isInRotation, setIsInRotation] = useState(initialIsInRotation);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Implements the UI pattern.
   */
  const handleToggle = async () => {
    setIsLoading(true);
    const previousState = isInRotation;

    setIsInRotation(!isInRotation);

    try {
      // Trigger Server Action
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
        px-6 py-3 font-mono font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs transition-all duration-200
        flex items-center justify-center gap-2 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]
        hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none
        ${isInRotation
          ? "bg-white text-accent-red hover:bg-black hover:text-white hover:border-black"
          : "bg-black text-white hover:bg-accent-red"
        }
      `}
    >
      {isLoading ? (
        "..."
      ) : isInRotation ? (
        <>
          <span>IN ROTATION</span>
          <span className="text-lg leading-none mb-0.5 font-sans font-black">−</span>
        </>
      ) : (
        <>
          <span>ADD TO ROTATION</span>
          <span className="text-lg leading-none mb-0.5 font-sans font-black">+</span>
        </>
      )}
    </button>
  );
}
