"use client";

import Link from "next/link";
import React from "react";

/**
 * Automatically converts URLs and @mentions into clickable links.
 * Maintains the Brutalist aesthetic with bold, high-contrast styles.
 */
export default function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  const parts = text.split(/(https?:\/\/[^\s]+|www\.[^\s]+|@[a-zA-Z0-9._]+)/g);

  return (
    <>
      {parts.map((part, i) => {
        // Handle @mentions
        if (part.startsWith("@") && part.length > 1) {
          const username = part.substring(1);
          return (
            <Link
              key={i}
              href={`/profile/${username}`}
              className="font-bold text-black border-b-[2px] border-transparent hover:border-black hover:bg-yellow-400 transition-all px-0.5"
            >
              {part}
            </Link>
          );
        }

        // Handle URLs
        if (part.startsWith("http://") || part.startsWith("https://") || part.startsWith("www.")) {
          const url = part.startsWith("www.") ? `https://${part}` : part;
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-black underline decoration-[3px] decoration-black/10 hover:decoration-accent-blue hover:text-accent-blue transition-all break-all"
            >
              {part}
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
