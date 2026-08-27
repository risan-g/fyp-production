import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the user's session cookie.
 * This ensures the user stays logged in while navigating between pages.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.DOTWV_SERVER_SUPABASE_URL || process.env.DOTWV_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.DOTWV_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing required Supabase runtime configuration in middleware");
  }

  const supabase = createServerClient(
    supabaseUrl || "http://localhost",
    supabaseAnonKey || "dummy",
    {
      cookies: {
        // Retrieves existing session cookies from the browser request
        getAll() {
          return request.cookies.getAll();
        },
        // Updates the cookies in both the request and the response
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verification step: Triggers a session refresh if the token is near expiry
  await supabase.auth.getUser();

  return supabaseResponse;
}
