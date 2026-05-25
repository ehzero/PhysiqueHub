import type { Metadata } from "next";
import {
  OPEN_GRAPH_IMAGE_URL,
  SHARE_IMAGE_ALT,
  SITE_DESCRIPTION,
  SITE_NAME,
  TWITTER_IMAGE_URL,
} from "@/lib/site";

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
          url: OPEN_GRAPH_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: SHARE_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [TWITTER_IMAGE_URL],
    },
  };
}
