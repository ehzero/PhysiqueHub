import type { Metadata } from "next";
import { ListShell } from "@/components/ListShell";
import { getUpcomingCompetitionContext } from "@/lib/competition-server";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 86_400;

interface CompetitionModalPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CompetitionModalPageProps): Promise<Metadata> {
  const id = decodeURIComponent((await params).id);
  const { competitionPage } = await getUpcomingCompetitionContext();
  const competition = competitionPage.items.find((item) => item.id === id);

  if (!competition) {
    return {
      title: `대회 목록 - ${SITE_NAME}`,
      alternates: {
        canonical: "/competitions",
      },
    };
  }

  const description = `${competition.org} 주최 ${competition.title} 일정, 장소, 접수 정보를 확인하세요.`;
  const path = `/competitions/${encodeURIComponent(competition.id)}`;

  return {
    title: `${competition.title} - ${SITE_NAME}`,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: path,
      siteName: SITE_NAME,
      title: `${competition.title} - ${SITE_NAME}`,
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} 공유 이미지`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${competition.title} - ${SITE_NAME}`,
      description,
      images: ["/twitter-image"],
    },
  };
}

export default async function CompetitionModalPage({
  params,
}: CompetitionModalPageProps) {
  const id = decodeURIComponent((await params).id);
  const { seasonYear, competitionPage, filterOptions } =
    await getUpcomingCompetitionContext({ includeFilters: true });

  return (
    <ListShell
      seasonYear={seasonYear}
      initialCompetitionPage={competitionPage}
      initialFilterOptions={filterOptions!}
      initialOpenedCompetitionId={id}
    />
  );
}
