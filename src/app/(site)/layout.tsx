import Script from "next/script";
import { SiteShell } from "@/components/SiteShell";
import { getKoreaYear } from "@/lib/date";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="kakao-adfit-script"
        src="https://t1.kakaocdn.net/kas/static/ba.min.js"
        strategy="afterInteractive"
      />
      <SiteShell seasonYear={getKoreaYear()}>{children}</SiteShell>
    </>
  );
}
