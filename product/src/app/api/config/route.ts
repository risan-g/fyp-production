
export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.DOTWV_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.DOTWV_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing required Supabase browser configuration: DOTWV_PUBLIC_SUPABASE_URL and DOTWV_PUBLIC_SUPABASE_ANON_KEY are required.");
  }

  const config = {
    supabaseUrl,
    supabaseAnonKey,
  };

  return new Response(
    `window.__DOTWV_CONFIG__ = ${JSON.stringify(config)};`,
    {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
