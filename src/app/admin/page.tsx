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
  }>;
};

const REVIEW_STATUSES = ["needs-review", "approved", "rejected", "pending"] as const;
const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
const REGISTRATION_STATUSES = ["unknown", "scheduled", "open", "closing-soon", "closed", "cancelled"] as const;
const ISSUE_FILTERS = ["date", "location", "registration", "low-confidence"] as const;

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
}: {
  selectedId?: string;
  statusFilter?: string;
  confidenceFilter?: string;
  organizationFilter?: string;
  issueFilter?: string;
}) {
  const seasonYear = new Date().getFullYear();
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
        statusFilter,
        confidenceFilter,
        organizationFilter,
        issueFilter,
        id: nextCompetition.id,
      })
    : getAdminHref({ statusFilter, confidenceFilter, organizationFilter, issueFilter });
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
              href={getAdminHref({ confidenceFilter, organizationFilter, issueFilter })}
              active={!statusFilter || statusFilter === "open"}
            >
              검수 필요
            </AdminTab>
            <AdminTab
              href={getAdminHref({ statusFilter: "all", confidenceFilter, organizationFilter, issueFilter })}
              active={statusFilter === "all"}
            >
              전체
            </AdminTab>
            <AdminTab
              href={getAdminHref({
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
              href={getAdminHref({ statusFilter, organizationFilter, issueFilter })}
              active={!isConfidenceFilter(confidenceFilter)}
            >
              전체
            </AdminTab>
            {CONFIDENCE_LEVELS.map((value) => (
              <AdminTab
                active={confidenceFilter === value}
                href={getAdminHref({
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
              href={getAdminHref({ statusFilter, confidenceFilter, organizationFilter })}
              active={!isIssueFilter(issueFilter)}
            >
              전체
            </AdminTab>
            {ISSUE_FILTERS.map((value) => (
              <AdminTab
                active={issueFilter === value}
                href={getAdminHref({
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
              href={getAdminHref({ statusFilter, confidenceFilter, issueFilter })}
              active={!organizationFilter}
            >
              전체 단체
            </AdminTab>
            {organizationSummaries.map((summary) => (
              <AdminTab
                active={organizationFilter === summary.organizationId}
                href={getAdminHref({
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
  statusFilter,
  confidenceFilter,
  organizationFilter,
  issueFilter,
  id,
}: {
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

  const [{ error, id, status, confidence, org, issue }, isAuthed] = await Promise.all([
    paramsPromise,
    hasAdminSession(),
  ]);

  if (!isAuthed) {
    return <AdminLogin error={error} />;
  }

  return (
    <AdminDashboard
      confidenceFilter={confidence}
      issueFilter={issue}
      organizationFilter={org}
      selectedId={id}
      statusFilter={status}
    />
  );
}
