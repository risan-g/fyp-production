"use client";

interface ReviewProps {
  albumId: string;
  albumName: string;
  artistName: string;
}

export default function Review({
  albumId,
  albumName,
  artistName,
}: ReviewProps) {
  return <div className="bg-black-900 rounded-lg p-4"></div>;
}
