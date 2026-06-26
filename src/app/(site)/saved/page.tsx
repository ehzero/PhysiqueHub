import { SavedShell } from "@/components/SavedShell";
import { getCompetitionSeasonPage } from "@/lib/competition-server";
import { getKoreaDateParam, getKoreaYear } from "@/lib/date";
import { createPageMetadata } from "@/lib/metadata";

export const revalidate = 86_400;

export const metadata = {
  ...createPageMetadata({
    title: "내 대회",
    description:
      "관심 있는 피트니스·보디빌딩 대회를 저장하고 시즌 일정을 관리하세요.",
    path: "/saved",
  }),
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SavedPage() {
  const today = getKoreaDateParam();
  const seasonYear = getKoreaYear();
  const competitionPage = await getCompetitionSeasonPage(seasonYear, {
    startsFrom: today,
    sort: "date-asc",
  });

  return (
    <SavedShell
      competitions={competitionPage.items}
      initialToday={today}
    />
  );
}
