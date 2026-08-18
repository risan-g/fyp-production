"use client";

import { useState } from "react";

/**
 * ShareButton (Client Component)
 *
 * Provides a "Copy Link" feature with instant visual feedback.
 * Uses the navigator.clipboard API to copy the current profile URL.
 */
export default function ShareButton({}: { username?: string } = {}) {
  const [copied, setCopied] = useState(false);

  /**
   * Copy logic
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
        copied
          ? "text-accent-red"
          : "text-black/30 hover:text-black hover:underline underline-offset-2"
      }`}
    >
      {copied ? "[ COPIED! ]" : "[ SHARE ]"}
    </button>
  );
}
