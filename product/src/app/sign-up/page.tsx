"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "taken" | "available"
  >("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    const timeoutId = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .single();

      setUsernameStatus(data ? "taken" : "available");
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, supabase]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (usernameStatus === "taken") {
      setError("Username is already taken.");
      setLoading(false);
      return;
    }

    try {
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 font-sans">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <Link href="/" className="text-black font-black font-serif text-4xl uppercase tracking-tighter hover:text-accent-red transition-colors">
              dotwv
            </Link>
          </div>

          <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-8 text-center">
            <div className="w-16 h-16 border-[3px] border-black mx-auto mb-6 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-black font-mono uppercase tracking-[0.1em] text-black mb-2">
              Check Your Email
            </h2>
            <p className="text-xs font-mono text-black/50 uppercase tracking-wider">
              We sent a verification link to
            </p>
            <p className="text-sm font-mono font-bold text-black mt-2 bg-neutral-100 py-2 px-4 border-[2px] border-black/10 inline-block">
              {email}
            </p>
            <div className="mt-8 pt-6 border-t-[2px] border-black/10">
              <Link
                href="/sign-in"
                className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black hover:text-accent-red transition-colors underline underline-offset-4 decoration-2"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 font-sans">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <Link href="/" className="text-black font-black font-serif text-4xl uppercase tracking-tighter hover:text-accent-red transition-colors">
            dotwv
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-8">
          <h2 className="text-2xl font-black font-mono uppercase tracking-[0.1em] text-black mb-1">
            Create Account
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/50 mb-8">
            Join the community
          </p>

          <form onSubmit={handleSignUp} className="space-y-5">
            {error && (
              <div className="p-3 bg-accent-red/10 border-[2px] border-accent-red text-accent-red text-xs font-mono font-bold uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black/60 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border-[3px] border-black text-black font-mono text-sm focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow placeholder:text-black/30"
                placeholder="NAME@EXAMPLE.COM"
              />
            </div>

            {/* Username with live status */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black/60">
                  Username
                </label>
                {usernameStatus === "checking" && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/40">Checking...</span>
                )}
                {usernameStatus === "taken" && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-red">✕ Taken</span>
                )}
                {usernameStatus === "available" && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-green-600">✓ Available</span>
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
                className={`w-full px-4 py-3 bg-white border-[3px] text-black font-mono text-sm focus:outline-none transition-shadow placeholder:text-black/30 ${
                  usernameStatus === "taken"
                    ? "border-accent-red focus:shadow-[4px_4px_0px_rgba(220,38,38,0.5)]"
                    : usernameStatus === "available"
                    ? "border-green-600 focus:shadow-[4px_4px_0px_rgba(22,163,74,0.5)]"
                    : "border-black focus:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                }`}
                placeholder="USERNAME"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black/60 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-[3px] border-black text-black font-mono text-sm focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow pr-16 placeholder:text-black/30"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold uppercase tracking-wider text-black/40 hover:text-black transition-colors"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || usernameStatus === "taken"}
              className="w-full py-4 bg-black text-white font-mono font-bold uppercase tracking-[0.2em] text-sm border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-accent-red hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-[2px] border-black/10 text-center">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/50">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-bold text-black hover:text-accent-red transition-colors underline underline-offset-4 decoration-2"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
