"use client";

import { useState } from "react";
import { updatePrivacy } from "@/app/actions/settings";
import { Lock, Unlock, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface SettingsClientProps {
  initialPrivacy: boolean;
}

export default function SettingsClient({ initialPrivacy }: SettingsClientProps) {
  const [isPrivate, setIsPrivate] = useState(initialPrivacy);
  const [isLoading, setIsLoading] = useState(false);

  // Spam Prevention
  const [cooldown, setCooldown] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePrivacyToggle = async () => {
    // Spam Prevention Filter
    if (cooldown) {
      showToast("PLEASE WAIT BEFORE CHANGING STATUS AGAIN.", "error");
      return;
    }

    setIsLoading(true);
    setCooldown(true);

    const newValue = !isPrivate;
    setIsPrivate(newValue); // Optimistic UI update

    try {
      await updatePrivacy(newValue);
      showToast(`ACCOUNT IS NOW ${newValue ? "PRIVATE" : "PUBLIC"}`, "success");
    } catch (error) {
      console.error("Failed to update privacy:", error);
      setIsPrivate(!newValue); // Revert on failure (Fault Tolerance)
      showToast("DATABASE ERROR: FAILED TO UPDATE PRIVACY.", "error");
    } finally {
      setIsLoading(false);
      // 2.5 second spam prevention timeout unlock
      setTimeout(() => setCooldown(false), 2500);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-10 gap-12 relative">

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-4 py-3 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] font-mono text-[10px] uppercase font-bold tracking-widest ${toast.type === "error" ? "bg-accent-red text-white" : "bg-white text-black"
              }`}
          >
            {toast.type === "error" ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Side (Tabs) */}
      <div className="md:col-span-3 flex flex-col gap-2">
        <button
          className="w-full text-left px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] font-bold border-[3px] transition-all bg-black text-white border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
        >
          ACCOUNT
        </button>
      </div>

      {/* Right Side (Content) */}
      <div className="md:col-span-7 h-fit bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 md:p-8">
        <div className="flex flex-col w-full max-w-2xl">

          <h2 className="text-2xl md:text-3xl font-black uppercase mb-6 border-b-[2px] border-black/10 pb-4">
            Account Privacy
          </h2>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center gap-8">

              <div className="flex flex-col gap-2 flex-grow">
              </div>

              <button
                onClick={handlePrivacyToggle}
                className={`relative shrink-0 flex items-center justify-center p-4 border-[3px] transition-all ${isPrivate
                  ? "bg-black text-white border-black shadow-none translate-y-1"
                  : "bg-white text-black border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-neutral-100"
                  } ${cooldown ? "opacity-50 cursor-not-allowed" : ""}`}
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

            <div className="w-full bg-neutral-100 border-[2px] border-black/10 p-4 font-mono text-xs tracking-widest uppercase flex items-center gap-3">
              <span className="text-neutral-500">STATUS:</span>
              {isPrivate ? (
                <span className="text-accent-red font-bold">PRIVATE</span>
              ) : (
                <span className="text-black font-bold">PUBLIC</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
