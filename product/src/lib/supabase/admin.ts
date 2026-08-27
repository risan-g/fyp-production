import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.DOTWV_SERVER_SUPABASE_URL || process.env.DOTWV_PUBLIC_SUPABASE_URL || (process.env.NODE_ENV === "test" ? "http://localhost:8000" : "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env.NODE_ENV === "test" ? "dummy-key" : "");

let finalUrl = supabaseUrl;
let finalKey = serviceRoleKey;

if (!finalUrl || !finalKey) {
  console.error("Missing required Supabase admin configuration (DOTWV_SERVER_SUPABASE_URL/DOTWV_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
  finalUrl = finalUrl || "http://localhost";
  finalKey = finalKey || "dummy";
}

export const supabaseAdmin = createClient(
  finalUrl,
  finalKey
);
