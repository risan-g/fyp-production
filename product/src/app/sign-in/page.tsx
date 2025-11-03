"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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

      const looksLikeEmail = emailToUse.includes("@");

      if (!looksLikeEmail) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", emailToUse.toLowerCase())
          .single();

        if (profileError) {
          console.error("Profile lookup error:", profileError);
          throw new Error("Username not found. Please check and try again.");
        }

        if (!profile || !profile.email) {
          throw new Error("Username not found. Please check and try again.");
        }

        emailToUse = profile.email;
        console.log("Found email for username:", emailToUse);
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });

      if (signInError) {
        console.error(signInError);
        throw signInError;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Error during sign in:", err);

      let errorMessage = "Failed to sign in. Please try again.";

      if (err.message.includes("Username not found")) {
        errorMessage = err.message;
      } else if (err.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email/username or password.";
      } else if (err.message.includes("Email not confirmed")) {
        errorMessage = "Please verify your email before signing in.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Sign In</h2>
        </div>

        <form onSubmit={handleSignIn} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="emailOrUsername"
                className="block text-sm font-medium text-gray-700"
              >
                E M A I L / U S E R N A M E
              </label>
              <input
                id="emailOrUsername"
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                P A S S W O R D
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-sm">
          <p className="text-gray-400">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-black hover:underline"
            >
              Sign Up!
            </Link>
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          className="w-full flex justify-center py-2 px-2 border border-transparent rounded-md shadow-sm text-white bg-green-500 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sign in with Spotify
        </button>
      </div>
    </div>
  );
}
