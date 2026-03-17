"use client";

import { useState } from "react";
import { toggleRotation } from "@/app/actions/rotation";

type EasterEgg = "q" | "doom" | undefined;

function scHoolboyTransform(text: string): string {
  return text
    .split("")
    .map((char, i) => {
      if (i === 0) return char.toUpperCase();
      if (char.toLowerCase() === "h") return "H";
      return char.toLowerCase();
    })
    .join("");
}

function formatLabel(text: string, easterEgg: EasterEgg): string {
  if (easterEgg === "q") return scHoolboyTransform(text);
  if (easterEgg === "doom") return text.toLowerCase();
  return text;
}

interface RotationButtonProps {
  spotifyArtistId: string;
  artistName: string;
  artistImageUrl: string | null;
  initialIsInRotation: boolean;
  easterEgg?: EasterEgg;
}

/**
 * RotationButton (Client Component)
 * Allows users to add specific artists to their tracked rotation.
 */
export default function RotationButton({
  spotifyArtistId,
  artistName,
  artistImageUrl,
  initialIsInRotation,
  easterEgg,
}: RotationButtonProps) {
  const [isInRotation, setIsInRotation] = useState(initialIsInRotation);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const previousState = isInRotation;
    setIsInRotation(!isInRotation);

    try {
      await toggleRotation(spotifyArtistId, artistName, artistImageUrl);
    } catch (error) {
      setIsInRotation(previousState);
      console.error("Rotation toggle failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const noUppercase = !!easterEgg;

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        px-6 py-3 font-mono font-bold tracking-[0.2em] text-[10px] sm:text-xs transition-all duration-200
        flex items-center justify-center gap-2 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]
        hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none
        ${noUppercase ? "" : "uppercase"}
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
          <span>{formatLabel("In Rotation", easterEgg)}</span>
          <span className="text-lg leading-none mb-0.5 font-sans font-black">−</span>
        </>
      ) : (
        <>
          <span>{formatLabel("Add to Rotation", easterEgg)}</span>
          <span className="text-lg leading-none mb-0.5 font-sans font-black">+</span>
        </>
      )}
    </button>
  );
}
