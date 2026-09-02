import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Initialises a Supabase client for Server Components.
 * Handles automatic session syncing via cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.DOTWV_SERVER_SUPABASE_URL || process.env.DOTWV_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.DOTWV_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const finalUrl = supabaseUrl;
  const finalAnonKey = supabaseAnonKey;

  if (!finalUrl || !finalAnonKey) {
    throw new Error("Missing required Supabase runtime configuration: DOTWV_SERVER_SUPABASE_URL, DOTWV_PUBLIC_SUPABASE_URL, or NEXT_PUBLIC_SUPABASE_URL and Anon Key are required.");
  }

  return createServerClient(
    finalUrl,
    finalAnonKey,
    {
      cookieOptions: {
        name: 'sb-dotwv-auth-token',
      },
      cookies: {
        // Reads cookies to check if a user is logged in on the server
        getAll() {
          return cookieStore.getAll();
        },
        // Updates session cookies (e.g., refreshing an expired token)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Silently fail if called from a Server Component (read-only context)
          }
        },
      },
    }
  );
}
