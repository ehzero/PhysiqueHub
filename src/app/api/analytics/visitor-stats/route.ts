import { NextResponse } from "next/server";
import { getPublicVisitorStats } from "@/lib/public-visitor-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const stats = await getPublicVisitorStats();

  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
