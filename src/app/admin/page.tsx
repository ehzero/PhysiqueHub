import type { Metadata } from "next";
import type {
  CompetitionSchedule,
  ContactAttachment,
  ContactInquiry,
} from "@prisma/client";
import Link from "next/link";
import { hasAdminSession, isAdminPasswordConfigured } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { loginAdmin, logoutAdmin, updateCompetitionReview } from "./actions";

export const metadata: Metadata = {
  title: "Admin | 피지크허브",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type AdminPageProps = {
  searchParams?: Promise<{
    error?: string;
    id?: string;
    status?: string;
    confidence?: string;
    org?: string;
    issue?: string;
    analyticsRange?: string;
  }>;
};

const REVIEW_STATUSES = ["needs-review", "approved", "rejected", "pending"] as const;
const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
const REGISTRATION_STATUSES = ["unknown", "scheduled", "open", "closing-soon", "closed", "cancelled"] as const;
const ISSUE_FILTERS = ["date", "location", "registration", "low-confidence"] as const;
const ANALYTICS_RANGES = ["today", "7d", "30d"] as const;
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

function AdminLogin({ error }: { error?: string }) {
  const configured = isAdminPasswordConfigured();
  const message = configured
    ? getErrorMessage(error)
    : getErrorMessage("missing-config");

  return (
    <main className="admin-gate">
      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <div>
          <p className="eyebrow">Restricted</p>
          <h1 id="admin-login-title">피지크허브 Admin</h1>
        </div>

        <form action={loginAdmin} className="admin-login-form">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            disabled={!configured}
            required
          />
          {message && <p className="admin-form-error">{message}</p>}
          <button className="cta-btn accent" disabled={!configured} type="submit">
            관리자 입장
          </button>
        </form>
      </section>
    </main>
  );
}

async function AdminDashboard({
  selectedId,
  statusFilter,
  confidenceFilter,
  organizationFilter,
  issueFilter,
  analyticsRange,
}: {
  selectedId?: string;
  statusFilter?: string;
  confidenceFilter?: string;
  organizationFilter?: string;
  issueFilter?: string;
  analyticsRange?: string;
}) {
  const seasonYear = new Date().getFullYear();
  const selectedAnalyticsRange = toAnalyticsRange(analyticsRange);
  const analyticsWindow = getAnalyticsWindow(selectedAnalyticsRange);
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
      getAnalyticsSummary(analyticsWindow.start, analyticsWindow.end),
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
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Review Console</p>
          <h1>대회 일정 검수</h1>
          <p className="admin-lead">
            원본 링크를 확인하면서 날짜, 장소, 접수 정보와 신뢰도를 보정하세요.
          </p>
        </div>
        <form action={logoutAdmin}>
          <button className="cta-btn" type="submit">
            로그아웃
          </button>
        </form>
      </header>

      <section className="admin-metrics" aria-label="대회 운영 지표">
        <div>
          <span className="admin-metric-value">{totalCount}</span>
          <span className="admin-metric-label">전체 일정</span>
        </div>
        <div>
          <span className="admin-metric-value">{needsReviewCount}</span>
          <span className="admin-metric-label">검수 대기</span>
        </div>
        <div>
          <span className="admin-metric-value">{approvedCount}</span>
          <span className="admin-metric-label">승인 완료</span>
        </div>
        <div>
          <span className="admin-metric-value">{lowDateCount}</span>
          <span className="admin-metric-label">날짜 확인 필요</span>
        </div>
        <div>
          <span className="admin-metric-value">{missingCoreCount}</span>
          <span className="admin-metric-label">핵심 누락</span>
        </div>
      </section>

      <AnalyticsDashboardSection
        analytics={analyticsSummary}
        confidenceFilter={confidenceFilter}
        issueFilter={issueFilter}
        organizationFilter={organizationFilter}
        range={selectedAnalyticsRange}
        selectedId={selectedId}
        statusFilter={statusFilter}
      />

      <section className="admin-section" aria-labelledby="admin-contact-title">
        <div className="admin-section-head">
          <div>
            <p className="eyebrow">Contact</p>
            <h2 id="admin-contact-title">문의 접수</h2>
          </div>
          <span className="admin-badge warn">신규 {newContactCount}</span>
        </div>

        {contactInquiries.length > 0 ? (
          <div className="admin-contact-list">
            {contactInquiries.map((inquiry) => (
              <ContactInquiryCard inquiry={inquiry} key={inquiry.id} />
            ))}
          </div>
        ) : (
          <div className="admin-empty">접수된 문의가 없습니다.</div>
        )}
      </section>

      <section className="admin-section" aria-labelledby="admin-review-title">
        <div className="admin-section-head">
          <div>
            <p className="eyebrow">Queue</p>
            <h2 id="admin-review-title">검수 큐</h2>
          </div>
          <div className="admin-tabs">
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
        </div>

        <div className="admin-filter-row" aria-label="신뢰도 필터">
          <span className="admin-filter-label">신뢰도</span>
          <div className="admin-tabs">
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
                {toConfidenceLabel(value)}
              </AdminTab>
            ))}
          </div>
        </div>

        <div className="admin-filter-row" aria-label="문제 유형 필터">
          <span className="admin-filter-label">이슈</span>
          <div className="admin-tabs">
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

        <div className="admin-filter-row admin-org-filter-row" aria-label="단체 필터">
          <span className="admin-filter-label">단체</span>
          <div className="admin-org-tabs">
            <AdminTab
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
        </div>

        <div className="admin-review-layout">
          <div className="admin-queue">
            {queueGroups.map((group) => (
              <section className="admin-org-group" key={group.organizationId}>
                <div className="admin-org-head">
                  <div>
                    <strong>{group.organizationName}</strong>
                    <span>
                      {group.items.length}개 · 검수 {group.needsReviewCount} · 승인 {group.approvedCount}
                    </span>
                  </div>
                  <ProgressBar
                    current={group.approvedCount}
                    total={group.items.length}
                  />
                </div>
                {group.items.map((competition) => {
                  const fieldProblems = getMissingFields(competition);
                  const isSelected = selectedCompetition?.id === competition.id;

                  return (
                    <Link
                      className={`admin-queue-item ${isSelected ? "is-active" : ""}`}
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
                      <span className="admin-queue-title">{competition.title}</span>
                      <span className="admin-queue-meta">
                        {competition.dateStartsOn ? formatKoreaDate(competition.dateStartsOn) : "날짜 없음"} · {competition.venue ?? competition.locationRawText ?? "장소 없음"}
                      </span>
                      <span className="admin-queue-badges">
                        <ReviewBadge value={competition.reviewStatus} />
                        <ConfidenceBadge value={competition.confidence} />
                        {fieldProblems.length > 0 && <span className="admin-badge warn">{fieldProblems.length}개 확인</span>}
                      </span>
                    </Link>
                  );
                })}
              </section>
            ))}
          </div>

          <div className="admin-editor">
            {selectedCompetition ? (
              <form action={updateCompetitionReview} className="admin-review-form">
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

                <div className="admin-editor-head">
                  <div>
                    <p className="eyebrow">{selectedCompetition.organizationName}</p>
                    <h3>{selectedCompetition.title}</h3>
                  </div>
                  <div className="admin-editor-actions">
                    <button className="cta-btn" name="intent" type="submit" value="save">
                      저장
                    </button>
                    <button className="cta-btn" name="intent" type="submit" value="approve-next">
                      승인 후 다음
                    </button>
                    <button className="cta-btn accent" name="intent" type="submit" value="approve">
                      승인
                    </button>
                  </div>
                </div>

                <div className="admin-source-strip">
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
                  <div className="admin-review-alerts">
                    {missingFields.map((field) => (
                      <span className="admin-badge warn" key={field}>{field}</span>
                    ))}
                    {qualityIssues.map((issue, index) => (
                      <span className="admin-badge subtle" key={`${issue.field}-${index}`}>
                        {issue.field}: {issue.message}
                      </span>
                    ))}
                  </div>
                )}

                {selectedHealth && (
                  <section className="admin-check-panel" aria-label="검수 체크리스트">
                    <div className="admin-check-head">
                      <div>
                        <p className="eyebrow">Checklist</p>
                        <strong>{selectedHealth.readyCount}/{selectedHealth.items.length} 핵심 항목 확인</strong>
                      </div>
                      <ProgressBar
                        current={selectedHealth.readyCount}
                        total={selectedHealth.items.length}
                      />
                    </div>
                    <div className="admin-check-grid">
                      {selectedHealth.items.map((item) => (
                        <div className={`admin-check-card ${item.ok ? "is-ok" : "needs-work"}`} key={item.label}>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                          <small>{item.ok ? "확인됨" : item.reason}</small>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="admin-form-grid">
                  <label className="span-2">
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
                  <label className="span-2">
                    <span>검수 메모</span>
                    <textarea name="notes" defaultValue={selectedCompetition.notes ?? ""} rows={4} />
                  </label>
                </div>

                <details className="admin-raw-panel">
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
              <div className="admin-empty">검수할 대회 일정이 없습니다.</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function AdminTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link className={`admin-tab ${active ? "is-active" : ""}`} href={href}>
      {children}
    </Link>
  );
}

type AnalyticsSummary = {
  channelRows: AnalyticsTableRow[];
  competitionViewCount: number;
  contactSubmitCount: number;
  end: Date;
  eventRows: AnalyticsTableRow[];
  pageViewCount: number;
  registrationClickCount: number;
  sessionCount: number;
  start: Date;
  topCompetitions: AnalyticsTableRow[];
  topPages: AnalyticsTableRow[];
  topSearches: AnalyticsTableRow[];
  unavailableMessage?: string;
  visitorCount: number;
};

function AnalyticsDashboardSection({
  analytics,
  range,
  selectedId,
  statusFilter,
  confidenceFilter,
  organizationFilter,
  issueFilter,
}: {
  analytics: AnalyticsSummary;
  range: AnalyticsRange;
  selectedId?: string;
  statusFilter?: string;
  confidenceFilter?: string;
  organizationFilter?: string;
  issueFilter?: string;
}) {
  return (
    <section className="admin-section" aria-labelledby="admin-analytics-title">
      <div className="admin-section-head">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2 id="admin-analytics-title">이용 분석</h2>
        </div>
        <div className="admin-tabs" aria-label="분석 기간">
          {ANALYTICS_RANGES.map((value) => (
            <AdminTab
              active={range === value}
              href={getAdminHref({
                analyticsRange: value,
                confidenceFilter,
                id: selectedId,
                issueFilter,
                organizationFilter,
                statusFilter,
              })}
              key={value}
            >
              {toAnalyticsRangeLabel(value)}
            </AdminTab>
          ))}
        </div>
      </div>

      <div className="admin-analytics-note">
        {formatKoreaDateTime(analytics.start)}부터 {formatKoreaDateTime(analytics.end)}까지 ·
        원문 IP와 전체 User-Agent는 화면에 표시하지 않습니다.
      </div>
      {analytics.unavailableMessage && (
        <div className="admin-empty">{analytics.unavailableMessage}</div>
      )}

      <section className="admin-metrics admin-analytics-metrics" aria-label="이용 분석 요약">
        <div>
          <span className="admin-metric-value">{formatNumber(analytics.visitorCount)}</span>
          <span className="admin-metric-label">방문자</span>
        </div>
        <div>
          <span className="admin-metric-value">{formatNumber(analytics.sessionCount)}</span>
          <span className="admin-metric-label">세션</span>
        </div>
        <div>
          <span className="admin-metric-value">{formatNumber(analytics.pageViewCount)}</span>
          <span className="admin-metric-label">페이지뷰</span>
        </div>
        <div>
          <span className="admin-metric-value">{formatNumber(analytics.competitionViewCount)}</span>
          <span className="admin-metric-label">대회 상세 조회</span>
        </div>
        <div>
          <span className="admin-metric-value">{formatNumber(analytics.registrationClickCount)}</span>
          <span className="admin-metric-label">접수 링크 클릭</span>
        </div>
        <div>
          <span className="admin-metric-value">{formatNumber(analytics.contactSubmitCount)}</span>
          <span className="admin-metric-label">문의 전환</span>
        </div>
      </section>

      <div className="admin-analytics-grid">
        <AnalyticsTable
          emptyLabel="페이지뷰 데이터가 없습니다."
          rows={analytics.topPages}
          title="상위 페이지"
        />
        <AnalyticsTable
          emptyLabel="대회 상세 조회 데이터가 없습니다."
          rows={analytics.topCompetitions}
          title="상위 대회"
        />
        <AnalyticsTable
          emptyLabel="검색어 데이터가 없습니다."
          rows={analytics.topSearches}
          title="상위 검색어"
        />
        <AnalyticsTable
          emptyLabel="유입 채널 데이터가 없습니다."
          rows={analytics.channelRows}
          title="유입 채널"
        />
        <AnalyticsTable
          emptyLabel="이벤트 데이터가 없습니다."
          rows={analytics.eventRows}
          title="이벤트 믹스"
        />
      </div>
    </section>
  );
}

function AnalyticsTable({
  emptyLabel,
  rows,
  title,
}: {
  emptyLabel: string;
  rows: AnalyticsTableRow[];
  title: string;
}) {
  return (
    <section className="admin-analytics-card">
      <div className="admin-analytics-card-head">
        <h3>{title}</h3>
        <span className="admin-badge subtle">Top {rows.length}</span>
      </div>
      {rows.length > 0 ? (
        <ol className="admin-analytics-list">
          {rows.map((row) => (
            <li key={row.key}>
              <span>
                <strong>{row.label}</strong>
                {row.meta && <small>{row.meta}</small>}
              </span>
              <b className="mono">{formatNumber(row.count)}</b>
            </li>
          ))}
        </ol>
      ) : (
        <div className="admin-empty">{emptyLabel}</div>
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
    <article className="admin-contact-item">
      <div className="admin-contact-main">
        <div className="admin-contact-head">
          <span className="admin-badge subtle">{inquiry.category}</span>
          <span className="admin-contact-date">
            {formatKoreaDateTime(inquiry.createdAt)}
          </span>
        </div>
        <h3>{inquiry.name}</h3>
        <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
        <p>{inquiry.message}</p>
      </div>

      <div className="admin-contact-side">
        <span className={`admin-badge review-${inquiry.status}`}>
          {toContactStatusLabel(inquiry.status)}
        </span>
        {inquiry.attachments.length > 0 ? (
          <ul className="admin-contact-attachments">
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
          <span className="admin-contact-empty">첨부 없음</span>
        )}
      </div>
    </article>
  );
}

function ReviewBadge({ value }: { value: string }) {
  return <span className={`admin-badge review-${value}`}>{toReviewLabel(value)}</span>;
}

function ConfidenceBadge({ value }: { value: string }) {
  return <span className={`admin-badge confidence-${value}`}>{toConfidenceLabel(value)}</span>;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <span className="admin-progress" aria-label={`${percent}% 완료`}>
      <span style={{ width: `${percent}%` }} />
    </span>
  );
}

type QualityIssue = {
  field?: string;
  message?: string;
  severity?: string;
};

type AnalyticsTableRow = {
  key: string;
  label: string;
  meta?: string;
  count: number;
};

async function getAnalyticsSummary(start: Date, end: Date): Promise<AnalyticsSummary> {
  try {
  const eventWindow = {
    occurredAt: {
      gte: start,
      lte: end,
    },
  };
  const sessionWindow = {
    startedAt: {
      gte: start,
      lte: end,
    },
  };

  const [
    visitorRows,
    sessionCount,
    pageViewCount,
    competitionViewCount,
    registrationClickCount,
    contactSubmitCount,
    topPageRows,
    topCompetitionRows,
    topSearchRows,
    channelGroupRows,
    eventGroupRows,
  ] = await Promise.all([
    prisma.analyticsSession.findMany({
      distinct: ["visitorId"],
      select: { visitorId: true },
      where: sessionWindow,
    }),
    prisma.analyticsSession.count({ where: sessionWindow }),
    prisma.analyticsEvent.count({
      where: { ...eventWindow, name: "page_view" },
    }),
    prisma.analyticsEvent.count({
      where: { ...eventWindow, name: "competition_view" },
    }),
    prisma.analyticsEvent.count({
      where: { ...eventWindow, name: "registration_link_click" },
    }),
    prisma.analyticsEvent.count({
      where: { ...eventWindow, name: "contact_submit_success" },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["path"],
      where: { ...eventWindow, name: "page_view" },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["competitionId"],
      where: {
        ...eventWindow,
        name: "competition_view",
        competitionId: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { competitionId: "desc" } },
      take: 10,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["searchQuery"],
      where: {
        ...eventWindow,
        name: "search_performed",
        searchQuery: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { searchQuery: "desc" } },
      take: 10,
    }),
    prisma.analyticsSession.groupBy({
      by: ["channel"],
      where: sessionWindow,
      _count: { _all: true },
      orderBy: { _count: { channel: "desc" } },
      take: 10,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["name"],
      where: eventWindow,
      _count: { _all: true },
      orderBy: { _count: { name: "desc" } },
      take: 10,
    }),
  ]);
  const competitionIds = topCompetitionRows
    .map((row) => row.competitionId)
    .filter((id): id is string => Boolean(id));
  const competitions =
    competitionIds.length > 0
      ? await prisma.competitionSchedule.findMany({
          select: {
            id: true,
            organizationShortName: true,
            organizationName: true,
            title: true,
          },
          where: { id: { in: competitionIds } },
        })
      : [];
  const competitionById = new Map(competitions.map((competition) => [competition.id, competition]));

  return {
    channelRows: channelGroupRows.map((row) => ({
      key: row.channel ?? "unknown",
      label: toAnalyticsChannelLabel(row.channel),
      count: row._count._all,
    })),
    competitionViewCount,
    contactSubmitCount,
    end,
    eventRows: eventGroupRows.map((row) => ({
      key: row.name,
      label: toAnalyticsEventLabel(row.name),
      meta: row.name,
      count: row._count._all,
    })),
    pageViewCount,
    registrationClickCount,
    sessionCount,
    start,
    topCompetitions: topCompetitionRows.map((row) => {
      const competition = row.competitionId ? competitionById.get(row.competitionId) : null;
      return {
        key: row.competitionId ?? "unknown",
        label: competition?.title ?? row.competitionId ?? "알 수 없는 대회",
        meta:
          competition?.organizationShortName ??
          competition?.organizationName ??
          row.competitionId ??
          undefined,
        count: row._count._all,
      };
    }),
    topPages: topPageRows.map((row) => ({
      key: row.path,
      label: row.path,
      count: row._count._all,
    })),
    topSearches: topSearchRows.map((row) => ({
      key: row.searchQuery ?? "unknown",
      label: row.searchQuery ?? "알 수 없는 검색어",
      count: row._count._all,
    })),
    visitorCount: visitorRows.length,
  };
  } catch {
    return getEmptyAnalyticsSummary(
      start,
      end,
      "Analytics 테이블을 확인할 수 없습니다. Prisma migration 적용 상태를 확인하세요.",
    );
  }
}

function getEmptyAnalyticsSummary(
  start: Date,
  end: Date,
  unavailableMessage?: string,
): AnalyticsSummary {
  return {
    channelRows: [],
    competitionViewCount: 0,
    contactSubmitCount: 0,
    end,
    eventRows: [],
    pageViewCount: 0,
    registrationClickCount: 0,
    sessionCount: 0,
    start,
    topCompetitions: [],
    topPages: [],
    topSearches: [],
    unavailableMessage,
    visitorCount: 0,
  };
}

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
  return query ? `/admin?${query}` : "/admin";
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

function getAnalyticsWindow(range: AnalyticsRange) {
  const end = new Date();
  const days = range === "today" ? 1 : range === "30d" ? 30 : 7;
  const todayStart = getKoreaStartOfDay(end);
  const start = new Date(todayStart.getTime() - (days - 1) * 86_400_000);

  return { start, end };
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
  if (value === "30d") return "최근 30일";
  return "최근 7일";
}

function toAnalyticsChannelLabel(value: string | null) {
  if (value === "direct") return "직접 방문";
  if (value === "internal") return "내부 이동";
  if (value === "organic_search") return "검색 유입";
  if (value === "paid") return "유료 유입";
  if (value === "referral") return "추천 유입";
  if (value === "social") return "소셜 유입";
  return "알 수 없음";
}

function toAnalyticsEventLabel(value: string) {
  const labels: Record<string, string> = {
    contact_open: "문의 열기",
    contact_submit_success: "문의 제출 성공",
    competition_detail_click: "드로어 상세 클릭",
    competition_open: "대회 드로어 열기",
    competition_view: "대회 상세 조회",
    empty_search_result: "0건 결과",
    engagement_ping: "활성 ping",
    filter_applied: "필터 적용",
    filter_reset: "필터 초기화",
    page_view: "페이지뷰",
    registration_link_click: "접수 링크 클릭",
    related_competition_click: "관련 대회 클릭",
    save_competition: "관심 대회 저장",
    search_performed: "검색 수행",
    session_start: "세션 시작",
    share_click: "공유 클릭",
    sort_changed: "정렬 변경",
    source_link_click: "출처 링크 클릭",
    unsave_competition: "관심 대회 해제",
    view_mode_changed: "보기 변경",
  };

  return labels[value] ?? value;
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

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const paramsPromise: NonNullable<AdminPageProps["searchParams"]> =
    searchParams ?? Promise.resolve({});

  const [{ analyticsRange, error, id, status, confidence, org, issue }, isAuthed] = await Promise.all([
    paramsPromise,
    hasAdminSession(),
  ]);

  if (!isAuthed) {
    return <AdminLogin error={error} />;
  }

  return (
    <AdminDashboard
      analyticsRange={analyticsRange}
      confidenceFilter={confidence}
      issueFilter={issue}
      organizationFilter={org}
      selectedId={id}
      statusFilter={status}
    />
  );
}
