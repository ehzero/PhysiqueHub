import type { Metadata } from "next";
import { COMPETITIONS, regStatus } from "@/lib/data";
import { hasAdminSession, isAdminPasswordConfigured } from "@/lib/admin-auth";
import { loginAdmin, logoutAdmin } from "./actions";

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
  }>;
};

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

function AdminDashboard() {
  const openCount = COMPETITIONS.filter(
    (competition) => regStatus(competition).kind === "open",
  ).length;
  const urgentCount = COMPETITIONS.filter(
    (competition) => regStatus(competition).kind === "urgent",
  ).length;
  const beginnerCount = COMPETITIONS.filter(
    (competition) => competition.beginner,
  ).length;

  const upcomingCompetitions = [...COMPETITIONS]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h1>운영 대시보드</h1>
        </div>
        <form action={logoutAdmin}>
          <button className="cta-btn" type="submit">
            로그아웃
          </button>
        </form>
      </header>

      <section className="admin-metrics" aria-label="대회 운영 지표">
        <div>
          <span className="admin-metric-value">{COMPETITIONS.length}</span>
          <span className="admin-metric-label">등록 대회</span>
        </div>
        <div>
          <span className="admin-metric-value">{openCount}</span>
          <span className="admin-metric-label">접수 중</span>
        </div>
        <div>
          <span className="admin-metric-value">{urgentCount}</span>
          <span className="admin-metric-label">마감 임박</span>
        </div>
        <div>
          <span className="admin-metric-value">{beginnerCount}</span>
          <span className="admin-metric-label">입문자 가능</span>
        </div>
      </section>

      <section className="admin-section" aria-labelledby="admin-upcoming-title">
        <div className="admin-section-head">
          <div>
            <p className="eyebrow">Schedule Review</p>
            <h2 id="admin-upcoming-title">다가오는 대회</h2>
          </div>
          <span className="mono">{upcomingCompetitions.length} items</span>
        </div>

        <div className="admin-table">
          {upcomingCompetitions.map((competition) => {
            const status = regStatus(competition);

            return (
              <article className="admin-table-row" key={competition.id}>
                <div>
                  <strong>{competition.title}</strong>
                  <span>{competition.org}</span>
                </div>
                <span className="mono">{competition.date}</span>
                <span>{competition.region}</span>
                <span className={`row-status status-${status.kind}`}>
                  <span className="dot" />
                  {status.label}
                </span>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const paramsPromise: Promise<{ error?: string }> =
    searchParams ?? Promise.resolve({});

  const [{ error }, isAuthed] = await Promise.all([
    paramsPromise,
    hasAdminSession(),
  ]);

  if (!isAuthed) {
    return <AdminLogin error={error} />;
  }

  return <AdminDashboard />;
}
