import type {
  CompetitionSchedule,
  ContactAttachment,
  ContactInquiry,
} from "@prisma/client";
import Link from "next/link";
import { hasAdminSession, isAdminPasswordConfigured } from "@/lib/admin-auth";
import {
  getAnalyticsSummaryForRange,
  getCompetitionFunnel,
  parseAnalyticsSegment,
  type AnalyticsMetric,
  type AnalyticsSegment,
  type AnalyticsSummary,
  type AnalyticsTableRow,
  type CompetitionFunnel,
} from "@/lib/admin-analytics";
import { prisma } from "@/lib/prisma";
import { Sparkline } from "./AnalyticsCharts";
import { LiveFeed } from "./LiveFeed";
import { loginAdmin, logoutAdmin, updateCompetitionReview } from "./actions";

export type AdminSection = "analytics" | "contact" | "review";

export type AdminPageProps = {
  searchParams?: Promise<{
    error?: string;
    id?: string;
    status?: string;
    confidence?: string;
    org?: string;
    issue?: string;
    analyticsRange?: string;
    from?: string;
    to?: string;
    seg?: string;
    comp?: string;
  }>;
};

const REVIEW_STATUSES = ["needs-review", "approved", "rejected", "pending"] as const;
const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
const REGISTRATION_STATUSES = ["unknown", "scheduled", "open", "closing-soon", "closed", "cancelled"] as const;
const ISSUE_FILTERS = ["date", "location", "registration", "low-confidence"] as const;
const ANALYTICS_RANGES = ["today", "7d", "30d", "custom"] as const;
type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

function getErrorMessage(error?: string) {
  if (error === "missing-config") {
    return "ADMIN_PASSWORD 환경변수가 설정되어 있지 않습니다.";
  }

  if (error === "invalid-password") {
    return "비밀번호가 일치하지 않습니다.";
  }

  return null;
}

export function AdminLogin({ error }: { error?: string }) {
  const configured = isAdminPasswordConfigured();
  const message = configured
    ? getErrorMessage(error)
    : getErrorMessage("missing-config");

  return (
    <main className="ac-gate">
      <section className="ac-login" aria-labelledby="ac-login-title">
        <div className="ac-brand">
          <span className="ac-brand-dot" />
          <span className="ac-brand-name">PhysiqueHub</span>
        </div>
        <div>
          <p className="ac-cap">Restricted</p>
          <h1 className="ac-login-title" id="ac-login-title">관리자 로그인</h1>
        </div>

        <form action={loginAdmin} className="ac-login-form">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            disabled={!configured}
            required
          />
          {message && <p className="ac-login-error">{message}</p>}
          <button className="ac-btn primary block" disabled={!configured} type="submit">
            관리자 입장
          </button>
        </form>
      </section>
    </main>
  );
}

