"use client";
import { useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  return (
    <form className="flex w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Artist"
        className="border rounded-l px-4 py-2 w-full"
      />
      <button type="submit" className="bg-blue-500 text-white px-6">
        SEARCH
      </button>
    </form>
  );
}
