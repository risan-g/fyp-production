"use client";

import { useState } from "react";
import { updatePrivacy } from "@/app/actions/settings";
import { Lock, Unlock, Loader2 } from "lucide-react";

interface SettingsClientProps {
  initialPrivacy: boolean;
}

export default function SettingsClient({ initialPrivacy }: SettingsClientProps) {
  const [isPrivate, setIsPrivate] = useState(initialPrivacy);
  const [isLoading, setIsLoading] = useState(false);

  const handlePrivacyToggle = async () => {
    setIsLoading(true);
    const newValue = !isPrivate;
    setIsPrivate(newValue);

    try {
      await updatePrivacy(newValue);
    } catch (error) {
      console.error("Failed to update privacy:", error);
      setIsPrivate(!newValue); // Revert on failure
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-10 gap-12">
      {/* 3:7 Split - Left Side (Tabs) */}
      <div className="md:col-span-3 flex flex-col gap-2">
        <button
          className="w-full text-left px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] font-bold border-[3px] transition-all bg-black text-white border-black"
        >
          ACCOUNT
        </button>
      </div>

      <div className="md:col-span-7 bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-8 md:p-12 min-h-[500px]">
        <div className="flex flex-col max-w-2xl">

          <h2 className="text-3xl font-black uppercase mb-6 border-b-[2px] border-black/10 pb-4">
            Account Privacy
          </h2>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start gap-8">
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-lg">Private Account</h3>
                <p className="text-sm text-black/70 font-sans">
                  When your account is private, only your approved Syncs can see your reviews, ratings, and rotations. Your reviews will also be hidden from the Global Live Feed.
                </p>
              </div>

              <button
                onClick={handlePrivacyToggle}
                disabled={isLoading}
                className={`relative shrink-0 flex items-center justify-center p-4 border-[3px] border-black transition-all ${isPrivate ? "bg-black text-white shadow-none translate-y-1" : "bg-white text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-neutral-100"
                  }`}
                style={{ width: "64px", height: "64px" }}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isPrivate ? (
                  <Lock className="w-8 h-8" />
                ) : (
                  <Unlock className="w-8 h-8" />
                )}
              </button>
            </div>

            <div className="bg-neutral-100 border-[2px] border-black/10 p-4 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
              <span>STATUS:</span>
              {isPrivate ? <span className="text-accent-red font-bold">PRIVATE</span> : <span className="text-black font-bold">PUBLIC</span>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
