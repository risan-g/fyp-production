import { NextResponse } from "next/server";

export async function GET() {
  const missing = [];

  if (!process.env.DOTWV_SERVER_SUPABASE_URL && !process.env.DOTWV_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push("DOTWV_SERVER_SUPABASE_URL / DOTWV_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.DOTWV_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push("DOTWV_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (missing.length > 0) {
    return NextResponse.json(
      {
        status: "not_ready",
        missing_configuration: missing,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "ready",
    service: "dotwv",
    environment: process.env.DOTWV_ENVIRONMENT || "unknown",
    release: process.env.DOTWV_RELEASE_SHA || "unknown",
  });
}
