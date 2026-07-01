import { cookies } from "next/headers";
import { createHash, createHmac, timingSafeEqual } from "crypto";

const ADMIN_SESSION_COOKIE = "physiquehub_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;
const ADMIN_SESSION_PAYLOAD = "physiquehub.admin.session.v1";

// admin: 데이터 수정 가능(전체 권한). guest: 조회만 가능(읽기 전용).
export type AdminRole = "admin" | "guest";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

function getGuestPassword() {
  return process.env.ADMIN_GUEST_PASSWORD?.trim() || null;
}

function getSessionSecret() {
  const password = getAdminPassword();
  if (!password) return null;

  return process.env.ADMIN_SESSION_SECRET?.trim() || password;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

function safeEqual(a: string, b: string) {
  return timingSafeEqual(sha256(a), sha256(b));
}

// admin 세션 값은 기존 v1 포맷 그대로 유지해 기존 로그인을 무효화하지 않는다.
// guest는 payload에 role을 섞어 별도 서명 → 쿠키 값만으로 역할을 구분/검증한다.
function createSessionValue(role: AdminRole) {
  const secret = getSessionSecret();
  if (!secret) return null;

  const payload =
    role === "admin" ? ADMIN_SESSION_PAYLOAD : `${ADMIN_SESSION_PAYLOAD}.guest`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");

  return role === "admin" ? `v1.${signature}` : `v1.guest.${signature}`;
}

export function isAdminPasswordConfigured() {
  return Boolean(getAdminPassword());
}

// 입력 비밀번호를 역할로 해석. 일치하는 역할이 없으면 null.
export function resolveAdminRole(input: string): AdminRole | null {
  const adminPassword = getAdminPassword();
  if (adminPassword && safeEqual(input, adminPassword)) return "admin";

  const guestPassword = getGuestPassword();
  if (guestPassword && safeEqual(input, guestPassword)) return "guest";

  return null;
}

export async function getAdminSessionRole(): Promise<AdminRole | null> {
  const cookieStore = await cookies();
  const actual = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!actual) return null;

  for (const role of ["admin", "guest"] as const) {
    const expected = createSessionValue(role);
    if (expected && safeEqual(actual, expected)) return role;
  }
  return null;
}

// 조회 권한: admin·guest 모두 허용.
export async function hasAdminSession() {
  return (await getAdminSessionRole()) !== null;
}

// 쓰기 권한: admin만 허용(guest는 읽기 전용).
export async function isAdminSessionWritable() {
  return (await getAdminSessionRole()) === "admin";
}

export async function setAdminSessionCookie(role: AdminRole) {
  const value = createSessionValue(role);
  if (!value) return;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
