import { createBrowserClient } from "@supabase/ssr";

/**
 * Initialises a Supabase client for use in Client Components.
 * This allows for client-side authentication and real-time database interactions.
 */
export function createClient() {
  let supabaseUrl = "";
  let supabaseAnonKey = "";

  if (typeof window !== "undefined") {
    const config = (window as unknown as { __DOTWV_CONFIG__?: { supabaseUrl?: string; supabaseAnonKey?: string } }).__DOTWV_CONFIG__ || {};
    supabaseUrl = config.supabaseUrl || "";
    supabaseAnonKey = config.supabaseAnonKey || "";
  } else {
    // Server-side rendering context
    supabaseUrl = process.env.DOTWV_PUBLIC_SUPABASE_URL || "";
    supabaseAnonKey = process.env.DOTWV_PUBLIC_SUPABASE_ANON_KEY || "";
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing required Supabase browser configuration");
    // Provide safe dummy values to prevent build crashes during prerendering
    supabaseUrl = supabaseUrl || "http://localhost";
    supabaseAnonKey = supabaseAnonKey || "dummy";
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
