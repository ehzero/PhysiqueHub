import type { Metadata } from "next";
import {
  CompetitionLandingPage,
  generateCompetitionLandingMetadata,
} from "@/components/CompetitionLandingPage";
import { getCompetitionLandingStaticParams } from "@/lib/competition-taxonomy";

export const revalidate = 86_400;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getCompetitionLandingStaticParams("type");
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  return generateCompetitionLandingMetadata({
    axis: "type",
    slug: (await params).slug,
  });
}

export default async function TypeLandingPage({ params }: PageProps) {
  return <CompetitionLandingPage axis="type" slug={(await params).slug} />;
}
