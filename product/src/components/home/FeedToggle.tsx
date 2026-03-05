"use client";

interface FeedToggleProps {
    activeFeed: "global" | "synced";
    onChange: (feed: "global" | "synced") => void;
}

export default function FeedToggle({ activeFeed, onChange }: FeedToggleProps) {
    return (
        <div className="flex items-center gap-4 border-b-[3px] border-black pb-4">
            <button
                onClick={() => onChange("global")}
                className={`text-sm font-bold uppercase tracking-[0.2em] font-mono transition-all px-6 py-2 border-[3px] border-black ${activeFeed === "global"
                    ? "bg-black text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                    : "bg-transparent text-black hover:bg-black/5"
                    }`}
            >
                "GLOBAL"
            </button>

            <button
                onClick={() => onChange("synced")}
                className={`text-sm font-bold uppercase tracking-[0.2em] font-mono transition-all px-6 py-2 border-[3px] border-black ${activeFeed === "synced"
                    ? "bg-black text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                    : "bg-transparent text-black hover:bg-black/5"
                    }`}
            >
                "SYNCED"
            </button>
        </div>
    );
}
