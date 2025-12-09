import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LiveActivity from "@/components/LiveActivity";
import FeaturedAlbums from "@/components/FeaturedAlbums";

// Force dynamic rendering so the user session is checked on every request.
export const dynamic = "force-dynamic";

/**
 * Home page  (Server Component).
 *
 * This route checks the user's session on the server using Supabase.
 * If the user is logged in, we fetch their profile so we can render
 * the personalised hero section. Otherwise the page shows the generic
 * landing design with sign-in and register options.
 */
export default async function Home() {
  const supabase = await createClient();

  // Read the current user from the Supabase auth cookie on the server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username = null;

  // A second lookup is needed since the auth table only stores the UserID;
  // The readable username lives in the public "profiles" table.
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    username = profile?.username;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero section */}
      <div className="relative border-b border-neutral-900 bg-black pt-32 pb-20 px-6 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Swap text depending on whether the user is logged in */}
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-8 text-white">
            {username ? `Hello, ${username}.` : "Listen. Rate. Review."}
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 mb-10 leading-relaxed font-medium">
            {username
              ? "See what dropped this week and what the community is saying."
              : "Join the definitive platform for tracking your music history."}
          </p>

          {/* Navigation changes based on auth state */}
          <div className="flex justify-center gap-4">
            {username ? (
              <Link
                href={`/profile/${username}`}
                className="bg-white text-black font-bold px-8 py-3 rounded-md hover:bg-neutral-200 transition-colors text-sm uppercase tracking-wider min-w-[160px]"
              >
                Go to Profile
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="bg-white text-black font-bold px-8 py-3 rounded-md hover:bg-neutral-200 transition-colors text-sm uppercase tracking-wider min-w-[140px]"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-black border border-neutral-700 text-white font-bold px-8 py-3 rounded-md hover:bg-neutral-900 transition-colors text-sm uppercase tracking-wider min-w-[140px]"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Featured Albums (static) + Live Activity (dynamic) */}
      <div className="max-w-6xl mx-auto p-8">
        <FeaturedAlbums />
        <LiveActivity />
      </div>
    </div>
  );
}
