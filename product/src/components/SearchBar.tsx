"use client";
import { useState, useEffect } from "react";

export default function SearchBar() {
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
        setResults(data.artists);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Artist"
        className="border rounded px-4 py-2 w-full"
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
      />

      {showDropdown && results.length > 0 && (
        <ul className="absolute left-0 w-full bg-white shadow-md z-50 max-h-60 overflow-y-auto">
          {results.map((artist: any) => (
            <li
              key={artist.id}
              className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => {
                window.location.href = `/artist/${artist.id}`;
              }}
            >
              {artist.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
