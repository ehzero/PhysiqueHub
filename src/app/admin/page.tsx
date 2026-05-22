import type { Metadata } from "next";
import Link from "next/link";
import { hasAdminSession, isAdminPasswordConfigured } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { loginAdmin, logoutAdmin, updateCompetitionReview } from "./actions";

export const metadata: Metadata = {
  title: "Admin | PhysiqueHub",
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
  }>;
};

const REVIEW_STATUSES = ["needs-review", "approved", "rejected", "pending"] as const;
const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
const REGISTRATION_STATUSES = ["unknown", "scheduled", "open", "closing-soon", "closed", "cancelled"] as const;

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
          <h1 id="admin-login-title">PhysiqueHub Admin</h1>
          <p>
            관리자 비밀번호를 입력하면 운영 전용 대시보드에 접근할 수 있습니다.
          </p>
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
}: {
  selectedId?: string;
  statusFilter?: string;
  confidenceFilter?: string;
}) {
  const seasonYear = new Date().getFullYear();
  const queueWhere = getQueueWhere(seasonYear, statusFilter, confidenceFilter);
  const [totalCount, needsReviewCount, approvedCount, lowDateCount, missingCoreCount, queue] =
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
      prisma.competitionSchedule.findMany({
        where: queueWhere,
        orderBy: [{ reviewStatus: "desc" }, { confidence: "asc" }, { dateStartsOn: "asc" }, { title: "asc" }],
        take: 80,
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

      <section className="admin-section" aria-labelledby="admin-review-title">
        <div className="admin-section-head">
          <div>
            <p className="eyebrow">Queue</p>
            <h2 id="admin-review-title">검수 큐</h2>
          </div>
          <div className="admin-tabs">
            <AdminTab
              href={getAdminHref({ confidenceFilter })}
              active={!statusFilter || statusFilter === "open"}
            >
              검수 필요
            </AdminTab>
            <AdminTab
              href={getAdminHref({ statusFilter: "all", confidenceFilter })}
              active={statusFilter === "all"}
            >
              전체
            </AdminTab>
            <AdminTab
              href={getAdminHref({ statusFilter: "approved", confidenceFilter })}
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
              href={getAdminHref({ statusFilter })}
              active={!isConfidenceFilter(confidenceFilter)}
            >
              전체
            </AdminTab>
            {CONFIDENCE_LEVELS.map((value) => (
              <AdminTab
                active={confidenceFilter === value}
                href={getAdminHref({ statusFilter, confidenceFilter: value })}
                key={value}
              >
                {toConfidenceLabel(value)}
              </AdminTab>
            ))}
          </div>
        </div>

        <div className="admin-review-layout">
          <div className="admin-queue">
            {queue.map((competition) => {
              const fieldProblems = getMissingFields(competition);
              const isSelected = selectedCompetition?.id === competition.id;

              return (
                <Link
                  className={`admin-queue-item ${isSelected ? "is-active" : ""}`}
                  href={getAdminHref({ statusFilter, confidenceFilter, id: competition.id })}
                  key={competition.id}
                >
                  <span className="admin-queue-title">{competition.title}</span>
                  <span className="admin-queue-meta">
                    {competition.organizationName} · {competition.dateStartsOn ? formatKoreaDate(competition.dateStartsOn) : "날짜 없음"}
                  </span>
                  <span className="admin-queue-badges">
                    <ReviewBadge value={competition.reviewStatus} />
                    <ConfidenceBadge value={competition.confidence} />
                    {fieldProblems.length > 0 && <span className="admin-badge warn">{fieldProblems.length}개 확인</span>}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="admin-editor">
            {selectedCompetition ? (
              <form action={updateCompetitionReview} className="admin-review-form">
                <input name="id" type="hidden" value={selectedCompetition.id} />

                <div className="admin-editor-head">
                  <div>
                    <p className="eyebrow">{selectedCompetition.organizationName}</p>
                    <h3>{selectedCompetition.title}</h3>
                  </div>
                  <div className="admin-editor-actions">
                    <button className="cta-btn" name="intent" type="submit" value="save">
                      저장
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

function ReviewBadge({ value }: { value: string }) {
  return <span className={`admin-badge review-${value}`}>{toReviewLabel(value)}</span>;
}

function ConfidenceBadge({ value }: { value: string }) {
  return <span className={`admin-badge confidence-${value}`}>{toConfidenceLabel(value)}</span>;
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
) {
  const confidenceWhere = isConfidenceFilter(confidenceFilter)
    ? { confidence: confidenceFilter }
    : {};

  if (statusFilter === "approved") {
    return { seasonYear, reviewStatus: "approved", ...confidenceWhere };
  }

  if (statusFilter === "all") {
    return { seasonYear, ...confidenceWhere };
  }

  return {
    seasonYear,
    ...confidenceWhere,
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

function getAdminHref({
  statusFilter,
  confidenceFilter,
  id,
}: {
  statusFilter?: string;
  confidenceFilter?: string;
  id?: string;
}) {
  const params = new URLSearchParams();

  if (statusFilter && statusFilter !== "open") {
    params.set("status", statusFilter);
  }
  if (isConfidenceFilter(confidenceFilter)) {
    params.set("confidence", confidenceFilter);
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

function formatKoreaDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function formatInputDate(value: Date | null) {
  return value ? formatKoreaDate(value) : "";
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

  const [{ error, id, status, confidence }, isAuthed] = await Promise.all([
    paramsPromise,
    hasAdminSession(),
  ]);

  if (!isAuthed) {
    return <AdminLogin error={error} />;
  }

  return (
    <AdminDashboard
      confidenceFilter={confidence}
      selectedId={id}
      statusFilter={status}
    />
  );
}
