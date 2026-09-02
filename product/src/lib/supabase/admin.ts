import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.DOTWV_SERVER_SUPABASE_URL || process.env.DOTWV_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env.NODE_ENV === "test" ? "http://localhost:8000" : "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env.NODE_ENV === "test" ? "dummy-key" : "");

const finalUrl = supabaseUrl;
const finalKey = serviceRoleKey;

if (!finalUrl || !finalKey) {
  throw new Error("Missing required Supabase admin configuration: DOTWV_SERVER_SUPABASE_URL, DOTWV_PUBLIC_SUPABASE_URL, or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

export const supabaseAdmin = createClient(
  finalUrl,
  finalKey
);
