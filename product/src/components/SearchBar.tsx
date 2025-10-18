"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  // Debounced search effect
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

  // Navigate to artist page
  function handleSelect(artistId: string) {
    setShowDropdown(false);
    setQuery("");
    router.push(`/artist/${artistId}`);
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Artist"
        className="border rounded px-4 py-2 w-full"
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      />

      {showDropdown && results.length > 0 && (
        <ul className="absolute top-full left-0 w-full bg-white shadow-md z-50 max-h-60 overflow-y-auto">
          {results.map((artist: any) => (
            <li
              key={artist.id}
              className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
              onMouseDown={() => handleSelect(artist.id)}
            >
              {artist.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
