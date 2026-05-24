import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompetitionLandingList } from "@/components/CompetitionLandingList";
import {
  getCompetitionLandingContext,
  type CompetitionLandingContext,
} from "@/lib/competition-server";
import {
  getCompetitionLandingPath,
  type CompetitionLandingAxis,
} from "@/lib/competition-taxonomy";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

interface CompetitionLandingPageProps {
  axis: CompetitionLandingAxis;
  slug: string;
}

export async function generateCompetitionLandingMetadata({
  axis,
  slug,
}: CompetitionLandingPageProps): Promise<Metadata> {
  const context = await getCompetitionLandingContext(axis, slug);

  if (!context) {
    notFound();
  }

  const { taxon, path, isIndexable } = context;
  const fullTitle = `${taxon.title} - ${SITE_NAME}`;

  return {
    title: taxon.title,
    description: taxon.description,
    alternates: {
      canonical: path,
    },
    robots: {
      index: isIndexable,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: path,
      siteName: SITE_NAME,
      title: fullTitle,
      description: taxon.description,
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
      description: taxon.description,
      images: ["/twitter-image"],
    },
  };
}

export async function CompetitionLandingPage({
  axis,
  slug,
}: CompetitionLandingPageProps) {
  const context = await getCompetitionLandingContext(axis, slug);

  if (!context) {
    notFound();
  }

  return <CompetitionLandingView context={context} />;
}

function CompetitionLandingView({
  context,
}: {
  context: CompetitionLandingContext;
}) {
  const { taxon, competitions, total, relatedTaxons, seasonYear } =
    context;
  const breadcrumbJsonLd = getBreadcrumbJsonLd(context);
  const itemListJsonLd = total > 0 ? getItemListJsonLd(context) : null;
  const countLabel = total.toLocaleString("ko-KR");
  const subjectLabel = getSubjectLabel(context);

  return (
    <main className="competition-landing">
      <StructuredData data={breadcrumbJsonLd} />
      {itemListJsonLd && <StructuredData data={itemListJsonLd} />}

      <section className="competition-landing-hero">
        <div className="container">
          <Breadcrumb context={context} />

          <div className="competition-landing-hero-grid">
            <div>
              <div className="hub-eyebrow" style={{ color: "#B85C3C" }}>
                {seasonYear} 시즌
              </div>
              <h1 className="competition-landing-title">{taxon.h1}</h1>
              <p className="competition-landing-intro">{taxon.intro}</p>
              <div className="competition-landing-actions">
                <Link
                  className="cta-btn"
                  href={taxon.filterHref}
                  prefetch={false}
                >
                  전체 목록에서 조건 더 보기
                </Link>
              </div>
            </div>

            <div className="competition-landing-stat">
              <small>예정 대회</small>
              <strong>{countLabel}</strong>
              <span>앞으로 열릴 일정</span>
            </div>
          </div>
        </div>
      </section>

      <section className="competition-list-section competition-landing-results">
        <div className="container">
          <div className="competition-section-head">
            <div>
              <div className="hub-eyebrow" style={{ color: "#B85C3C" }}>
                Upcoming
              </div>
              <h2 className="hub-h2">예정 대회 목록</h2>
              <p className="hub-section-body" style={{ color: "#86827C" }}>
                {getListIntro(context)}
              </p>
            </div>
            <div className="competition-result-count">
              <small>{`총 ${countLabel}개 일정`}</small>
              <span>{countLabel}</span>
            </div>
          </div>

          {competitions.length > 0 ? (
            <CompetitionLandingList competitions={competitions} />
          ) : (
            <div className="competition-landing-empty">
              <p className="eyebrow">No upcoming competitions</p>
              <h2>{`현재 예정된 ${subjectLabel} 일정이 없습니다.`}</h2>
              <p>
                새 일정이 확인되면 이 페이지에 반영됩니다. 전체 목록에서 다른
                조건을 함께 확인해보세요.
              </p>
              <Link className="cta-btn" href="/competitions" prefetch={false}>
                전체 대회 목록 보기
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="competition-landing-related">
        <div className="container">
          <div className="competition-section-head">
            <div>
              <div className="hub-eyebrow" style={{ color: "#B85C3C" }}>
                Related
              </div>
              <h2 className="hub-h2">함께 보면 좋은 일정</h2>
            </div>
          </div>
          <div className="competition-landing-link-grid">
            {relatedTaxons.map((related) => (
              <Link
                key={`${related.axis}:${related.slug}`}
                className="competition-landing-link"
                href={getCompetitionLandingPath(related)}
                prefetch={false}
              >
                <span>{related.shortLabel ?? related.label}</span>
                <small>{related.title}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function getSubjectLabel(context: CompetitionLandingContext) {
  const { taxon } = context;

  if (taxon.axis === "organization") {
    return `${taxon.label} 대회`;
  }

  if (taxon.axis === "region") {
    return `${taxon.label} 지역 대회`;
  }

  if (taxon.axis === "type") {
    return `${taxon.label} 성격의 대회`;
  }

  return `${taxon.shortLabel ?? taxon.label} 대회`;
}

function getListIntro(context: CompetitionLandingContext) {
  const { taxon } = context;

  if (taxon.axis === "organization") {
    return `가까운 날짜순으로 예정된 ${taxon.label} 계열 대회를 확인해보세요.`;
  }

  if (taxon.axis === "region") {
    return `${taxon.label}에서 가까운 날짜순으로 예정된 보디빌딩·피트니스 대회를 확인해보세요.`;
  }

  if (taxon.axis === "type") {
    return `가까운 날짜순으로 예정된 ${taxon.label} 성격의 대회를 확인해보세요.`;
  }

  return `가까운 날짜순으로 예정된 ${taxon.shortLabel ?? taxon.label} 대회를 확인해보세요.`;
}

function Breadcrumb({ context }: { context: CompetitionLandingContext }) {
  return (
    <nav className="competition-breadcrumb" aria-label="Breadcrumb">
      <Link href="/" prefetch={false}>
        홈
      </Link>
      <span>/</span>
      <Link href="/competitions" prefetch={false}>
        대회 목록
      </Link>
      <span>/</span>
      <span>{context.taxon.label}</span>
    </nav>
  );
}

function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
      type="application/ld+json"
    />
  );
}

function getBreadcrumbJsonLd(context: CompetitionLandingContext) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "대회 목록",
        item: `${siteUrl}/competitions`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: context.taxon.label,
        item: `${siteUrl}${context.path}`,
      },
    ],
  };
}

function getItemListJsonLd(context: CompetitionLandingContext) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: context.taxon.title,
    itemListElement: context.competitions.map((competition, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/competitions/${encodeURIComponent(competition.id)}`,
      name: competition.title,
    })),
  };
}
