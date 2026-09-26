import { NextResponse } from "next/server";
import { getReleasesServerSide } from "@/lib/releases";

// Use Node so this shares the same GitHub + unstable_cache path as /download.
// Edge + long CDN TTL was serving stale latestVersion (e.g. v0.3.1 after v0.4.0).
export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getReleasesServerSide();
    return NextResponse.json(data, {
      headers: {
        // Keep CDN brief — desktop update check + homepage hero depend on freshness.
        // Server already caches GitHub for 60s via unstable_cache.
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Releases fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch releases" }, { status: 500 });
  }
}
