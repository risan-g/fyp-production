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
 * [ + ] and [ - ]
 */
export default function DBControl({
  entityId,
  entityType,
  initialScore,
  initialUserVote,
  spotifyArtistId,
}: DBControlProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVote = async (value: 1 | -1) => {
    if (loading) return;
    setLoading(true);
    try {
      await toggleVote(entityId, entityType, value, spotifyArtistId);
    } catch (e: any) {
      if (e.message.includes("logged in")) {
        router.push("/sign-in");
      }
    } finally {
      setLoading(false);
    }
  };

  const isLoud = initialUserVote === 1;
  const isQuiet = initialUserVote === -1;

  // Colour logic
  let scoreColor = "text-black";
  if (initialScore >= 10) scoreColor = "text-accent-red";
  if (initialScore < 0) scoreColor = "text-black/40";

  return (
    <div className="flex flex-col items-center justify-center font-mono font-bold select-none border-[3px] border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] w-12 pt-1 pb-1">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`w-full py-1 transition-all ${isLoud ? "bg-black text-white" : "hover:bg-neutral-200 text-black"}`}
      >
        [+]
      </button>

      <span className={`py-2 text-[10px] tracking-widest text-center w-full border-y-[2px] border-black/10 ${scoreColor}`}>
        {initialScore}dB
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`w-full py-1 transition-all ${isQuiet ? "bg-black text-white" : "hover:bg-neutral-200 text-black"}`}
      >
        [-]
      </button>
    </div>
  );
}
