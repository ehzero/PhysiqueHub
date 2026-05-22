import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

interface PageMetadataInput {
  title: string;
  description?: string;
  path: string;
}

export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
}: PageMetadataInput): Metadata {
  const fullTitle = `${title} - ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: path,
      siteName: SITE_NAME,
      title: fullTitle,
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
      title: fullTitle,
      description,
      images: ["/twitter-image"],
    },
  };
}
