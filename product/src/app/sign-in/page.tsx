"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
      router.push("/");
      router.refresh();
    } catch (err: any) {
      if (err.message === "Email not confirmed") {
        setError("PLEASE CONFIRM YOUR EMAIL ADDRESS TO SIGN IN.");
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

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
            Sign In
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/50 mb-8">
            Welcome back
          </p>

          <form onSubmit={handleSignIn} className="space-y-5">
            {error && (
              <div className="p-3 bg-accent-red/10 border-[2px] border-accent-red text-accent-red text-xs font-mono font-bold uppercase tracking-wider text-center">
                {error}
              </div>
            )}

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
                  className="w-full px-4 py-3 bg-white border-[3px] border-black text-black font-mono text-sm focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow pr-12 placeholder:text-black/30"
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
              disabled={loading}
              className="w-full py-4 bg-black text-white font-mono font-bold uppercase tracking-[0.2em] text-sm border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-accent-red hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-[2px] border-black/10 text-center">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/50">
              Don't have an account?{" "}
              <Link
                href="/sign-up"
                className="font-bold text-black hover:text-accent-red transition-colors underline underline-offset-4 decoration-2"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
