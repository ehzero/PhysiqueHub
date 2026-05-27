import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "@/lib/site";

export const runtime = "edge";

const ACCENT = "#B85C3C";
const INK = "#0E0E0C";
const PAPER = "#F7F5F0";
const ORGANIZATIONS = [
  "IFBB Pro",
  "NPC/IFBB Pro",
  "KBBF",
  "NABBA",
  "PCA",
  "NPCA",
  "WNBF",
  "Musclemania",
] as const;
const OTHER_ORGANIZATION_COUNT = 9;

export function GET() {
  const seasonYear = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
  })
    .format(new Date())
    .replace(/\D/g, "");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: PAPER,
        color: INK,
        fontFamily: "Arial, sans-serif",
        padding: 64,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: ACCENT,
              display: "flex",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 0,
              marginBottom: 22,
            }}
          >
            ● {seasonYear} 시즌 · Asia/Seoul
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              lineHeight: 1.18,
              letterSpacing: 0,
              fontWeight: 900,
              width: 960,
            }}
          >
            <div style={{ display: "flex", whiteSpace: "nowrap" }}>
              국내 보디빌딩·피트니스
            </div>
            <div style={{ display: "flex", gap: 18 }}>
              <span>대회 일정을</span>
              <span style={{ color: ACCENT }}>한눈에.</span>
            </div>
          </div>
          <p
            style={{
              margin: "28px 0 0",
              maxWidth: 880,
              fontSize: 26,
              lineHeight: 1.55,
              color: "#3A3833",
            }}
          >
            {SITE_DESCRIPTION}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          color: "#2D2925",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 0,
        }}
      >
        <div style={{ display: "flex", color: ACCENT, fontSize: 18 }}>
          주요 단체
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {ORGANIZATIONS.map((organization) => (
            <span key={organization}>{organization}</span>
          ))}
          <span>외 {OTHER_ORGANIZATION_COUNT}개</span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
