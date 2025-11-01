"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

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

  const handleSelect = (item: any) => {
    setShowDropdown(false);
    setQuery("");
    if (item.type === "artist") router.push(`/artist/${item.id}`);
    else router.push(`/album/${item.id}`);
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-3 shadow-sm bg-white sticky top-0 z-50">
      <div
        className="font-bold text-xl cursor-pointer"
        onClick={() => router.push("/")}
      >
        dotwv
      </div>

      <div className="flex-1 max-w-lg mx-4">
        <div className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artist, album, single..."
            className="border rounded px-4 py-2 w-full"
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />

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

      <div>
        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={() => alert("Sign In clicked!")}
        >
          Sign In
        </button>
      </div>
    </header>
  );
}
