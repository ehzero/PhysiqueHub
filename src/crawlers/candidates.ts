import type { CrawlOrganizationId } from "./config";
import type { CrawlerResult } from "./types";
import { fetchHtml } from "./utils";

const KISMOS_KCL_URL = "https://kismos.co.kr/product/list.html?cate_no=822";

const KCLASSIC_RELATED_ORGANIZATIONS = [
  {
    id: "j-classic",
    name: "J-Classic",
    warning:
      "K-Classic/KISMOS 계열 소스로 감시 중이나 현재 공개 HTML에서 J-Classic 2026 일정 상품은 확인되지 않았습니다.",
  },
  {
    id: "ssa-korea",
    name: "SSA Korea",
    warning:
      "K-Classic/KISMOS 계열 소스로 감시 중이나 현재 공개 HTML에서 SSA Korea 2026 일정 상품은 확인되지 않았습니다.",
  },
  {
    id: "wff-korea",
    name: "WFF Korea",
    warning:
      "K-Classic/KISMOS 계열 소스로 감시 중이나 현재 공개 HTML에서 WFF Korea 2026 일정 상품은 확인되지 않았습니다.",
  },
] as const satisfies ReadonlyArray<{
  id: CrawlOrganizationId;
  name: string;
  warning: string;
}>;

export async function crawlKclassicRelatedCandidates(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  const selectedIds = new Set(selectedOrganizationIds ?? []);
  const organizations = KCLASSIC_RELATED_ORGANIZATIONS.filter(
    (organization) => selectedIds.size === 0 || selectedIds.has(organization.id),
  );

  if (organizations.length === 0) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const { html, fetchedAt } = await fetchHtml(KISMOS_KCL_URL);
    const foundTerms = {
      jClassic: /J[-\s]?Classic|제이클래식/i.test(html),
      ssa: /\bSSA\s*Korea\b|에스에스에이/i.test(html),
      wff: /\bWFF\s*Korea\b|더블유에프에프/i.test(html),
    };

    for (const organization of organizations) {
      sources.push({
        organizationId: organization.id,
        organizationName: organization.name,
        url: KISMOS_KCL_URL,
        ok: true,
        count: 0,
        warnings: [
          organization.warning,
          `현재 키워드 감지 결과: J-Classic=${foundTerms.jClassic}, SSA Korea=${foundTerms.ssa}, WFF Korea=${foundTerms.wff}`,
          "KISMOS 2026 KCL 상품 카테고리는 K-Classic 수집에는 유효하지만 이 후보들의 일정 이벤트로 정규화할 상품은 아직 없습니다.",
        ],
        fetchedAt,
      });
    }
  } catch (error) {
    const message = getErrorMessage(error);
    errors.push({ url: KISMOS_KCL_URL, message });

    for (const organization of organizations) {
      sources.push({
        organizationId: organization.id,
        organizationName: organization.name,
        url: KISMOS_KCL_URL,
        ok: false,
        count: 0,
        warnings: [`${organization.name} 후보 감시용 KISMOS fetch에 실패했습니다.`],
      });
    }
  }

  return { sources, events: [], errors };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
