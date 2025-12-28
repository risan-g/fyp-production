"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * SignUpPage (Server Component)
 * Manages the user registration process, including real-time username availability
 * checks and integration with Supabase Auth for account creation.
 */
export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Feedback States
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "taken" | "available"
  >("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Real-time Username Validation
   * Debounces input to prevent excessive database queries.
   * Checks public.profiles to ensure uniqueness before submission.
   */
  useEffect(() => {
    const checkUsername = async () => {
      // 1. Reset status if input is too short
      if (username.length < 3) {
        setUsernameStatus("idle");
        return;
      }

      setUsernameStatus("checking");

      // 2. Wait 500ms after typing stops (Debounce)
      const timeoutId = setTimeout(async () => {
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username)
          .single();

        if (data) {
          setUsernameStatus("taken");
        } else {
          setUsernameStatus("available");
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    };

    checkUsername();
  }, [username, supabase]);

  /**
   * Handles the submission of the registration form.
   * Performs final validation and triggers the Supabase Auth flow.
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Final guard clause against taken usernames
    if (usernameStatus === "taken") {
      setError("Username is already taken.");
      setLoading(false);
      return;
    }

    try {
      /**
       * Supabase Authentication Request:
       * Creates a new user and passes the 'username' in metadata.
       * The database trigger 'handle_new_user' will read this metadata
       * and create the public profile automatically.
       */
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username },
        },
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Success View:
   * Displays a post-registration guidance screen instructing the user
   * to verify their email address.
   */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4 text-white">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="mt-4 text-neutral-400">
            We sent a verification link to{" "}
            <span className="text-white font-semibold">{email}</span>
          </p>
          <div className="mt-8 pt-6 border-t border-neutral-800">
            <Link href="/sign-in" className="text-sm font-bold hover:underline">
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form View
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 text-white font-sans">
      <div className="max-w-md w-full space-y-8 bg-neutral-900 border border-neutral-800 p-8 rounded-xl">
        <div>
          <h2 className="text-3xl font-bold text-center">Create Account</h2>
          <p className="text-center text-neutral-400 text-sm mt-2">
            Sign up to get started
          </p>
        </div>

        <form onSubmit={handleSignUp} className="mt-8 space-y-6">
          {/* Conditional rendering for error feedback */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 bg-black border border-neutral-800 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>

            {/* Username Input with Live Feedback */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-medium text-neutral-400">
                  Username
                </label>
                {usernameStatus === "checking" && (
                  <span className="text-xs text-neutral-500">Checking...</span>
                )}
                {usernameStatus === "taken" && (
                  <span className="text-xs text-red-500">Taken</span>
                )}
                {usernameStatus === "available" && (
                  <span className="text-xs text-green-500">Available</span>
                )}
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                  )
                }
                className={`block w-full px-4 py-3 bg-black border rounded-lg text-white outline-none transition-all
                  ${
                    usernameStatus === "taken"
                      ? "border-red-900 focus:border-red-500"
                      : "border-neutral-800 focus:border-white focus:ring-1 focus:ring-white"
                  }
                `}
                placeholder="username"
              />
            </div>

            {/* Password with Toggle */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} // Toggles between text and password
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-black border border-neutral-800 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all pr-10" // Added pr-10 for space
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    // Eye Off Icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    // Eye Icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || usernameStatus === "taken"}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-black bg-white hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center text-sm pt-4 border-t border-neutral-800">
          <p className="text-neutral-400">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-bold text-white hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
