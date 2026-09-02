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

describe("Liveness Endpoint", () => {
  it("should return status alive", async () => {
    const res = await GET() as unknown as Response;
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json).toEqual({ status: "alive" });
  });
});
