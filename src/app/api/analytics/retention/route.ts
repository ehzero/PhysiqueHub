import { NextResponse } from "next/server";
import { anonymizeStaleAnalytics } from "@/lib/analytics-retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron이 매일 호출한다. CRON_SECRET이 설정되어 있으면 Vercel은
// Authorization: Bearer <CRON_SECRET> 헤더를 자동으로 붙인다. 같은 헤더로
// 수동 호출(curl)도 가능하다.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await anonymizeStaleAnalytics();

  return NextResponse.json({
    ok: true,
    ...result,
    cutoff: result.cutoff.toISOString(),
  });
}
