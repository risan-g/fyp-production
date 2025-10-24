"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

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
              className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
              onMouseDown={() => handleSelect(item)}
            >
              <span className="font-bold">{item.name}</span>{" "}
              <span className="text-sm text-gray-500">({item.type})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
