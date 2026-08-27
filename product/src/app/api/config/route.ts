import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = {
    supabaseUrl: process.env.DOTWV_PUBLIC_SUPABASE_URL || "http://localhost:8000",
    supabaseAnonKey: process.env.DOTWV_PUBLIC_SUPABASE_ANON_KEY || "dummy",
  };

  return new NextResponse(
    `window.__DOTWV_CONFIG__ = ${JSON.stringify(config)};`,
    {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
