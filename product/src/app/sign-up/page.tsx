"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

/**
 * SignUpPage Component
 * Manages the user registration process, including form validation
 * and integration with Supabase Auth for account creation.
 */
export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  /**
   * Handles the submission of the registration form.
   * Performs client-side validation before attempting to initialise the account.
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Initialise validation checks to ensure data integrity
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    // RegEx validation: ensures usernames contain only alphanumeric characters and underscores
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setError("Username can only contain letters, numbers and underscores");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      /**
       * Supabase Authentication Request:
       * Creates a new user and sends a confirmation email.
       * The 'username' is stored in the user's metadata (user_metadata).
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
      setError(err.message || "Failed to create account");
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
        <div className="max-w-md w-full space-y-8 bg-black border border-neutral-800 p-8 rounded-xl shadow-2xl text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mb-4 border border-green-500/20">
            <svg
              className="h-8 w-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="mt-4 text-neutral-400">
            A confirmation link has been sent to{" "}
            <span className="text-white font-medium">{email}</span>
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Click the link in the email to verify and complete sign up.
          </p>
          <Link
            href="/sign-in"
            className="mt-8 inline-block text-sm font-bold text-white hover:underline decoration-neutral-500 underline-offset-4"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Registration Form View: Utilises a clean, minimalist UI consistent with the brand theme.
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 text-white">
      <div className="max-w-md w-full space-y-8 bg-black border border-neutral-800 p-8 rounded-xl shadow-2xl">
        <div>
          <h2 className="text-3xl font-bold text-center tracking-tight">
            Create Account
          </h2>
          <p className="text-center text-neutral-500 text-sm mt-2">
            Start tracking your collection today
          </p>
        </div>

        <form onSubmit={handleSignUp} className="mt-8 space-y-6">
          {/* Conditional rendering for error feedback */}
          {error && (
            <div className="bg-red-500/10 border border-red-900/50 text-red-500 px-4 py-3 rounded text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="block w-full px-4 py-3 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                minLength={3}
                maxLength={10}
                placeholder="username"
              />
              <p className="mt-2 text-[10px] text-neutral-600">
                3-10 characters, letters & numbers only.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2"
                >
                  Confirm
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <p className="text-[10px] text-neutral-600 mt-1">
              Must be at least 8 characters.
            </p>
          </div>

          {/* Submission button with loading state to prevent duplicate registrations */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center text-sm pt-4 border-t border-neutral-900">
          <p className="text-neutral-500">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-bold text-white hover:underline decoration-neutral-500 underline-offset-4"
            >
              Sign in here!
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
