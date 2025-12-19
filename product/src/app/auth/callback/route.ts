import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET Route Handler for Authentication Callbacks.
 * This route acts as the landing point for email confirmation links.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  /**
   * The 'code' is a temporary authorisation string provided by Supabase.
   * We extract this from the URL search parameters.
   */
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    /**
     * Security Handshake:
     * Exchanges the temporary 'code' for a persistent user session.
     * This process verifies the user's email and initialises their session cookies.
     */
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Once authenticated, redirect the user back to the application homepage.
  return NextResponse.redirect(`${origin}/`);
}
