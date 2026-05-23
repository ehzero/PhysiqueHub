import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = `${SITE_NAME} 공유 이미지`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f3ea",
          color: "#111111",
          padding: "72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            letterSpacing: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: "#111111",
              }}
            />
            <span style={{ fontWeight: 700 }}>{SITE_NAME}</span>
          </div>
          <span style={{ color: "#6b665b" }}>SCHEDULE HUB</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              width: 92,
              height: 6,
              background: "#111111",
            }}
          />
          <h1
            style={{
              margin: 0,
              maxWidth: 920,
              fontSize: 86,
              lineHeight: 1.04,
              letterSpacing: 0,
              fontWeight: 800,
            }}
          >
            보디빌딩 대회 일정과 접수 마감을 한곳에서
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: 820,
              fontSize: 30,
              lineHeight: 1.45,
              color: "#3f3a33",
            }}
          >
            {SITE_DESCRIPTION}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#6b665b",
          }}
        >
          <span>{SITE_TAGLINE}</span>
          <span>IFBB · NABBA · KBBF · WNBF · PCA</span>
        </div>
      </div>
    ),
    size,
  );
}
