import { GET } from "./route";

describe("visitor context route", () => {
  it("returns decoded approximate location details without exposing an IP", async () => {
    const request = new Request("https://example.com/api/visitor-context", {
      headers: {
        "x-vercel-ip-city": "Quezon%20City",
        "x-vercel-ip-country-region": "NCR",
        "x-vercel-ip-country": "PH",
        "x-vercel-ip-timezone": "Asia%2FManila",
        "x-forwarded-for": "203.0.113.42",
      },
    });

    const response = GET(request);
    const body = await response.json();

    expect(body).toEqual({
      location: "Quezon City, NCR, Philippines",
      timezone: "Asia/Manila",
    });
    expect(JSON.stringify(body)).not.toContain("203.0.113.42");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
