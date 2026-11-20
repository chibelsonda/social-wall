export const dynamic = "force-dynamic";

function decodeHeader(value: string | null) {
  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getCountryName(countryCode: string | null) {
  if (!countryCode) return null;

  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

export function GET(request: Request) {
  const city = decodeHeader(request.headers.get("x-vercel-ip-city"));
  const region = decodeHeader(request.headers.get("x-vercel-ip-country-region"));
  const country = getCountryName(request.headers.get("x-vercel-ip-country"));
  const timezone = decodeHeader(request.headers.get("x-vercel-ip-timezone"));
  const location = Array.from(new Set([city, region, country].filter(Boolean))).join(", ") || null;

  return Response.json(
    { location, timezone },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
