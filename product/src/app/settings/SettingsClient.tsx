"use client";

import { useState } from "react";
import { updatePrivacy, updateUsername, deleteAccount, changePassword, updateBio } from "@/app/actions/settings";
import { AnimatePresence, motion } from "framer-motion";
import AvatarUpload from "@/components/Avatar-Upload";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SettingsClientProps {
  userId: string;
  initialUsername: string;
  initialEmail: string;
  initialAvatarUrl: string | null;
  initialPrivacy: boolean;
  initialBio: string;
}

type TabState = "ACCOUNT" | "SECURITY" | "PRIVACY";

export default function SettingsClient({
  userId,
  initialUsername,
  initialEmail,
  initialAvatarUrl,
  initialPrivacy,
  initialBio,
}: SettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation State
  const tabParam = searchParams.get("tab");
  const validTabs: TabState[] = ["ACCOUNT", "SECURITY", "PRIVACY"];
  const initialTab: TabState = validTabs.includes(tabParam as TabState) ? (tabParam as TabState) : "ACCOUNT";
  const [activeTab, setActiveTab] = useState<TabState>(initialTab);

  // Privacy State
  const [isPrivate, setIsPrivate] = useState(initialPrivacy);
  const [isPrivacyLoading, setIsPrivacyLoading] = useState(false);

  // Username State
  const [usernameInput, setUsernameInput] = useState(initialUsername);
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);
  
  // Bio State
  const [bioInput, setBioInput] = useState(initialBio);
  const [isBioLoading, setIsBioLoading] = useState(false);

  // Email State
  const [emailInput, setEmailInput] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Password Visibility Toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const supabase = createClient();

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

  /**
   * Update User Bio
   */
  const handleBioSave = async () => {
    if (bioInput === initialBio) {
      showToast("NO CHANGES DETECTED.", "error");
      return;
    }

    if (bioInput.length > 150) {
      showToast("BIO CANNOT EXCEED 150 CHARACTERS.", "error");
      return;
    }

    setIsBioLoading(true);

    try {
      await updateBio(bioInput);
      showToast("BIO UPDATED SUCCESSFULLY.", "success");
    } catch (error) {
      console.error("Save failed:", error);
      showToast("FAILED TO SAVE BIO.", "error");
    } finally {
      setIsBioLoading(false);
    }
  };

  /**
   * Update Email
   */
  const handleEmailUpdate = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      showToast("PLEASE ENTER A VALID EMAIL ADDRESS.", "error");
      return;
    }

    setIsEmailLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ email: emailInput });

      if (error) {
        showToast(error.message.toUpperCase(), "error");
      } else {
        showToast("CONFIRMATION EMAILS SENT TO BOTH ADDRESSES.", "success");
        setEmailInput("");
      }
    } catch (error) {
      console.error("Email update failed:", error);
      showToast("FAILED TO TRIGGER EMAIL UPDATE.", "error");
    } finally {
      setIsEmailLoading(false);
    }
  };

  /**
   * Update Password
   */
  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("PLEASE FILL IN ALL PASSWORD FIELDS.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("NEW PASSWORDS DO NOT MATCH.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("PASSWORD MUST BE AT LEAST 6 CHARACTERS.", "error");
      return;
    }

    setIsPasswordLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.error) {
        showToast(result.error, "error");
      } else if (result.success) {
        showToast("PASSWORD UPDATED SUCCESSFULLY.", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Password update failed:", error);
      showToast("AN UNEXPECTED ERROR OCCURRED.", "error");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      setDeleteError("PASSWORD IS REQUIRED.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteAccount(deleteConfirmPassword);

      if (result?.error) {
        setDeleteError(result.error);
        setIsDeleting(false);
      } else if (result?.success) {
        // Use a HARD refresh to the home page
        window.location.href = "/?deleted=true";
      }
    } catch (error) {
      console.error("Deletion failed:", error);
      showToast("AN UNEXPECTED ERROR OCCURRED.", "error");
      setIsDeleting(false);
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
          onClick={() => setActiveTab("SECURITY")}
          className={`w-full text-left px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] font-bold border-[3px] transition-all ${activeTab === "SECURITY"
            ? "bg-black text-white border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
            : "bg-white text-black border-black/20 hover:border-black/50 shadow-none hover:shadow-[2px_2px_0px_rgba(0,0,0,0.5)]"
            }`}
        >
          SECURITY
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
            <div className="flex flex-col gap-4 mb-12">
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
                    className="bg-accent-red text-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] font-mono font-bold uppercase tracking-[0.2em] text-xs p-4 flex items-center justify-center transition-all w-fit"
                  >
                    {isUsernameLoading ? "..." : "SAVE HANDLE"}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Bio Row */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono font-bold text-black/40 uppercase tracking-widest ml-2">BIO</span>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="ADD A BIO..."
                  maxLength={150}
                  className="w-full bg-white border-[3px] border-black p-4 font-mono text-sm font-bold uppercase focus:outline-none focus:bg-yellow-50 transition-colors h-32 resize-none"
                />
                <div className="flex justify-between items-center px-2 mt-1">
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${bioInput.length >= 140 ? "text-accent-red" : "text-black/30"}`}>
                    {bioInput.length} / 150
                  </span>
                  
                  {bioInput.length > 0 && (
                    <button
                      onClick={() => setBioInput("")}
                      className="text-[9px] font-mono font-black text-accent-red hover:text-red-700 uppercase tracking-widest transition-colors"
                    >
                      [ CLEAR ]
                    </button>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {bioInput !== initialBio && (
                  <motion.button
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    onClick={handleBioSave}
                    disabled={isBioLoading}
                    className="bg-black text-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] font-mono font-bold uppercase tracking-[0.2em] text-xs py-3 px-6 w-fit transition-all flex items-center"
                  >
                    {isBioLoading ? "..." : "SAVE BIO"}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* SECURITY*/}
        {activeTab === "SECURITY" && (
          <div className="flex flex-col w-full max-w-2xl animate-in fade-in duration-300 gap-12">

            {/* Email Change */}
            <section className="flex flex-col gap-6">
              <h3 className="text-xl font-black uppercase tracking-tight">Email Address</h3>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono font-bold text-black/40 uppercase tracking-widest ml-2">Current Email</span>
                  <input
                    type="email"
                    readOnly
                    value={initialEmail}
                    className="bg-neutral-50 border-[3px] border-black/10 p-4 font-mono text-sm font-bold text-black/40 cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono font-bold text-black/40 uppercase tracking-widest ml-2">New Email Address</span>
                  <input
                    type="email"
                    placeholder="NEW EMAIL ADDRESS"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="bg-white border-[3px] border-black p-4 font-mono text-sm font-bold uppercase focus:outline-none focus:bg-yellow-50 transition-colors"
                  />
                </div>

                <button
                  onClick={handleEmailUpdate}
                  disabled={isEmailLoading}
                  className="bg-black text-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] font-mono font-bold uppercase tracking-[0.2em] text-[10px] py-3 px-6 w-fit transition-all flex items-center"
                >
                  {isEmailLoading ? "..." : "UPDATE EMAIL"}
                </button>
              </div>
            </section>

            <div className="h-[2px] bg-black/10 w-full" />

            {/* Password Change */}
            <section className="flex flex-col gap-6">
              <h3 className="text-xl font-black uppercase tracking-tight">Security Credentials</h3>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono font-bold text-black/40 uppercase tracking-widest ml-2">Current Password</span>
                  <div className="relative w-full">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="CURRENT PASSWORD"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-white border-[3px] border-black p-4 pr-[70px] font-mono text-sm font-bold focus:outline-none focus:bg-yellow-50 transition-colors w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] font-black text-black/40 hover:text-black transition-colors"
                    >
                      {showCurrentPassword ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-bold text-black/40 uppercase tracking-widest ml-2">New Password</span>
                    <div className="relative w-full">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="NEW PASSWORD"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-white border-[3px] border-black p-4 pr-[70px] font-mono text-sm font-bold focus:outline-none focus:bg-yellow-50 transition-colors w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] font-black text-black/40 hover:text-black transition-colors"
                      >
                        {showNewPassword ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-bold text-black/40 uppercase tracking-widest ml-2">Confirm New</span>
                    <div className="relative w-full">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="CONFIRM PASSWORD"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-white border-[3px] border-black p-4 pr-[70px] font-mono text-sm font-bold focus:outline-none focus:bg-yellow-50 transition-colors w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] font-black text-black/40 hover:text-black transition-colors"
                      >
                        {showConfirmPassword ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePasswordUpdate}
                  disabled={isPasswordLoading}
                  className="bg-black text-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] font-mono font-bold uppercase tracking-[0.2em] text-[10px] py-3 px-6 w-fit transition-all flex items-center mt-4"
                >
                  {isPasswordLoading ? "..." : "CHANGE PASSWORD"}
                </button>
              </div>
            </section>

            <div className="h-[2px] bg-black/10 w-full" />

            {/* Delete Account*/}
            <section className="flex flex-col gap-6">
              <h3 className="text-xl font-black uppercase tracking-tight text-accent-red">Danger Zone</h3>

              <div className="bg-red-50 border-[3px] border-accent-red p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-[11px] font-bold text-accent-red uppercase tracking-wider">Permanent Account Removal</p>
                  <p className="text-xs font-mono text-accent-red/70 uppercase tracking-tight">This will permanently delete all your reviews, ratings, and social data.</p>
                </div>

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="bg-accent-red text-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] font-mono font-bold uppercase tracking-[0.2em] text-[10px] py-3 px-6 transition-all flex items-center shrink-0"
                >
                  DELETE ACCOUNT
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Deletion popup */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white border-[6px] border-accent-red w-full max-w-xl p-8 md:p-12 relative shadow-[20px_20px_0px_#C8102E]"
              >
                <div className="flex flex-col items-center text-center gap-8">
                  <div>
                    {/* Icon section removed for minimalist design */}
                  </div>

                  <div className="flex flex-col gap-4">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-black">
                      WAIT, DON'T<br />LEAVE US.
                    </h2>
                    <p className="font-mono text-xs font-bold text-black/40 uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                      DELETING YOUR ACCOUNT IS IRREVERSIBLE. ALL REVIEWS, RATINGS, AND SOCIAL DATA WILL BE PURGED FROM OUR SERVERS IN PERPETUITY.
                    </p>
                  </div>

                  <div className="w-full h-[3px] bg-black/10" />

                  <div className="flex flex-col gap-6 w-full">
                    <div className="flex flex-col gap-2">
                      <p className="font-mono text-[10px] font-extrabold text-accent-red uppercase tracking-widest">VERIFY PASSWORD TO PROCEED</p>
                      <div className="relative w-full">
                        <input
                          type={showDeletePassword ? "text" : "password"}
                          placeholder="PASSWORD"
                          value={deleteConfirmPassword}
                          onChange={(e) => {
                            setDeleteConfirmPassword(e.target.value);
                            if (deleteError) setDeleteError(null);
                          }}
                          className={`bg-neutral-50 border-[3px] p-4 pr-[80px] font-mono text-lg font-bold focus:outline-none focus:bg-white transition-colors w-full text-center ${deleteError ? "border-accent-red text-accent-red bg-red-50" : "border-black text-black"
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowDeletePassword(!showDeletePassword)}
                          className="absolute right-6 top-1/2 -translate-y-1/2 font-mono text-[10px] font-black text-black/40 hover:text-black transition-colors"
                        >
                          {showDeletePassword ? "HIDE" : "SHOW"}
                        </button>
                      </div>
                      {deleteError && (
                        <p className="font-mono text-[10px] font-black text-accent-red uppercase tracking-tighter mt-1">
                          {deleteError}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="w-full bg-accent-red text-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] py-5 font-mono font-black text-lg uppercase tracking-[0.3em] flex items-center justify-center hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all active:translate-y-2"
                    >
                      {isDeleting ? "PURGING..." : "CONFIRM PURGE"}
                    </button>

                    <button
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setDeleteError(null);
                        setDeleteConfirmPassword("");
                      }}
                      className="font-mono text-xs font-black text-black/30 hover:text-black uppercase tracking-[0.3em] bg-transparent border-none transition-all cursor-pointer hover:underline decoration-[3px] underline-offset-8"
                    >
                      CHANGED MY MIND
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  className={`relative shrink-0 flex items-center justify-center p-4 border-[3px] transition-all font-mono text-xs font-black uppercase ${isPrivate
                    ? "bg-black text-white border-black shadow-none translate-y-1"
                    : "bg-white text-black border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-neutral-100"
                    } ${cooldown ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{ width: "120px", height: "64px" }}
                >
                  {isPrivacyLoading ? "..." : isPrivate ? (
                    "MAKE PUBLIC"
                  ) : (
                    "MAKE PRIVATE"
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
