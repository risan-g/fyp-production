"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

/**
 * SignInPage (Server Component)
 * Handles the authentication flow using Supabase Auth (Email/Password).
 */
export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  /**
   * Handles the sign-in submission.
   * Uses simple email/password authentication without custom database lookups.
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Force router refresh to update server components with new auth state
      router.push("/");
      router.refresh();
    } catch (err: any) {
      // We purposefully use a generic error message for security
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 text-white font-sans">
      <div className="max-w-md w-full space-y-8 bg-neutral-900 border border-neutral-800 p-8 rounded-xl">
        <div>
          <h2 className="text-3xl font-bold text-center">Sign In</h2>
          <p className="text-center text-neutral-400 text-sm mt-2">
            Welcome back
          </p>
        </div>

        <form onSubmit={handleSignIn} className="mt-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-black border border-neutral-800 rounded-lg text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-black bg-white hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-sm pt-4 border-t border-neutral-800">
          <p className="text-neutral-400">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="font-bold text-white hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
