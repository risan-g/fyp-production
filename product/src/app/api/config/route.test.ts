import { GET } from "./route";

/* eslint-disable @typescript-eslint/no-explicit-any */
describe("/api/config", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    global.Response = class MockResponse {
      status: number;
      body: string;
      headers: Map<string, string>;
      constructor(body: string, init?: any) {
        this.body = body;
        this.status = init?.status || 200;
        this.headers = new Map(Object.entries(init?.headers || {}));
      }
      async text() {
        return this.body;
      }
      get headersObj() {
        return {
          get: (key: string) => this.headers.get(key)
        };
      }
    } as any;
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns allowlisted public configuration safely", async () => {
    process.env.DOTWV_PUBLIC_SUPABASE_URL = "https://public.example.com";
    process.env.DOTWV_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    process.env.DOTWV_SERVER_SUPABASE_URL = "https://server.example.com";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret-service-key";

    const response = await GET();
    const text = await response.text();

    expect((response as any).status).toBe(200);
    expect((response as any).headersObj.get("Content-Type")).toBe("application/javascript");
    expect((response as any).headersObj.get("Cache-Control")).toBe("no-store, max-age=0");

    expect(text).toContain("window.__DOTWV_CONFIG__ = ");
    expect(text).toContain("https://public.example.com");
    expect(text).toContain("public-anon-key");
    
    // Crucially, it must NEVER expose server secrets
    expect(text).not.toContain("https://server.example.com");
    expect(text).not.toContain("secret-service-key");
  });

  it("throws an error specifying variable names when configuration is missing", async () => {
    delete process.env.DOTWV_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.DOTWV_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    await expect(GET()).rejects.toThrow("Missing required Supabase browser configuration: DOTWV_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL and Anon Key are required.");
  });
});
