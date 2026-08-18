/** 
 * Decibel (dB) engagement control.
 * Implements Optimistic UI to provide zero-latency feedback for community voting.
 */
"use client";

import { useState } from "react";
import { toggleVote } from "@/app/actions/wall";
import { useRouter } from "next/navigation";

interface DBControlProps {
  entityId: string;
  entityType: "post" | "comment";
  initialScore: number;
  initialUserVote: 1 | -1 | 0;
  spotifyArtistId: string;
}

/**
 * DBControl
 * Renders the voting interface and synchronises local state with the database.
 * We resolve state mathematically before the network request completes.
 */
export default function DBControl({
  entityId,
  entityType,
  initialScore,
  initialUserVote,
  spotifyArtistId,
}: DBControlProps) {
  const router = useRouter();

  const [currentScore, setCurrentScore] = useState(initialScore);
  const [currentVote, setCurrentVote] = useState(initialUserVote);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleVote = async (value: 1 | -1) => {
    if (isUpdating) return;

    setIsUpdating(true);

    // If the user clicks the same vote again, it's a toggle off (0)
    // If they click a different vote, it swaps.
    const newVote = currentVote === value ? 0 : value;

    // Calculate explicit difference.
    // E.g. Swapping from an Upvote (1) to a Downvote (-1) requires a delta of -2 to display correctly.
    const scoreDiff = newVote - currentVote;

    // Optimistic Update
    setCurrentVote(newVote as 1 | -1 | 0);
    setCurrentScore(prev => prev + scoreDiff);

    // Background Database Update
    try {
      await toggleVote(entityId, entityType, value, spotifyArtistId);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("logged in")) {
        router.push("/sign-in");
      } else {
        // Revert on error
        setCurrentVote(currentVote);
        setCurrentScore(initialScore);
      }
    } finally {
      setIsUpdating(false);
    }
  };


  const isLoud = currentVote === 1;
  const isQuiet = currentVote === -1;

  // Colour logic
  let scoreColor = "text-black";
  if (currentScore >= 10) scoreColor = "text-accent-red";
  if (currentScore < 0) scoreColor = "text-black/40";

  return (
    <div className="flex flex-col items-center justify-center font-mono font-bold select-none border-[3px] border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] w-12 pt-1 pb-1">
      <button
        onClick={() => handleVote(1)}
        disabled={isUpdating}
        className={`w-full py-1 transition-all ${isLoud ? "bg-black text-white" : "hover:bg-neutral-200 text-black"}`}
      >
        [+]
      </button>

      <span className={`py-2 text-[10px] tracking-widest text-center w-full border-y-[2px] border-black/10 ${scoreColor}`}>
        {currentScore}dB
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={isUpdating}
        className={`w-full py-1 transition-all ${isQuiet ? "bg-black text-white" : "hover:bg-neutral-200 text-black"}`}
      >
        [-]
      </button>
    </div>
  );
}
