import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// --- Schemas (module-private) ---

/**
 * Hottest albums timeframe schema.
 * Explicitly validates the finite set of allowed values.
 * Uses .catch("24h") to exactly preserve the existing behaviour where
 * missing, empty, or unknown values safely default to "24h" without returning an error.
 */
const timeframeSchema = z.enum(["24h", "week", "month", "year", "all"]).catch("24h");

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
  const rawRange = url.searchParams.get("range");

  // Validation occurs before mapping to trusted hours
  const range = timeframeSchema.parse(rawRange);
  const hours = RANGES[range];

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_hottest_albums", { p_hours: hours });

  if (error || !data || data.length === 0) {
    return NextResponse.json([]);
  }

  // The database correctly shapes the data to match the HottestAlbums.tsx contract:
  // album_id, name, artist, image, logCount, average
  return NextResponse.json(data);
}
