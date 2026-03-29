"use client";

import { useState } from "react";
import { updatePrivacy, updateUsername } from "@/app/actions/settings";
import { Lock, Unlock, Loader2, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AvatarUpload from "@/components/Avatar-Upload";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  userId: string;
  initialUsername: string;
  initialAvatarUrl: string | null;
  initialPrivacy: boolean;
}

type TabState = "ACCOUNT" | "PRIVACY";

export default function SettingsClient({
  userId,
  initialUsername,
  initialAvatarUrl,
  initialPrivacy,
}: SettingsClientProps) {
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabState>("ACCOUNT");

  // Privacy State
  const [isPrivate, setIsPrivate] = useState(initialPrivacy);
  const [isPrivacyLoading, setIsPrivacyLoading] = useState(false);

  // Username State
  const [usernameInput, setUsernameInput] = useState(initialUsername);
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);

  // Spam Prevention
  const [cooldown, setCooldown] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  /**
   * Toggle Account Privacy
   */
  const handlePrivacyToggle = async () => {
    if (cooldown) {
      showToast("PLEASE WAIT BEFORE CHANGING STATUS AGAIN.", "error");
      return;
    }

    setIsPrivacyLoading(true);
    setCooldown(true);

    const newValue = !isPrivate;
    setIsPrivate(newValue);

    try {
      await updatePrivacy(newValue);
      showToast(`ACCOUNT IS NOW ${newValue ? "PRIVATE" : "PUBLIC"}`, "success");
    } catch (error) {
      console.error("Failed to update privacy:", error);
      setIsPrivate(!newValue);
      showToast("DATABASE ERROR: FAILED TO UPDATE PRIVACY.", "error");
    } finally {
      setIsPrivacyLoading(false);
      setTimeout(() => setCooldown(false), 2500);
    }
  };

  /**
   * Update Username Handle
   */
  const handleUsernameSave = async () => {
    if (usernameInput === initialUsername) {
      showToast("NO CHANGES DETECTED.", "error");
      return;
    }

    setIsUsernameLoading(true);

    try {
      const result = await updateUsername(usernameInput);

      if (result.error) {
        showToast(result.error, "error");
        return;
      }

      if (result.success && result.newHandle) {
        showToast("USERNAME UPDATED SUCCESSFULLY.", "success");
        // Instantly route them to their new shiny URL!
        router.push(`/profile/${result.newHandle}`);
      }
    } catch (error) {
      console.error("Save failed:", error);
      showToast("AN UNEXPECTED ERROR OCCURRED.", "error");
    } finally {
      setIsUsernameLoading(false);
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

      {/* Tabs Navigation */}
      <div className="md:col-span-3 flex flex-col gap-4">
        <button
          onClick={() => setActiveTab("ACCOUNT")}
          className={`w-full text-left px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] font-bold border-[3px] transition-all ${activeTab === "ACCOUNT"
            ? "bg-black text-white border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
            : "bg-white text-black border-black/20 hover:border-black/50 shadow-none hover:shadow-[2px_2px_0px_rgba(0,0,0,0.5)]"
            }`}
        >
          ACCOUNT
        </button>

        <button
          onClick={() => setActiveTab("PRIVACY")}
          className={`w-full text-left px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] font-bold border-[3px] transition-all ${activeTab === "PRIVACY"
            ? "bg-black text-white border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
            : "bg-white text-black border-black/20 hover:border-black/50 shadow-none hover:shadow-[2px_2px_0px_rgba(0,0,0,0.5)]"
            }`}
        >
          PRIVACY
        </button>
      </div>

      {/* Content*/}
      <div className="md:col-span-7 h-fit bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 md:p-12 relative overflow-hidden">

        {activeTab === "ACCOUNT" && (
          <div className="flex flex-col w-full max-w-2xl animate-in fade-in duration-300">

            {/* Avatar Row */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
              <div className="shrink-0 relative group">
                {/* same component used on the Profile Page! */}
                <AvatarUpload
                  uid={userId}
                  url={initialAvatarUrl}
                  username={initialUsername}
                  editable={true}
                  size={120}
                />
              </div>
              <div className="flex flex-col justify-center h-[120px]">
              </div>
            </div>

            {/* Username Row */}
            <div className="flex flex-col gap-4">
              <div className="flex relative items-stretch">
                <div className="bg-neutral-100 border-[3px] border-black border-r-0 flex items-center justify-center px-4 font-mono font-bold text-black/40">
                  @
                </div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="flex-grow bg-white border-[3px] border-black p-4 font-mono text-lg font-bold uppercase focus:outline-none focus:bg-yellow-50 transition-colors"
                />
              </div>

              {/* Save Button - only appears when changes exist */}
              <AnimatePresence>
                {usernameInput !== initialUsername && (
                  <motion.button
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    onClick={handleUsernameSave}
                    disabled={isUsernameLoading}
                    className="bg-accent-red text-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] font-mono font-bold uppercase tracking-[0.2em] text-xs p-4 flex items-center justify-center gap-2 transition-all w-fit"
                  >
                    {isUsernameLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    SAVE HANDLE
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* PRIVACY SETTINGS */}
        {activeTab === "PRIVACY" && (
          <div className="flex flex-col w-full max-w-2xl animate-in fade-in duration-300">
            <h2 className="text-2xl md:text-3xl font-black uppercase mb-8 border-b-[2px] border-black/10 pb-4">
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
                  {isPrivacyLoading ? (
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
        )}

      </div>
    </div>
  );
}
