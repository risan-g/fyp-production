import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET Route Handler for Supabase's specific OTP Email Verification links.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/settings";

  if (token_hash && type) {
    const supabase = await createClient();

    /**
     * Validates the single-use token sent to the user's email.
     * This processes both 'signup' and 'email_change' verification tokens.
     */
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Redirect the user back to where they were (usually settings)
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If the token is invalid or expired, send them back to the settings with an error parameter
  return NextResponse.redirect(new URL("/settings?error=invalid-token", request.url));
}
