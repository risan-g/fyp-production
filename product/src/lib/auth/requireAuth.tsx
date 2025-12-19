import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Authentication Guard for Server Components.
 * Checks for a valid session and forces a redirect to the sign-in page if missing.
 * @returns {Object} The authenticated user object.
 */
export async function requireAuth() {
  const supabase = await createClient();

  // Fetches the current user session from Supabase via cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user is found, prevent page rendering and redirect immediately
  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
