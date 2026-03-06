"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import NotificationBell from "@/components/NotificationBell"; // Added the Notification Bell import

/**
 * Handles live search with debouncing and global authentication state.
 */
export default function NavBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const supabase = createClient();

  /**
   * Listens for authentication changes.
   * Syncs the user session and fetches the associated username and avatar.
   */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setUsername(null);
        setAvatarUrl(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Helper to retrieve the custom 'username' and 'avatar_url'
   */
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .single();

    if (data) {
      setUsername(data.username);
      setAvatarUrl(data.avatar_url);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    setUsername(null);
    setAvatarUrl(null);
    router.refresh();
  };

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
    <header className="w-full flex items-center justify-between px-6 py-4 bg-white border-b-[3px] border-black sticky top-0 z-50">
      <div
        className="text-black font-black font-serif text-3xl uppercase tracking-tighter cursor-pointer hover:text-accent-red transition-colors"
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
            placeholder="SEARCH ARTIST, ALBUM, SINGLE..."
            className="bg-white border-[3px] border-black px-4 py-2 w-full text-black font-mono text-sm uppercase tracking-widest placeholder:text-black/40 focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow"
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />

          {/* Real time Search Results Dropdown */}
          {showDropdown && results.length > 0 && (
            <ul className="absolute top-full mt-2 left-0 w-full bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] z-50 max-h-80 overflow-y-auto">
              {results.map((item: any, index: number) => (
                <li
                  key={item.id + item.type}
                  className={`flex items-center px-4 py-3 hover:bg-black hover:text-white cursor-pointer space-x-4 border-b-[3px] border-black last:border-b-0 transition-colors group ${index % 2 === 0 ? "bg-white" : "bg-neutral-50"
                    }`}
                  onMouseDown={() => handleSelect(item)}
                >
                  {item.images?.[0]?.url ? (
                    <img
                      src={item.images[0].url}
                      alt={item.name}
                      className="w-10 h-10 object-cover border-2 border-black transition-all"
                    />
                  ) : (
                    <div className="w-10 h-10 border-2 border-black flex items-center justify-center bg-neutral-200">
                      <span className="font-mono text-[10px] text-black">N/A</span>
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold font-mono uppercase truncate">{item.name}</span>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-black/50 group-hover:text-white/70">{item.type}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        {" "}
        {user ? (
          <>
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 bg-black flex items-center justify-center hover:bg-accent-red border-[3px] border-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                {/* Show Real Avatar or Fallback Initial */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-mono font-bold uppercase">
                    {username ? username[0] : "?"}
                  </span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-4 w-56 bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] z-50">
                  <div className="px-4 py-3 border-b-[3px] border-black cursor-default">
                    <p className="text-[10px] uppercase font-mono text-black/50 tracking-widest">LOGGED IN AS</p>
                    <p className="text-sm font-bold font-mono truncate uppercase">@{username || "..."}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (username) router.push(`/profile/${username}`);
                    }}
                    className="w-full px-4 py-3 text-left font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors border-b-[3px] border-black"
                  >
                    MY PROFILE
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-left font-mono text-xs font-bold uppercase tracking-widest text-accent-red hover:bg-accent-red hover:text-white transition-colors"
                  >
                    SIGN OUT
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            className="bg-white text-black font-bold px-6 py-2 text-xs uppercase tracking-[0.2em] border-[3px] border-black font-mono shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
            onClick={() => router.push("/sign-in")}
          >
            SIGN IN
          </button>
        )}
      </div>
    </header>
  );
}
