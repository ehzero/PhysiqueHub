import { SavedShell } from "@/components/SavedShell";
import { getCompetitionSeasonPage } from "@/lib/competition-server";
import { getKoreaYear } from "@/lib/date";
import { createPageMetadata } from "@/lib/metadata";

export const revalidate = 86_400;

export const metadata = {
  ...createPageMetadata({
    title: "내 대회",
    description:
      "관심 있는 보디빌딩·피트니스 대회를 저장하고 시즌 일정을 관리하세요.",
    path: "/saved",
  }),
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SavedPage() {
  const seasonYear = getKoreaYear();
  const competitionPage = await getCompetitionSeasonPage(seasonYear, {
    sort: "date-asc",
  });

  return (
    <SavedShell
      seasonYear={seasonYear}
      competitions={competitionPage.items}
    />
  );
}
