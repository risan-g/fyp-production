"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

/**
 * SignInPage (Server Component).
 * Handles the authentication flow using Supabase Auth.
 */
export default function SignInPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let emailToUse = emailOrUsername.trim();

      // Detect if the input is an email or a username
      const looksLikeEmail = emailToUse.includes("@");

      if (!looksLikeEmail) {
        // We query the public 'profiles' table.
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", emailToUse.toLowerCase())
          .single();

        if (profileError || !profile?.email) {
          throw new Error("Username not found. Please check and try again.");
        }

        emailToUse = profile.email;
      }

      // Authenticate against Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (signInError) throw signInError;

      //Refreshs router to force Next.js to re-run server components, and enter logged in state.
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Error during sign in:", err);
      let errorMessage = "Failed to sign in.";

      // Map technical errors to user-friendly messages.
      if (err.message.includes("Username not found")) {
        errorMessage = "Username not found.";
      } else if (err.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 text-white">
      {/* Design: Pure Black card with Border-Only definition (Minimalist) */}
      <div className="max-w-md w-full space-y-8 bg-black border border-neutral-800 p-8 rounded-xl shadow-2xl">
        <div>
          <h2 className="text-3xl font-bold text-center tracking-tight">
            Sign In
          </h2>
          <p className="text-center text-neutral-500 text-sm mt-2">
            Welcome back to the community
          </p>
        </div>

        <form onSubmit={handleSignIn} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-900/50 text-red-500 px-4 py-3 rounded text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="emailOrUsername"
                className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2"
              >
                Email / Username
              </label>
              <input
                id="emailOrUsername"
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="block w-full px-4 py-3 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                placeholder="Enter details..."
              />
            </div>

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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-sm pt-4 border-t border-neutral-900">
          <p className="text-neutral-500">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="font-bold text-white hover:underline decoration-neutral-500 underline-offset-4"
            >
              Sign Up!
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
