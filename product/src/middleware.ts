import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Global Middleware function.
 * Executes on every request to refresh the Supabase session cookie.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Middleware Configuration
 * Uses a 'matcher' to define which paths the middleware should run on.
 */
export const config = {
  matcher: [
    /**
     * Optimized Regex: Matches all request paths EXCEPT for:
     * - _next/static (compiled files)
     * - _next/image (image optimization)
     * - favicon.ico and common image formats
     * This prevents the database session check from slowing down static asset loading.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
