import { GET } from "./route";

jest.mock("next/server", () => {
  return {
    NextResponse: {
      json: jest.fn((data, init) => {
        return {
          status: init?.status || 200,
          json: async () => data
        };
      })
    }
  };
});

describe("Readiness Endpoint", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return ready when configuration is complete", async () => {
    process.env.DOTWV_PUBLIC_SUPABASE_URL = "http://localhost:8000";
    process.env.DOTWV_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret-service-role-key";
    process.env.DOTWV_ENVIRONMENT = "test-env";
    process.env.DOTWV_RELEASE_SHA = "abcdef";

    const res = (await GET()) as unknown as Response;
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json).toEqual({
      status: "ready",
      service: "dotwv",
      environment: "test-env",
      release: "abcdef"
    });
    
    // Ensure secrets are not leaked
    expect(JSON.stringify(json)).not.toContain("http://localhost:8000");
    expect(JSON.stringify(json)).not.toContain("anon");
    expect(JSON.stringify(json)).not.toContain("secret-service-role-key");
  });

  it("should return not_ready when required configuration is missing", async () => {
    delete process.env.DOTWV_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.DOTWV_SERVER_SUPABASE_URL;
    delete process.env.DOTWV_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const res = (await GET()) as unknown as Response;
    const json = await res.json();
    
    expect(res.status).toBe(503);
    expect(json.status).toBe("not_ready");
    expect(json.missing_configuration).toContain("DOTWV_SERVER_SUPABASE_URL / DOTWV_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL");
    expect(json.missing_configuration).toContain("DOTWV_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(json.missing_configuration).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
