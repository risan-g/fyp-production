"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

/**
 * Main Navigation Component
 * Handles live search with debouncing and global authentication state.
 */
export default function NavBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const supabase = createClient();

  /**
   * Listens for authentication changes on mount.
   * Syncs the user session and fetches the associated username from the database.
   */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUsername(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUsername(session.user.id);
      else setUsername(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Helper to retrieve the custom 'username' from the public profiles table.
   */
  const fetchUsername = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if (data) setUsername(data.username);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    setUsername(null);
    router.refresh();
  };

  /**
   * Search Logic with Debouncing
   * Waits 300ms after the last keystroke before hitting the internal Search API
   * to reduce unnecessary network load and respect Spotify rate limits.
   */
  useEffect(() => {
    if (!query) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handles navigation when a search result is clicked
  const handleSelect = (item: any) => {
    setShowDropdown(false);
    setQuery("");
    if (item.type === "artist") router.push(`/artist/${item.id}`);
    else router.push(`/album/${item.id}`);
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-3 shadow-sm bg-black sticky top-0 z-50">
      {/* Brand Identity */}
      <div
        className="text-white font-bold text-xl cursor-pointer"
        onClick={() => router.push("/")}
      >
        dotwv
      </div>

      {/* Global Search Interface */}
      <div className="flex-1 max-w-lg mx-4">
        <div className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artist, album, single..."
            className="bg-neutral-900 border border-neutral-800 rounded px-4 py-2 w-full text-white"
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />

          {/* Real-time Search Results Dropdown */}
          {showDropdown && results.length > 0 && (
            <ul className="absolute top-full left-0 w-full bg-white shadow-md z-50 max-h-60 overflow-y-auto">
              {results.map((item: any) => (
                <li
                  key={item.id + item.type}
                  className="flex items-center px-4 py-2 hover:bg-gray-200 cursor-pointer space-x-3"
                  onMouseDown={() => handleSelect(item)}
                >
                  {item.images?.[0]?.url && (
                    <img
                      src={item.images[0].url}
                      alt={item.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-gray-500">{item.type}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* User Session Management (Sign In vs. Profile Menu) */}
      <div className="relative">
        {user ? (
          <div>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
            ></button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (username) router.push(`/profile/${username}`);
                  }}
                  className="w-full px-4 py-2 border-b border-gray-200 hover:bg-gray-50 text-left"
                >
                  <p className="text-sm text-gray-500">Signed in as</p>
                  <p className="text-sm font-medium">@{username || "..."}</p>
                </button>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            onClick={() => router.push("/sign-in")}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
