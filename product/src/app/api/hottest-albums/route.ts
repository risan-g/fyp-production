import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const RANGES: Record<string, number | null> = {
  "24h": 24,
  "week": 24 * 7,
  "month": 24 * 30,
  "year": 24 * 365,
  "all": null,
};

/**
 * GET /api/hottest-albums?range=24h|week|month|year|all
 * Returns the top 5 albums ranked by log count (then avg rating) for the given timeframe.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "24h";
  const hours = range in RANGES ? RANGES[range] : 24;

  const supabase = await createClient();

  let query = supabase
    .from("reviews")
    .select("album_id, album_name, artist_name, album_image_url, rating");

  if (hours !== null) {
    const since = new Date();
    since.setHours(since.getHours() - hours);
    query = query.gte("created_at", since.toISOString());
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return NextResponse.json([]);
  }

  const aggregator: Record<string, {
    album_id: string;
    name: string;
    artist: string;
    image: string;
    totalRating: number;
    ratingCount: number;
    logCount: number;
  }> = {};

  data.forEach((r) => {
    if (!aggregator[r.album_id]) {
      aggregator[r.album_id] = {
        album_id: r.album_id,
        name: r.album_name,
        artist: r.artist_name,
        image: r.album_image_url,
        totalRating: 0,
        ratingCount: 0,
        logCount: 0,
      };
    }
    aggregator[r.album_id].logCount += 1;
    if (r.rating !== null) {
      aggregator[r.album_id].totalRating += r.rating;
      aggregator[r.album_id].ratingCount += 1;
    }
  });

  const ranked = Object.values(aggregator)
    .map((a) => ({
      ...a,
      average: a.ratingCount > 0 ? Number((a.totalRating / a.ratingCount).toFixed(1)) : 0,
    }))
    .sort((a, b) => {
      if (b.logCount === a.logCount) return b.average - a.average;
      return b.logCount - a.logCount;
    })
    .slice(0, 5);

  return NextResponse.json(ranked);
}
