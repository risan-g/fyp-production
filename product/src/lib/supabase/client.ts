import { createBrowserClient } from "@supabase/ssr";

/**
 * Initialises a Supabase client for use in Client Components.
 * This allows for client-side authentication and real-time database interactions.
 */
export function createClient() {
  return createBrowserClient(
    // Environment variables are prefixed with NEXT_PUBLIC_ to make them
    // accessible in the browser environment.
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
