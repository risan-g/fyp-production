"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import NotificationBell from "@/components/NotificationBell";
import { X, Loader2, Search } from "lucide-react";

interface SearchResults {
  users: { id: string; name: string; image: string | null; type: "user" }[];
  artists: { id: string; name: string; image: string | null; type: "artist" }[];
  albums: { id: string; name: string; image: string | null; subtitle: string; type: "album" }[];
}

const emptyResults: SearchResults = { users: [], artists: [], albums: [] };

/**
 * Handles live search with debouncing and global authentication state.
 */
export default function NavBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const supabase = createClient();

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

  useEffect(() => {
    if (!user?.id) return;

    const handleProfileUpdate = () => {
      fetchProfile(user.id);
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [user?.id]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .single();

    if (data) {
      setUsername(data.username);
      setAvatarUrl(data.avatar_url);
    } else {
      setUsername(null);
      setAvatarUrl(null);
      setUser(null);
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
      setResults(emptyResults);
      setShowDropdown(false);
      setIsSearching(false);
      setSelectedIndex(-1);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const flattenedResults = [
    ...results.users,
    ...results.artists,
    ...results.albums
  ];

  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const activeElement = dropdownRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement | null;
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (item: any) => {
    setShowDropdown(false);
    setQuery("");
    setSelectedIndex(-1);
    if (item.type === "user") router.push(`/profile/${item.id}`);
    else if (item.type === "artist") router.push(`/artist/${item.id}`);
    else router.push(`/album/${item.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || flattenedResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flattenedResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flattenedResults.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0) {
        handleSelect(flattenedResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const hasResults = results.users.length > 0 || results.artists.length > 0 || results.albums.length > 0;

  const renderItem = (item: any, globalIndex: number, subtitle?: string) => {
    const isActive = selectedIndex === globalIndex;
    return (
      <li
        key={`${item.type}-${item.id}`}
        data-index={globalIndex}
        className={`flex items-center px-4 py-3 cursor-pointer gap-4 border-b-[2px] border-black/10 last:border-b-0 transition-colors group ${
          isActive ? "bg-black text-white" : "hover:bg-black hover:text-white"
        }`}
        onMouseDown={() => handleSelect(item)}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className={`w-10 h-10 object-cover border-2 border-black ${item.type === "user" ? "rounded-full" : ""}`}
          />
        ) : (
          <div className={`w-10 h-10 border-2 border-black flex items-center justify-center bg-neutral-200 ${item.type === "user" ? "rounded-full" : ""}`}>
            <span className={`font-mono text-sm font-bold uppercase ${isActive ? "text-white" : "text-black"}`}>
              {item.name?.[0] || "?"}
            </span>
          </div>
        )}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-bold font-mono uppercase truncate text-sm">{item.name}</span>
          {subtitle && (
            <span className={`text-[10px] uppercase font-mono tracking-widest truncate ${
              isActive ? "text-white/70" : "text-black/50 group-hover:text-white/70"
            }`}>{subtitle}</span>
          )}
        </div>
      </li>
    );
  };

  const renderSectionHeader = (label: string) => (
    <div className="px-4 py-2 bg-neutral-100 border-b-[3px] border-black">
      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black/60">"{label}"</span>
    </div>
  );

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-white border-b-[3px] border-black sticky top-0 z-50">
      <div
        className="text-black font-black font-serif text-3xl uppercase tracking-tighter cursor-pointer hover:text-accent-red transition-colors"
        onClick={() => router.push("/")}
      >
        dotwv
      </div>

      <div className="flex-1 max-w-lg mx-4">
        <div className="relative w-full">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="SEARCH USERS, ARTISTS, ALBUMS..."
              className="bg-white border-[3px] border-black px-4 py-2 pr-10 w-full text-black font-mono text-sm uppercase tracking-widest placeholder:text-black/40 focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow"
              onFocus={() => hasResults && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults(emptyResults); }}
                className="absolute right-3 text-black/40 hover:text-black transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {showDropdown && (hasResults || isSearching) && (
            <div 
              ref={dropdownRef}
              className="absolute top-full mt-2 left-0 w-full bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] z-50 max-h-[420px] overflow-y-auto"
            >
              {isSearching && (
                <div className="px-4 py-3 flex items-center gap-3 border-b-[3px] border-black bg-neutral-50">
                  <Loader2 size={14} className="animate-spin text-accent-red" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black">SEARCHING...</span>
                </div>
              )}

              {!isSearching && results.users.length > 0 && (
                <>
                  {renderSectionHeader("Users")}
                  <ul>{results.users.map((u, i) => renderItem(u, i, `@${u.name}`))}</ul>
                </>
              )}

              {!isSearching && results.artists.length > 0 && (
                <>
                  {renderSectionHeader("Artists")}
                  <ul>{results.artists.map((a, i) => renderItem(a, results.users.length + i))}</ul>
                </>
              )}

              {!isSearching && results.albums.length > 0 && (
                <>
                  {renderSectionHeader("Albums")}
                  <ul>{results.albums.map((a, i) => renderItem(a, results.users.length + results.artists.length + i, a.subtitle))}</ul>
                </>
              )}
            </div>
          )}

          {showDropdown && query && !hasResults && !isSearching && (
            <div className="absolute top-full mt-2 left-0 w-full bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] z-50 p-6 text-center">
              <p className="text-black font-mono font-bold uppercase tracking-widest text-sm">"NO MATCHES"</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        {user ? (
          <>
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 bg-black flex items-center justify-center hover:bg-accent-red border-[3px] border-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
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
                    PROFILE
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/settings");
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between text-left font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors border-b-[3px] border-black group"
                  >
                    <span>SETTINGS</span>
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
