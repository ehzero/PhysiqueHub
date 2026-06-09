import Script from "next/script";
import { SiteShell } from "@/components/SiteShell";
import {
  KAKAO_ADFIT_SCRIPT_SRC,
  KAKAO_ADS_ENABLED,
} from "@/lib/kakao-adfit";
import { getKoreaYear } from "@/lib/date";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {KAKAO_ADS_ENABLED && (
        <Script
          id="kakao-adfit-script"
          src={KAKAO_ADFIT_SCRIPT_SRC}
          strategy="afterInteractive"
        />
      )}
      <SiteShell seasonYear={getKoreaYear()}>{children}</SiteShell>
    </>
  );
}