async function AdminDashboard({
  activeSection,
  selectedId,
  statusFilter,
  confidenceFilter,
  organizationFilter,
  issueFilter,
  analyticsRange,
  analyticsFrom,
  analyticsTo,
  analyticsComp,
  analyticsSeg,
}: {
  activeSection: AdminSection;
  selectedId?: string;
  statusFilter?: string;
  confidenceFilter?: string;
  organizationFilter?: string;
  issueFilter?: string;
  analyticsRange?: string;
  analyticsFrom?: string;
  analyticsTo?: string;
  analyticsComp?: string;
  analyticsSeg?: string;
}) {
  const seasonYear = new Date().getFullYear();
  const selectedAnalyticsRange = toAnalyticsRange(analyticsRange);
  const analyticsWindow = getAnalyticsWindow(selectedAnalyticsRange, analyticsFrom, analyticsTo);
  const analyticsSegment = toAnalyticsSegment(analyticsSeg);
  const competitionFunnel =
    activeSection === "analytics" && analyticsComp
      ? await getCompetitionFunnel(analyticsComp, analyticsWindow.start, analyticsWindow.end)
      : null;
  const queueWhere = getQueueWhere(
    seasonYear,
    statusFilter,
    confidenceFilter,
    organizationFilter,
    issueFilter,
  );
  const [
    totalCount,
    needsReviewCount,
    approvedCount,
    lowDateCount,
    missingCoreCount,
    newContactCount,
    organizationRows,
    queue,
    contactInquiries,
    analyticsSummary,
  ] =
    await Promise.all([
      prisma.competitionSchedule.count({ where: { seasonYear } }),
      prisma.competitionSchedule.count({ where: { seasonYear, reviewStatus: "needs-review" } }),
      prisma.competitionSchedule.count({ where: { seasonYear, reviewStatus: "approved" } }),
      prisma.competitionSchedule.count({
        where: { seasonYear, OR: [{ dateStartsOn: null }, { dateConfidence: "low" }] },
      }),
      prisma.competitionSchedule.count({
        where: {
          seasonYear,
          OR: [
            { dateStartsOn: null },
            { locationRawText: null, venue: null },
            { registrationUrl: null },
            { confidence: "low" },
          ],
        },
      }),
      prisma.contactInquiry.count({ where: { status: "new" } }),
      prisma.competitionSchedule.findMany({
        where: { seasonYear },
        select: {
          organizationId: true,
          organizationName: true,
          reviewStatus: true,
        },
        orderBy: [{ organizationName: "asc" }],
      }),
      prisma.competitionSchedule.findMany({
        where: queueWhere,
        orderBy: [{ reviewStatus: "desc" }, { confidence: "asc" }, { dateStartsOn: "asc" }, { title: "asc" }],
      }),
      prisma.contactInquiry.findMany({
        include: {
          attachments: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      getAnalyticsSummaryForRange(analyticsWindow.start, analyticsWindow.end, analyticsSegment),
    ]);
  const selectedCompetition =
    (selectedId
      ? await prisma.competitionSchedule.findUnique({ where: { id: selectedId } })
      : null) ??
    queue[0] ??
    null;
  const qualityIssues = selectedCompetition
    ? parseJsonArray<QualityIssue>(selectedCompetition.qualityIssuesJson)
    : [];
  const divisions = selectedCompetition
    ? parseJsonArray<{ name?: string; group?: string }>(selectedCompetition.divisionsJson)
    : [];
  const missingFields = selectedCompetition ? getMissingFields(selectedCompetition) : [];
  const organizationSummaries = getOrganizationSummaries(organizationRows);
  const queueGroups = groupCompetitionsByOrganization(queue);
  const selectedQueueIndex = selectedCompetition
    ? queue.findIndex((competition) => competition.id === selectedCompetition.id)
    : -1;
  const nextCompetition =
    selectedQueueIndex >= 0 ? queue[selectedQueueIndex + 1] ?? null : queue[0] ?? null;
  const nextCompetitionHref = nextCompetition
    ? getAdminHref({
        analyticsRange: selectedAnalyticsRange,
        statusFilter,
        confidenceFilter,
        organizationFilter,
        issueFilter,
        id: nextCompetition.id,
      })
    : getAdminHref({
        analyticsRange: selectedAnalyticsRange,
        statusFilter,
        confidenceFilter,
        organizationFilter,
        issueFilter,
      });
  const selectedHealth = selectedCompetition ? getReviewHealth(selectedCompetition) : null;

  return (
    <>
      <header className="ac-bar">
        <div className="ac-brand">
          <span className="ac-brand-dot" />
          <span className="ac-brand-name">PhysiqueHub</span>
        </div>

        <nav className="ac-nav" aria-label="어드민 섹션">
          <AdminNavItem href="/admin/analytics" active={activeSection === "analytics"}>
            분석
          </AdminNavItem>
          <AdminNavItem
            href="/admin/review"
            active={activeSection === "review"}
            count={needsReviewCount}
          >
            데이터 검수
          </AdminNavItem>
          <AdminNavItem
            href="/admin/contact"
            active={activeSection === "contact"}
            count={newContactCount}
          >
            문의
          </AdminNavItem>
        </nav>

        <div className="ac-bar-right">
          {activeSection === "analytics" && (
            <div className="ac-seg" role="group" aria-label="분석 기간">
              {ANALYTICS_RANGES.map((value) => (
                <AdminTab
                  active={selectedAnalyticsRange === value}
                  href={getAdminAnalyticsHref(value)}
                  key={value}
                >
                  {toAnalyticsRangeLabel(value)}
                </AdminTab>
              ))}
            </div>
          )}
          <form action={logoutAdmin}>
            <button className="ac-btn sm" type="submit">
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <main className="ac-main">
        {activeSection === "analytics" && (
          <AnalyticsDashboardSection
            analytics={analyticsSummary}
            competitionFunnel={competitionFunnel}
            from={analyticsFrom}
            range={selectedAnalyticsRange}
            segment={analyticsSegment}
            to={analyticsTo}
          />
        )}

        {activeSection === "review" && (
          <>
            <section className="ac-kpis" aria-label="대회 운영 지표">
              <div className="ac-kpi">
                <span className="ac-kpi-value">{totalCount}</span>
                <span className="ac-kpi-label">전체 일정</span>
              </div>
              <div className="ac-kpi">
                <span className="ac-kpi-value">{needsReviewCount}</span>
                <span className="ac-kpi-label">검수 대기</span>
              </div>
              <div className="ac-kpi">
                <span className="ac-kpi-value">{approvedCount}</span>
                <span className="ac-kpi-label">승인 완료</span>
              </div>
              <div className="ac-kpi">
                <span className="ac-kpi-value">{lowDateCount}</span>
                <span className="ac-kpi-label">날짜 확인 필요</span>
              </div>
              <div className="ac-kpi">
                <span className="ac-kpi-value">{missingCoreCount}</span>
                <span className="ac-kpi-label">핵심 누락</span>
              </div>
            </section>

            <div className="ac-filters" aria-label="검수 필터">
              <div className="ac-seg" role="group" aria-label="검수 상태">
                <AdminTab
                  href={getAdminHref({
                    analyticsRange: selectedAnalyticsRange,
                    confidenceFilter,
                    organizationFilter,
                    issueFilter,
                  })}
                  active={!statusFilter || statusFilter === "open"}
                >
                  검수 필요
                </AdminTab>
                <AdminTab
                  href={getAdminHref({
                    analyticsRange: selectedAnalyticsRange,
                    statusFilter: "all",
                    confidenceFilter,
                    organizationFilter,
                    issueFilter,
                  })}
                  active={statusFilter === "all"}
                >
                  전체
                </AdminTab>
                <AdminTab
                  href={getAdminHref({
                    analyticsRange: selectedAnalyticsRange,
                    statusFilter: "approved",
                    confidenceFilter,
                    organizationFilter,
                    issueFilter,
                  })}
                  active={statusFilter === "approved"}
                >
                  승인됨
                </AdminTab>
              </div>

              <span className="ac-divider" aria-hidden="true" />
              <span className="ac-flabel">신뢰도</span>
              <div className="ac-seg" role="group" aria-label="신뢰도 필터">
                <AdminTab
                  href={getAdminHref({
                    analyticsRange: selectedAnalyticsRange,
                    statusFilter,
                    organizationFilter,
                    issueFilter,
                  })}
                  active={!isConfidenceFilter(confidenceFilter)}
                >
                  전체
                </AdminTab>
                {CONFIDENCE_LEVELS.map((value) => (
                  <AdminTab
                    active={confidenceFilter === value}
                    href={getAdminHref({
                      analyticsRange: selectedAnalyticsRange,
                      statusFilter,
                      confidenceFilter: value,
                      organizationFilter,
                      issueFilter,
                    })}
                    key={value}
                  >
                    {toConfidenceShort(value)}
                  </AdminTab>
                ))}
              </div>

              <span className="ac-divider" aria-hidden="true" />
              <span className="ac-flabel">이슈</span>
              <div className="ac-seg" role="group" aria-label="문제 유형 필터">
                <AdminTab
                  href={getAdminHref({
                    analyticsRange: selectedAnalyticsRange,
                    statusFilter,
                    confidenceFilter,
                    organizationFilter,
                  })}
                  active={!isIssueFilter(issueFilter)}
                >
                  전체
                </AdminTab>
                {ISSUE_FILTERS.map((value) => (
                  <AdminTab
                    active={issueFilter === value}
                    href={getAdminHref({
                      analyticsRange: selectedAnalyticsRange,
                      statusFilter,
                      confidenceFilter,
                      organizationFilter,
                      issueFilter: value,
                    })}
                    key={value}
                  >
                    {toIssueFilterLabel(value)}
                  </AdminTab>
                ))}
              </div>
            </div>

            <div className="ac-chiprow" aria-label="단체 필터">
              <AdminTab
                variant="chip"
                href={getAdminHref({
                  analyticsRange: selectedAnalyticsRange,
                  statusFilter,
                  confidenceFilter,
                  issueFilter,
                })}
                active={!organizationFilter}
              >
                전체 단체
              </AdminTab>
              {organizationSummaries.map((summary) => (
                <AdminTab
                  variant="chip"
                  active={organizationFilter === summary.organizationId}
                  href={getAdminHref({
                    analyticsRange: selectedAnalyticsRange,
                    statusFilter,
                    confidenceFilter,
                    issueFilter,
                    organizationFilter: summary.organizationId,
                  })}
                  key={summary.organizationId}
                >
                  {summary.organizationName} {summary.needsReviewCount}/{summary.totalCount}
                </AdminTab>
              ))}
            </div>

            <div className="ac-review">
              <div className="ac-queue">
                {queueGroups.map((group) => (
                  <section className="ac-org" key={group.organizationId}>
                    <div className="ac-org-head">
                      <div>
                        <span className="ac-org-name">{group.organizationName}</span>
                        <span className="ac-org-meta">
                          {group.items.length}개 · 검수 {group.needsReviewCount} · 승인 {group.approvedCount}
                        </span>
                      </div>
                      <ProgressBar current={group.approvedCount} total={group.items.length} />
                    </div>
                    {group.items.map((competition) => {
                      const fieldProblems = getMissingFields(competition);
                      const isSelected = selectedCompetition?.id === competition.id;

                      return (
                        <Link
                          className={`ac-queue-item ${isSelected ? "is-active" : ""}`}
                          href={getAdminHref({
                            analyticsRange: selectedAnalyticsRange,
                            statusFilter,
                            confidenceFilter,
                            organizationFilter,
                            issueFilter,
                            id: competition.id,
                          })}
                          key={competition.id}
                        >
                          <span className="ac-queue-title">{competition.title}</span>
                          <span className="ac-queue-meta">
                            {competition.dateStartsOn ? formatKoreaDate(competition.dateStartsOn) : "날짜 없음"} · {competition.venue ?? competition.locationRawText ?? "장소 없음"}
                          </span>
                          <span className="ac-badges">
                            <ReviewBadge value={competition.reviewStatus} />
                            <ConfidenceBadge value={competition.confidence} />
                            {fieldProblems.length > 0 && <span className="ac-badge warn">{fieldProblems.length}개 확인</span>}
                          </span>
                        </Link>
                      );
                    })}
                  </section>
                ))}
              </div>

              <div className="ac-editor">
                {selectedCompetition ? (
                  <form action={updateCompetitionReview} className="ac-editor-form">
                    <input name="id" type="hidden" value={selectedCompetition.id} />
                    <input name="redirectTo" type="hidden" value={getAdminHref({
                      analyticsRange: selectedAnalyticsRange,
                      statusFilter,
                      confidenceFilter,
                      organizationFilter,
                      issueFilter,
                      id: selectedCompetition.id,
                    })} />
                    <input name="nextRedirectTo" type="hidden" value={nextCompetitionHref} />

                    <div className="ac-editor-head">
                      <div className="ac-editor-id">
                        <span className="ac-flabel">{selectedCompetition.organizationName}</span>
                        <span className="ac-editor-title">{selectedCompetition.title}</span>
                      </div>
                      <div className="ac-actions">
                        <button className="ac-btn" name="intent" type="submit" value="save">
                          저장
                        </button>
                        <button className="ac-btn" name="intent" type="submit" value="approve-next">
                          승인 후 다음
                        </button>
                        <button className="ac-btn primary" name="intent" type="submit" value="approve">
                          승인
                        </button>
                      </div>
                    </div>

                    <div className="ac-source">
                      <a href={selectedCompetition.sourceUrl} rel="noreferrer" target="_blank">
                        목록 원본
                      </a>
                      {selectedCompetition.detailUrl && (
                        <a href={selectedCompetition.detailUrl} rel="noreferrer" target="_blank">
                          상세 원본
                        </a>
                      )}
                      {selectedCompetition.registrationUrl && (
                        <a href={selectedCompetition.registrationUrl} rel="noreferrer" target="_blank">
                          접수 URL
                        </a>
                      )}
                    </div>

                    {(missingFields.length > 0 || qualityIssues.length > 0) && (
                      <div className="ac-alerts">
                        {missingFields.map((field) => (
                          <span className="ac-badge warn" key={field}>{field}</span>
                        ))}
                        {qualityIssues.map((issue, index) => (
                          <span className="ac-badge subtle" key={`${issue.field}-${index}`}>
                            {issue.field}: {issue.message}
                          </span>
                        ))}
                      </div>
                    )}

                    {selectedHealth && (
                      <section className="ac-check" aria-label="검수 체크리스트">
                        <div className="ac-check-head">
                          <div>
                            <span className="ac-cap">Check</span>
                            <strong>{selectedHealth.readyCount}/{selectedHealth.items.length} 핵심 항목 확인</strong>
                          </div>
                          <ProgressBar
                            current={selectedHealth.readyCount}
                            total={selectedHealth.items.length}
                          />
                        </div>
                        <div className="ac-check-grid">
                          {selectedHealth.items.map((item) => (
                            <div className={`ac-check-card ${item.ok ? "is-ok" : "needs-work"}`} key={item.label}>
                              <span>{item.label}</span>
                              <strong>{item.value}</strong>
                              <small>{item.ok ? "확인됨" : item.reason}</small>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <div className="ac-fields">
                      <label className="span-4">
                        <span>대회명</span>
                        <input name="title" defaultValue={selectedCompetition.title} />
                      </label>
                      <label>
                        <span>개최일</span>
                        <input name="dateStartsOn" type="date" defaultValue={formatInputDate(selectedCompetition.dateStartsOn)} />
                      </label>
                      <label>
                        <span>종료일</span>
                        <input name="dateEndsOn" type="date" defaultValue={formatInputDate(selectedCompetition.dateEndsOn)} />
                      </label>
                      <label>
                        <span>날짜 신뢰도</span>
                        <select name="dateConfidence" defaultValue={selectedCompetition.dateConfidence}>
                          {CONFIDENCE_LEVELS.map((value) => <option key={value} value={value}>{toConfidenceLabel(value)}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>전체 신뢰도</span>
                        <select name="confidence" defaultValue={selectedCompetition.confidence}>
                          {CONFIDENCE_LEVELS.map((value) => <option key={value} value={value}>{toConfidenceLabel(value)}</option>)}
                        </select>
                      </label>
                      <label className="span-2">
                        <span>원문 날짜</span>
                        <input name="dateRawText" defaultValue={selectedCompetition.dateRawText ?? ""} />
                      </label>
                      <label>
                        <span>지역</span>
                        <input name="region" defaultValue={selectedCompetition.region ?? ""} />
                      </label>
                      <label>
                        <span>도시</span>
                        <input name="city" defaultValue={selectedCompetition.city ?? ""} />
                      </label>
                      <label className="span-2">
                        <span>장소</span>
                        <input name="venue" defaultValue={selectedCompetition.venue ?? ""} />
                      </label>
                      <label className="span-2">
                        <span>장소 원문</span>
                        <input name="locationRawText" defaultValue={selectedCompetition.locationRawText ?? ""} />
                      </label>
                      <label>
                        <span>장소 신뢰도</span>
                        <select name="locationConfidence" defaultValue={selectedCompetition.locationConfidence}>
                          {CONFIDENCE_LEVELS.map((value) => <option key={value} value={value}>{toConfidenceLabel(value)}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>접수 상태</span>
                        <select name="registrationStatus" defaultValue={selectedCompetition.registrationStatus}>
                          {REGISTRATION_STATUSES.map((value) => <option key={value} value={value}>{toRegistrationLabel(value)}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>접수 마감</span>
                        <input name="registrationClosesAt" type="date" defaultValue={formatInputDate(selectedCompetition.registrationClosesAt)} />
                      </label>
                      <label>
                        <span>접수 신뢰도</span>
                        <select name="registrationConfidence" defaultValue={selectedCompetition.registrationConfidence}>
                          {CONFIDENCE_LEVELS.map((value) => <option key={value} value={value}>{toConfidenceLabel(value)}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>참가비</span>
                        <input inputMode="numeric" name="feeMinAmount" defaultValue={selectedCompetition.feeMinAmount ?? ""} />
                      </label>
                      <label className="span-2">
                        <span>접수 URL</span>
                        <input name="registrationUrl" defaultValue={selectedCompetition.registrationUrl ?? ""} />
                      </label>
                      <label>
                        <span>검수 상태</span>
                        <select name="reviewStatus" defaultValue={selectedCompetition.reviewStatus}>
                          {REVIEW_STATUSES.map((value) => <option key={value} value={value}>{toReviewLabel(value)}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>종목 수</span>
                        <input readOnly value={`${divisions.length}개`} />
                      </label>
                      <label className="span-3">
                        <span>검수 메모</span>
                        <textarea name="notes" defaultValue={selectedCompetition.notes ?? ""} rows={3} />
                      </label>
                    </div>

                    <details className="ac-raw">
                      <summary>원본 파싱 값 보기</summary>
                      <dl>
                        <dt>Parser</dt>
                        <dd>{selectedCompetition.parserName ?? "-"}</dd>
                        <dt>Raw title</dt>
                        <dd>{selectedCompetition.rawTitle ?? "-"}</dd>
                        <dt>Raw date</dt>
                        <dd>{selectedCompetition.rawDateText ?? "-"}</dd>
                        <dt>Raw location</dt>
                        <dd>{selectedCompetition.rawLocationText ?? "-"}</dd>
                        <dt>Raw registration</dt>
                        <dd>{selectedCompetition.rawRegistrationText ?? "-"}</dd>
                      </dl>
                    </details>
                  </form>
                ) : (
                  <div className="ac-empty">검수할 대회 일정이 없습니다.</div>
                )}
              </div>
            </div>
          </>
        )}

        {activeSection === "contact" && (
          <section aria-labelledby="ac-contact-title">
            <div className="ac-list-head">
              <span className="ac-cap" id="ac-contact-title">Inquiries</span>
              <span className="ac-badge warn">신규 {newContactCount}</span>
            </div>

            {contactInquiries.length > 0 ? (
              <div className="ac-contact-list">
                {contactInquiries.map((inquiry) => (
                  <ContactInquiryCard inquiry={inquiry} key={inquiry.id} />
                ))}
              </div>
            ) : (
              <div className="ac-empty">접수된 문의가 없습니다.</div>
            )}
          </section>
        )}
      </main>
    </>
  );
}

function AdminNavItem({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link className={`ac-nav-item ${active ? "is-active" : ""}`} href={href}>
      {children}
      {typeof count === "number" && count > 0 && (
        <span className="ac-nav-count">{count}</span>
      )}
    </Link>
  );
}

function AdminTab({
  href,
  active,
  children,
  variant = "seg",
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  variant?: "seg" | "chip";
}) {
  const className = variant === "chip" ? "ac-chip" : "ac-seg-item";

  return (
    <Link className={`${className} ${active ? "is-active" : ""}`} href={href}>
      {children}
    </Link>
  );
}

function AnalyticsDashboardSection({
  analytics,
  range,
  from,
  to,
  segment,
  competitionFunnel,
}: {
  analytics: AnalyticsSummary;
  range: AnalyticsRange;
  from?: string;
  to?: string;
  segment?: AnalyticsSegment;
  competitionFunnel: CompetitionFunnel | null;
}) {
  const segStr = segment ? `${segment.dimension}:${segment.value}` : undefined;
  // 대회 행 → 미니퍼널 드릴다운(기간·세그먼트 유지). competitionId 없는 행은 비활성.
  const compHref = (row: AnalyticsTableRow) =>
    row.key && row.key !== "unknown"
      ? buildAnalyticsHref({ range, from, to, seg: segStr, comp: row.key })
      : undefined;
  // 채널 행 key는 `${channel}:${referrerHost}` → 앞부분(channel)만 세그먼트 값으로.
  const channelHref = (row: AnalyticsTableRow) => {
    const channel = row.key.split(":")[0];
    return channel && channel !== "unknown"
      ? buildAnalyticsHref({ range, from, to, seg: `channel:${channel}` })
      : undefined;
  };
  const deviceHref = (row: AnalyticsTableRow) =>
    row.key && row.key !== "unknown"
      ? buildAnalyticsHref({ range, from, to, seg: `device:${row.key}` })
      : undefined;
  const clearCompHref = buildAnalyticsHref({ range, from, to, seg: segStr });
  const clearSegHref = buildAnalyticsHref({ range, from, to });

  return (
    <section aria-label="이용 분석">
      <LiveIndicator
        sessions={analytics.activeSessionCount}
        visitors={analytics.activeVisitorCount}
      />
      <LiveFeed />
      {range === "custom" && <DateRangeForm from={from} to={to} />}
      {segment && <SegmentBanner clearHref={clearSegHref} segment={segment} />}
      {competitionFunnel && (
        <CompetitionFunnelPanel backHref={clearCompHref} funnel={competitionFunnel} />
      )}
      {analytics.unavailableMessage && (
        <div className="ac-empty">{analytics.unavailableMessage}</div>
      )}

      {analytics.heroMetrics.length > 0 && (
        <div className="ac-hero-grid">
          {analytics.heroMetrics.map((metric) => (
            <ChartKpiCard key={metric.key} metric={metric} />
          ))}
        </div>
      )}

      <AnalyticsBlock tag="Overview" title="이용 개요">
        <AnalyticsMetricGrid
          ariaLabel="이용 분석 핵심 지표"
          metrics={analytics.overviewMetrics}
        />
      </AnalyticsBlock>

      <AnalyticsBlock tag="Retention" title="리텐션 코호트">
        <AnalyticsMetricGrid
          ariaLabel="코호트 리텐션 지표"
          metrics={analytics.retentionMetrics}
        />
      </AnalyticsBlock>

      <AnalyticsBlock tag="Revenue" title="광고 리드">
        <AnalyticsMetricGrid
          ariaLabel="광고 리드 핵심 지표"
          metrics={analytics.leadMetrics}
        />
        <FunnelBars
          emptyLabel="문의 데이터가 없습니다."
          rows={analytics.leadFunnelRows}
          title="문의 열기 → 제출"
        />
        <div className="ac-tables">
          <AnalyticsTable
            emptyLabel="광고 슬롯 데이터가 없습니다."
            rows={analytics.leadSourceRows}
            title="유입 위치(슬롯)별 문의"
          />
          <AnalyticsTable
            emptyLabel="대회별 문의 데이터가 없습니다."
            hrefForRow={compHref}
            rows={analytics.leadCompetitionRows}
            title="대회별 광고 문의"
          />
        </div>
      </AnalyticsBlock>

      <AnalyticsBlock tag="Funnel" title="대회 탐색 퍼널">
        <div className="ac-funnel-pair">
          <FunnelBars
            emptyLabel="목록 주도 탐색 데이터가 없습니다."
            rows={analytics.funnelRows}
            title="목록 주도 탐색 (세션 단위)"
          />
          <FunnelBars
            emptyLabel="직접 진입 데이터가 없습니다."
            rows={analytics.directFunnelRows}
            title="직접 진입 → 접수 (SEO·공유)"
          />
        </div>
        <div className="ac-tables">
          <AnalyticsTable
            emptyLabel="신규·재방문 데이터가 없습니다."
            rows={analytics.visitorBehaviorRows}
            title="신규·재방문 접수 도달"
          />
        </div>
        <AnalyticsMetricGrid
          ariaLabel="전환·의도 지표"
          metrics={analytics.conversionMetrics}
        />
      </AnalyticsBlock>

      <AnalyticsBlock tag="Search" title="검색 품질">
        <AnalyticsMetricGrid
          ariaLabel="검색 품질 지표"
          metrics={analytics.searchQualityMetrics}
        />
        <div className="ac-tables">
          <AnalyticsTable
            emptyLabel="검색어 데이터가 없습니다."
            rows={analytics.topSearches}
            title="상위 검색어"
          />
          <AnalyticsTable
            emptyLabel="0건 검색어 데이터가 없습니다."
            rows={analytics.zeroResultSearches}
            title="0건 검색어"
          />
          <AnalyticsTable
            emptyLabel="필터 데이터가 없습니다."
            rows={analytics.topFilters}
            title="상위 필터"
          />
        </div>
      </AnalyticsBlock>

      <AnalyticsBlock tag="Demand" title="콘텐츠 수요">
        <div className="ac-tables">
          <AnalyticsTable
            emptyLabel="대회 상세 조회 데이터가 없습니다."
            hrefForRow={compHref}
            rows={analytics.topCompetitions}
            title="상위 상세 조회 대회"
          />
          <AnalyticsTable
            emptyLabel="접수 클릭 데이터가 없습니다."
            hrefForRow={compHref}
            rows={analytics.topRegistrationCompetitions}
            title="접수 클릭 많은 대회"
          />
          <AnalyticsTable
            emptyLabel="대회 저장 데이터가 없습니다."
            hrefForRow={compHref}
            rows={analytics.topSavedCompetitions}
            title="저장된 대회"
          />
          <AnalyticsTable
            emptyLabel="대회 공유 데이터가 없습니다."
            hrefForRow={compHref}
            rows={analytics.topSharedCompetitions}
            title="공유된 대회"
          />
          <AnalyticsTable
            emptyLabel="페이지뷰 데이터가 없습니다."
            rows={analytics.topPages}
            title="상위 페이지"
          />
          <AnalyticsTable
            emptyLabel="이벤트 데이터가 없습니다."
            rows={analytics.eventRows}
            title="이벤트 믹스"
          />
        </div>
      </AnalyticsBlock>

      <AnalyticsBlock tag="Traffic" title="유입·환경">
        <div className="ac-tables">
          <AnalyticsTable
            emptyLabel="방문자 유형 데이터가 없습니다."
            rows={analytics.visitorRows}
            title="방문자 유형"
          />
          <AnalyticsTable
            emptyLabel="유입 채널 데이터가 없습니다."
            hrefForRow={channelHref}
            rows={analytics.channelRows}
            title="유입 채널"
          />
          <AnalyticsTable
            emptyLabel="접근 모드 데이터가 없습니다."
            rows={analytics.accessModeRows}
            title="접근 모드"
          />
          <AnalyticsTable
            emptyLabel="기기 환경 데이터가 없습니다."
            hrefForRow={deviceHref}
            rows={analytics.deviceRows}
            title="기기 환경"
          />
          <AnalyticsTable
            emptyLabel="브라우저 데이터가 없습니다."
            rows={analytics.browserRows}
            title="브라우저"
          />
          <AnalyticsTable
            emptyLabel="운영체제 데이터가 없습니다."
            rows={analytics.osRows}
            title="운영체제"
          />
        </div>
      </AnalyticsBlock>

      <AnalyticsBlock tag="Crawler" title="봇/크롤러 접근">
        <AnalyticsMetricGrid
          ariaLabel="봇/크롤러 요약"
          metrics={analytics.botMetrics}
        />
        <div className="ac-tables">
          <AnalyticsTable
            emptyLabel="봇/크롤러 데이터가 없습니다."
            rows={analytics.botRows}
            title="봇 종류"
          />
          <AnalyticsTable
            emptyLabel="봇 페이지뷰 데이터가 없습니다."
            rows={analytics.botTopPages}
            title="봇 상위 페이지"
          />
        </div>
      </AnalyticsBlock>
    </section>
  );
}

function DateRangeForm({ from, to }: { from?: string; to?: string }) {
  // 서버 렌더 GET 폼(클라이언트 라우팅 불필요). 제출 시 ?analyticsRange=custom&from&to로
  // 이동해 서버가 윈도를 다시 계산한다.
  return (
    <form action="/admin/analytics" className="ac-daterange" method="get">
      <input name="analyticsRange" type="hidden" value="custom" />
      <label>
        <span>시작</span>
        <input defaultValue={from ?? ""} max={to} name="from" type="date" />
      </label>
      <label>
        <span>종료</span>
        <input defaultValue={to ?? ""} min={from} name="to" type="date" />
      </label>
      <button className="ac-btn sm" type="submit">
        적용
      </button>
    </form>
  );
}

function SegmentBanner({
  segment,
  clearHref,
}: {
  segment: AnalyticsSegment;
  clearHref: string;
}) {
  const dimLabel = segment.dimension === "channel" ? "채널" : "기기";
  return (
    <div className="ac-seg-banner">
      <span>
        {dimLabel} 세그먼트: <strong>{segment.value}</strong>
      </span>
      <Link className="ac-seg-clear" href={clearHref}>
        해제 ✕
      </Link>
    </div>
  );
}

function CompetitionFunnelPanel({
  funnel,
  backHref,
}: {
  funnel: CompetitionFunnel;
  backHref: string;
}) {
  return (
    <section className="ac-block" aria-label="대회 드릴다운">
      <div className="ac-block-head">
        <span className="ac-tag">Competition</span>
        <span className="ac-title">{funnel.title}</span>
        <Link className="ac-drill-back" href={backHref}>
          ← 전체로
        </Link>
      </div>
      <FunnelBars
        emptyLabel="이 대회의 행동 데이터가 없습니다."
        rows={funnel.rows}
        title={funnel.organizationName}
      />
    </section>
  );
}

function AnalyticsBlock({
  children,
  tag,
  title,
}: {
  children: React.ReactNode;
  tag: string;
  title: string;
}) {
  return (
    <section className="ac-block">
      <div className="ac-block-head">
        <span className="ac-tag">{tag}</span>
        <span className="ac-title">{title}</span>
      </div>
      {children}
    </section>
  );
}

function AnalyticsMetricGrid({
  ariaLabel,
  metrics,
}: {
  ariaLabel: string;
  metrics: AnalyticsMetric[];
}) {
  return (
    <dl className="ac-kpis" aria-label={ariaLabel}>
      {metrics.map((metric) => (
        <div className={`ac-kpi ${metric.status ? `is-${metric.status}` : ""}`} key={metric.key}>
          <dt className="ac-kpi-copy">
            <span className="ac-kpi-label">{metric.label}</span>
            {metric.meta && <span className="ac-kpi-meta">{metric.meta}</span>}
          </dt>
          <dd className="ac-kpi-value">
            {formatAnalyticsMetricValue(metric)}
            <DeltaBadge metric={metric} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DeltaBadge({ metric }: { metric: AnalyticsMetric }) {
  const { deltaPct, goodWhen = "higher" } = metric;
  if (deltaPct == null || !Number.isFinite(deltaPct)) return null;

  const rounded = Math.round(deltaPct);
  if (rounded === 0) {
    return (
      <span className="ac-delta is-flat" title="이전 동일기간 대비">
        <span aria-hidden="true">–</span> 0%
      </span>
    );
  }

  const up = rounded > 0;
  const good = up === (goodWhen === "higher");
  return (
    <span className={`ac-delta ${good ? "is-good" : "is-bad"}`} title="이전 동일기간 대비">
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>
      {Math.abs(rounded)}%<span className="ac-sr"> {up ? "증가" : "감소"} (이전 기간 대비)</span>
    </span>
  );
}

// 실시간(최근 2분) 활성 지표. 기간/세그먼트와 무관한 시점 게이지라 기간 그리드와
// 분리해 별도 라이브 인디케이터로 표시한다(집계 캐시 주기상 최대 60초 지연 가능).
function LiveIndicator({ visitors, sessions }: { visitors: number; sessions: number }) {
  return (
    <div className="ac-live" role="status" aria-label="실시간 활성 사용자 (최근 2분)">
      <span className="ac-live-dot" aria-hidden="true" />
      <span className="ac-live-label">LIVE</span>
      <span className="ac-live-stat">
        <strong>{formatNumber(visitors)}</strong> 활성 사용자
      </span>
      <span className="ac-live-sep" aria-hidden="true">·</span>
      <span className="ac-live-stat">
        <strong>{formatNumber(sessions)}</strong> 활성 세션
      </span>
      <span className="ac-live-note">최근 2분</span>
    </div>
  );
}

function ChartKpiCard({ metric }: { metric: AnalyticsMetric }) {
  return (
    <article className={`ac-herokpi ${metric.status ? `is-${metric.status}` : ""}`}>
      <div className="ac-herokpi-head">
        <span className="ac-kpi-label">{metric.label}</span>
        <DeltaBadge metric={metric} />
      </div>
      <strong className="ac-kpi-value">{formatAnalyticsMetricValue(metric)}</strong>
      {metric.spark && metric.spark.length > 0 && (
        <Sparkline
          ariaLabel={`${metric.label} 일별 추이`}
          data={metric.spark}
          days={metric.sparkDays}
          valueLabel={metric.label}
          tone={metric.status === "warn" ? "warn" : "accent"}
        />
      )}
      {metric.meta && <span className="ac-kpi-meta">{metric.meta}</span>}
    </article>
  );
}

function AnalyticsTable({
  emptyLabel,
  rows,
  title,
  hrefForRow,
}: {
  emptyLabel: string;
  rows: AnalyticsTableRow[];
  title: string;
  hrefForRow?: (row: AnalyticsTableRow) => string | undefined;
}) {
  if (rows.length === 0) {
    return (
      <section className="ac-table">
        <div className="ac-table-head">
          <span className="ac-title">{title}</span>
        </div>
        <div className="ac-empty">{emptyLabel}</div>
      </section>
    );
  }

  return (
    <section className="ac-table">
      <table className="ac-dtable">
        <caption className="ac-dtable-cap">
          <span className="ac-dtable-caprow">
            <span className="ac-title">{title}</span>
            <span className="ac-table-top">[{rows.length}]</span>
          </span>
        </caption>
        <thead>
          <tr>
            <th className="ac-col-rank" scope="col">#</th>
            <th scope="col">항목</th>
            <th className="ac-col-num" scope="col">건수</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const href = hrefForRow?.(row);
            return (
              <tr key={row.key}>
                <td className="ac-col-rank">{index + 1}</td>
                <th className="ac-dtable-item" scope="row">
                  {href ? (
                    <Link className="ac-dtable-link" href={href}>
                      {row.label}
                    </Link>
                  ) : (
                    <span>{row.label}</span>
                  )}
                  {row.meta && <small>{row.meta}</small>}
                </th>
                <td className="ac-col-num">{formatNumber(row.count)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function FunnelBars({
  emptyLabel,
  rows,
  title,
}: {
  emptyLabel: string;
  rows: AnalyticsTableRow[];
  title: string;
}) {
  const topCount = rows[0]?.count ?? 0;
  // 최악 단계 = 직전 단계 대비 전환율이 가장 낮은 단계(첫 단계 제외)
  let worstIndex = -1;
  let worstRatio = Infinity;
  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1].count;
    const ratio = prev > 0 ? rows[i].count / prev : 0;
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worstIndex = i;
    }
  }

  return (
    <section className="ac-funnel" aria-label={title}>
      <div className="ac-table-head">
        <span className="ac-title">{title}</span>
      </div>
      {rows.length > 0 ? (
        <ol className="ac-funnel-list">
          {rows.map((row, index) => {
            const width = topCount > 0 ? Math.round((row.count / topCount) * 100) : 0;
            const isWorst = index === worstIndex;
            return (
              <li className={`ac-funnel-step ${isWorst ? "is-worst" : ""}`} key={row.key}>
                <div className="ac-funnel-meta">
                  <span className="ac-funnel-label">{row.label}</span>
                  <b className="ac-list-count">{formatNumber(row.count)}</b>
                </div>
                <span className="ac-funnel-bar" aria-hidden="true">
                  <span style={{ width: `${width}%` }} />
                </span>
                {row.meta && <small className="ac-funnel-conv">{row.meta}</small>}
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="ac-empty">{emptyLabel}</div>
      )}
    </section>
  );
}

type ContactInquiryWithAttachments = ContactInquiry & {
  attachments: ContactAttachment[];
};

function ContactInquiryCard({
  inquiry,
}: {
  inquiry: ContactInquiryWithAttachments;
}) {
  return (
    <article className="ac-contact">
      <div className="ac-contact-main">
        <div className="ac-contact-head">
          <span className="ac-badge subtle">{inquiry.category}</span>
          <span className="ac-contact-date">
            {formatKoreaDateTime(inquiry.createdAt)}
          </span>
          <span className="ac-contact-name">{inquiry.name}</span>
          <a className="ac-contact-email" href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
        </div>
        <p className="ac-contact-msg">{inquiry.message}</p>
      </div>

      <div className="ac-contact-side">
        <span className={`ac-badge review-${inquiry.status}`}>
          {toContactStatusLabel(inquiry.status)}
        </span>
        {inquiry.attachments.length > 0 ? (
          <ul className="ac-attach">
            {inquiry.attachments.map((attachment) => (
              <li key={attachment.id}>
                <a href={`/api/contact/attachments/${attachment.id}`}>
                  {attachment.originalName}
                </a>
                <span>{formatFileSize(attachment.size)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="ac-contact-empty">첨부 없음</span>
        )}
      </div>
    </article>
  );
}

function ReviewBadge({ value }: { value: string }) {
  return <span className={`ac-badge review-${value}`}>{toReviewLabel(value)}</span>;
}

function ConfidenceBadge({ value }: { value: string }) {
  return <span className={`ac-badge confidence-${value}`}>{toConfidenceLabel(value)}</span>;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <span className="ac-progress" aria-label={`${percent}% 완료`}>
      <span style={{ width: `${percent}%` }} />
    </span>
  );
}

type QualityIssue = {
  field?: string;
  message?: string;
  severity?: string;
};

function getQueueWhere(
  seasonYear: number,
  statusFilter: string | undefined,
  confidenceFilter: string | undefined,
  organizationFilter: string | undefined,
  issueFilter: string | undefined,
) {
  const confidenceWhere = isConfidenceFilter(confidenceFilter)
    ? { confidence: confidenceFilter }
    : {};
  const organizationWhere = organizationFilter ? { organizationId: organizationFilter } : {};
  const issueWhere = getIssueWhere(issueFilter);

  if (statusFilter === "approved") {
    return {
      seasonYear,
      reviewStatus: "approved",
      ...confidenceWhere,
      ...organizationWhere,
      ...issueWhere,
    };
  }

  if (statusFilter === "all") {
    return { seasonYear, ...confidenceWhere, ...organizationWhere, ...issueWhere };
  }

  const openWhere = {
    OR: [
      { reviewStatus: { not: "approved" } },
      { confidence: "low" },
      { dateConfidence: "low" },
      { locationConfidence: "low" },
      { registrationConfidence: "low" },
      { dateStartsOn: null },
      { locationRawText: null, venue: null },
    ],
  };

  return isIssueFilter(issueFilter)
    ? {
        seasonYear,
        ...confidenceWhere,
        ...organizationWhere,
        AND: [openWhere, issueWhere],
      }
    : {
        seasonYear,
        ...confidenceWhere,
        ...organizationWhere,
        ...openWhere,
      };
}

function getIssueWhere(issueFilter: string | undefined) {
  if (issueFilter === "date") {
    return {
      OR: [{ dateStartsOn: null }, { dateConfidence: "low" }],
    };
  }

  if (issueFilter === "location") {
    return {
      OR: [{ locationRawText: null, venue: null }, { locationConfidence: "low" }],
    };
  }

  if (issueFilter === "registration") {
    return {
      OR: [{ registrationUrl: null }, { registrationConfidence: "low" }],
    };
  }

  if (issueFilter === "low-confidence") {
    return {
      OR: [
        { confidence: "low" },
        { dateConfidence: "low" },
        { locationConfidence: "low" },
        { registrationConfidence: "low" },
      ],
    };
  }

  return {};
}

type OrganizationSummaryRow = Pick<
  CompetitionSchedule,
  "organizationId" | "organizationName" | "reviewStatus"
>;

function getOrganizationSummaries(rows: OrganizationSummaryRow[]) {
  const summaries = new Map<
    string,
    {
      organizationId: string;
      organizationName: string;
      totalCount: number;
      needsReviewCount: number;
      approvedCount: number;
    }
  >();

  for (const row of rows) {
    const summary =
      summaries.get(row.organizationId) ??
      {
        organizationId: row.organizationId,
        organizationName: row.organizationName,
        totalCount: 0,
        needsReviewCount: 0,
        approvedCount: 0,
      };

    summary.totalCount += 1;
    if (row.reviewStatus === "approved") {
      summary.approvedCount += 1;
    } else {
      summary.needsReviewCount += 1;
    }
    summaries.set(row.organizationId, summary);
  }

  return Array.from(summaries.values()).sort((a, b) =>
    a.organizationName.localeCompare(b.organizationName),
  );
}

function groupCompetitionsByOrganization<T extends CompetitionSchedule>(competitions: T[]) {
  const groups = new Map<
    string,
    {
      organizationId: string;
      organizationName: string;
      needsReviewCount: number;
      approvedCount: number;
      items: T[];
    }
  >();

  for (const competition of competitions) {
    const group =
      groups.get(competition.organizationId) ??
      {
        organizationId: competition.organizationId,
        organizationName: competition.organizationName,
        needsReviewCount: 0,
        approvedCount: 0,
        items: [],
      };

    group.items.push(competition);
    if (competition.reviewStatus === "approved") {
      group.approvedCount += 1;
    } else {
      group.needsReviewCount += 1;
    }
    groups.set(competition.organizationId, group);
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.organizationName.localeCompare(b.organizationName),
  );
}

function getMissingFields(competition: {
  dateStartsOn: Date | null;
  locationRawText: string | null;
  venue: string | null;
  registrationUrl: string | null;
  dateConfidence: string;
  locationConfidence: string;
  registrationConfidence: string;
  confidence: string;
}) {
  const fields: string[] = [];

  if (!competition.dateStartsOn) fields.push("날짜 누락");
  if (!competition.locationRawText && !competition.venue) fields.push("장소 누락");
  if (!competition.registrationUrl) fields.push("접수 URL 누락");
  if (competition.dateConfidence === "low") fields.push("날짜 low");
  if (competition.locationConfidence === "low") fields.push("장소 low");
  if (competition.registrationConfidence === "low") fields.push("접수 low");
  if (competition.confidence === "low") fields.push("전체 low");

  return fields;
}

function getReviewHealth(competition: CompetitionSchedule) {
  const items = [
    {
      label: "날짜",
      ok: Boolean(competition.dateStartsOn) && competition.dateConfidence !== "low",
      reason: !competition.dateStartsOn ? "날짜 누락" : "신뢰도 낮음",
      value: competition.dateStartsOn ? formatKoreaDate(competition.dateStartsOn) : "없음",
    },
    {
      label: "장소",
      ok:
        Boolean(competition.venue || competition.locationRawText) &&
        competition.locationConfidence !== "low",
      reason: !competition.venue && !competition.locationRawText ? "장소 누락" : "신뢰도 낮음",
      value:
        [competition.region, competition.city, competition.venue]
          .filter(Boolean)
          .join(" ") ||
        competition.locationRawText ||
        "없음",
    },
    {
      label: "접수",
      ok: Boolean(competition.registrationUrl) && competition.registrationConfidence !== "low",
      reason: !competition.registrationUrl ? "URL 누락" : "신뢰도 낮음",
      value: toRegistrationLabel(competition.registrationStatus),
    },
    {
      label: "전체",
      ok: competition.confidence !== "low" && competition.reviewStatus === "approved",
      reason: competition.reviewStatus === "approved" ? "신뢰도 낮음" : "미승인",
      value: `${toReviewLabel(competition.reviewStatus)} · ${toConfidenceLabel(competition.confidence)}`,
    },
  ];

  return {
    items,
    readyCount: items.filter((item) => item.ok).length,
  };
}

function getAdminHref({
  analyticsRange,
  statusFilter,
  confidenceFilter,
  organizationFilter,
  issueFilter,
  id,
}: {
  analyticsRange?: string;
  statusFilter?: string;
  confidenceFilter?: string;
  organizationFilter?: string;
  issueFilter?: string;
  id?: string;
}) {
  const params = new URLSearchParams();

  if (statusFilter && statusFilter !== "open") {
    params.set("status", statusFilter);
  }
  if (isConfidenceFilter(confidenceFilter)) {
    params.set("confidence", confidenceFilter);
  }
  if (organizationFilter) {
    params.set("org", organizationFilter);
  }
  if (isIssueFilter(issueFilter)) {
    params.set("issue", issueFilter);
  }
  if (isAnalyticsRange(analyticsRange) && analyticsRange !== "7d") {
    params.set("analyticsRange", analyticsRange);
  }
  if (id) {
    params.set("id", id);
  }

  const query = params.toString();
  return query ? `/admin/review?${query}` : "/admin/review";
}

function buildAnalyticsHref(opts: {
  range: AnalyticsRange;
  from?: string;
  to?: string;
  comp?: string;
  seg?: string;
}) {
  const params = new URLSearchParams();

  if (opts.range !== "7d") {
    params.set("analyticsRange", opts.range);
  }
  if (opts.range === "custom") {
    if (isYmd(opts.from)) params.set("from", opts.from);
    if (isYmd(opts.to)) params.set("to", opts.to);
  }
  if (opts.seg) {
    params.set("seg", opts.seg);
  }
  if (opts.comp) {
    params.set("comp", opts.comp);
  }

  const query = params.toString();
  return query ? `/admin/analytics?${query}` : "/admin/analytics";
}

function getAdminAnalyticsHref(analyticsRange: AnalyticsRange, from?: string, to?: string) {
  // 기간 탭은 드릴다운(comp)을 초기화한다.
  return buildAnalyticsHref({ range: analyticsRange, from, to });
}

function isConfidenceFilter(value: string | undefined): value is (typeof CONFIDENCE_LEVELS)[number] {
  return CONFIDENCE_LEVELS.some((level) => level === value);
}

function isIssueFilter(value: string | undefined): value is (typeof ISSUE_FILTERS)[number] {
  return ISSUE_FILTERS.some((issue) => issue === value);
}

function isAnalyticsRange(value: string | undefined): value is AnalyticsRange {
  return ANALYTICS_RANGES.some((range) => range === value);
}

function toAnalyticsRange(value: string | undefined): AnalyticsRange {
  return isAnalyticsRange(value) ? value : "7d";
}

function toAnalyticsSegment(seg?: string): AnalyticsSegment | undefined {
  if (!seg) return undefined;
  const [dimension, ...rest] = seg.split(":");
  return parseAnalyticsSegment(dimension, rest.join(":"));
}

function getAnalyticsWindow(range: AnalyticsRange, from?: string, to?: string) {
  if (range === "custom") {
    const custom = getCustomWindow(from, to);
    if (custom) return custom;
  }
  const end = new Date();
  const days = range === "today" ? 1 : range === "30d" ? 30 : 7;
  const todayStart = getKoreaStartOfDay(end);
  const start = new Date(todayStart.getTime() - (days - 1) * 86_400_000);

  return { start, end };
}

function getCustomWindow(from?: string, to?: string) {
  if (!isYmd(from) || !isYmd(to)) return null;
  const start = koreaDayStartFromYmd(from);
  // 종료일은 해당 일자 23:59:59(KST)까지 포함
  const end = new Date(koreaDayStartFromYmd(to).getTime() + 86_400_000 - 1);
  if (end <= start) return null;
  return { start, end };
}

function isYmd(value?: string): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function koreaDayStartFromYmd(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, -9));
}

function getKoreaStartOfDay(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(value);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day, -9));
}

function toReviewLabel(value: string) {
  if (value === "approved") return "승인";
  if (value === "rejected") return "반려";
  if (value === "pending") return "대기";
  return "검수 필요";
}

function toConfidenceLabel(value: string) {
  if (value === "high") return "신뢰도 높음";
  if (value === "medium") return "신뢰도 보통";
  return "신뢰도 낮음";
}

function toConfidenceShort(value: string) {
  if (value === "high") return "높음";
  if (value === "medium") return "보통";
  return "낮음";
}

function toRegistrationLabel(value: string) {
  if (value === "scheduled") return "접수 예정";
  if (value === "open") return "접수 중";
  if (value === "closing-soon") return "마감 임박";
  if (value === "closed") return "마감";
  if (value === "cancelled") return "취소";
  return "확인 필요";
}

function toIssueFilterLabel(value: string) {
  if (value === "date") return "날짜";
  if (value === "location") return "장소";
  if (value === "registration") return "접수";
  if (value === "low-confidence") return "낮은 신뢰도";
  return "전체";
}

function toAnalyticsRangeLabel(value: AnalyticsRange) {
  if (value === "today") return "오늘";
  if (value === "30d") return "30일";
  if (value === "custom") return "직접입력";
  return "7일";
}

function toContactStatusLabel(value: string) {
  if (value === "done") return "처리 완료";
  if (value === "archived") return "보관";
  return "신규";
}

function formatKoreaDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function formatKoreaDateTime(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatInputDate(value: Date | null) {
  return value ? formatKoreaDate(value) : "";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function formatAnalyticsMetricValue(metric: AnalyticsMetric) {
  if (metric.format === "percent") return `${Math.round(metric.value)}%`;
  if (metric.format === "decimal") return metric.value.toFixed(1);
  if (metric.format === "seconds") return `${Math.round(metric.value)}초`;
  return formatNumber(metric.value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function parseJsonArray<T>(value: string): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function AdminSectionPage({
  activeSection,
  searchParams,
}: AdminPageProps & {
  activeSection: AdminSection;
}) {
  const paramsPromise: NonNullable<AdminPageProps["searchParams"]> =
    searchParams ?? Promise.resolve({});

  const [
    { analyticsRange, from, to, comp, seg, error, id, status, confidence, org, issue },
    isAuthed,
  ] = await Promise.all([paramsPromise, hasAdminSession()]);

  if (!isAuthed) {
    return <AdminLogin error={error} />;
  }

  return (
    <AdminDashboard
      activeSection={activeSection}
      analyticsComp={comp}
      analyticsFrom={from}
      analyticsRange={analyticsRange}
      analyticsSeg={seg}
      analyticsTo={to}
      confidenceFilter={confidence}
      issueFilter={issue}
      organizationFilter={org}
      selectedId={id}
      statusFilter={status}
    />
  );
}
