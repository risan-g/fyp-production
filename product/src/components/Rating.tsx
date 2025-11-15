"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
interface RatingProps {
  albumId: string;
  albumName: string;
  artistName: string;
}
const getTranslatorText = (value: number) => {
  if (value === 0) return "(NOT GOOD)";
  if (value === 100) return "(CLASSIC)";

  const base = Math.floor(value / 10);
  const mod = value % 10;

  let term = "";
  if (mod < 4) term = "LIGHT";
  else if (mod < 7) term = "DECENT";
  else term = "STRONG";

  if (base === 0 && value > 0) {
    return "(NOT GOOD)";
  }
  return `(${term} ${base})`;
};

export default function Rating({
  albumId,
  albumName,
  artistName,
}: RatingProps) {
  const [rating, setRating] = useState(0);
  const isDragging = useRef(false);
  const sliderWrapperRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const updateRatingFromY = (clientY: number) => {
    if (!sliderWrapperRef.current) return;

    const trackRect = sliderWrapperRef.current.getBoundingClientRect();
    let newTop = clientY - trackRect.top;
    let percent = newTop / trackRect.height;
    percent = Math.max(0, Math.min(1, percent));

    const value = (1 - percent) * 100;
    return value;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    if (knobRef.current) {
      knobRef.current.style.cursor = "grabbing";
      knobRef.current.style.backgroundColor = "#111";
    }
    document.body.style.cursor = "grabbing";
    e.preventDefault();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const value = updateRatingFromY(e.clientY);
    if (value !== undefined) {
      setRating(Math.round(value));
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (knobRef.current) {
      knobRef.current.style.cursor = "grab";
      knobRef.current.style.backgroundColor = "#fff";
    }
    document.body.style.cursor = "default";

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleClickTrack = (e: React.MouseEvent) => {
    if (e.target === knobRef.current) return;

    const value = updateRatingFromY(e.clientY);
    if (value !== undefined) {
      const finalValue = Math.round(value / 10) * 10;
      setRating(finalValue);
    }
  };

  return (
    <div className="bg-black-900 rounded-lg p-4 flex flex-col items-center">
      <div className="mb-10 h-28 flex flex-col justify-center items-center">
        <div className="text-7xl font-bold text-white leading-none">
          {rating}
        </div>
        <div className="font-mono text-lg text-neutral-500 mt-2 uppercase h-5">
          {getTranslatorText(rating)}
        </div>
      </div>

      <div
        className="h-72 w-20 cursor-pointer flex justify-center relative"
        ref={sliderWrapperRef}
        onClick={handleClickTrack}
      >
        <div className="w-1 h-full bg-neutral-700 absolute left-1/2 -translate-x-1/2" />
        <div className="absolute top-0 left-[calc(50%+10px)] w-2.5 h-full flex flex-col justify-between pointer-events-none">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="w-full h-0.5 bg-neutral-600" />
          ))}
        </div>
        <div
          ref={knobRef}
          className="w-12 h-5 bg-white absolute left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab border-2 border-white z-10"
          style={{ top: `${100 - rating}%` }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
}
