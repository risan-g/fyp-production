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
 * This aggregation is performed in PostgreSQL via the get_hottest_albums RPC.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "24h";
  const hours = range in RANGES ? RANGES[range] : 24;

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_hottest_albums", { p_hours: hours });

  if (error || !data || data.length === 0) {
    return NextResponse.json([]);
  }

  // The database correctly shapes the data to match the HottestAlbums.tsx contract:
  // album_id, name, artist, image, logCount, average
  return NextResponse.json(data);
}
