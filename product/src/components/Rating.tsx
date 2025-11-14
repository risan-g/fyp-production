"use client";

interface RatingProps {
  albumId: string;
  albumName: string;
  artistName: string;
}

export default function Rating({
  albumId,
  albumName,
  artistName,
}: RatingProps) {
  return <div className="bg-black-900 rounded-lg p-4"></div>;
}
