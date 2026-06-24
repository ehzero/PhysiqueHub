import { SiteShell } from "@/components/SiteShell";
import { getKoreaYear } from "@/lib/date";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell seasonYear={getKoreaYear()}>{children}</SiteShell>;
}
