import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET Route Handler for Authentication Callbacks.
 * This route acts as the landing point for email confirmation links.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get("next") || "/";

  // If Supabase returned an error, redirect with the error message
  if (error) {
    console.error(`[Auth Callback] Error from provider: ${error} - ${errorDescription}`);
    const errorRedirect = new URL(`${origin}${next}`);
    errorRedirect.searchParams.set("auth_error", errorDescription || error);
    return NextResponse.redirect(errorRedirect);
  }

  // Prepare the redirect response FIRST so we can attach cookies to it
  const redirectUrl = new URL(`${origin}${next}`);
  const response = NextResponse.redirect(redirectUrl);

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set cookies on the outgoing response so the browser receives them
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    /**
     * Security Handshake:
     * Exchanges the temporary 'code' for a persistent user session.
     */
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[Auth Callback] Code exchange failed:", exchangeError.message);
      const errorRedirect = new URL(`${origin}${next}`);
      errorRedirect.searchParams.set("auth_error", exchangeError.message);
      return NextResponse.redirect(errorRedirect);
    }
  }

  return response;
}
