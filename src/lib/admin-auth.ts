import { cookies } from "next/headers";
import { createHash, createHmac, timingSafeEqual } from "crypto";

const ADMIN_SESSION_COOKIE = "physiquehub_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;
const ADMIN_SESSION_PAYLOAD = "physiquehub.admin.session.v1";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || null;
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

function createSessionValue() {
  const secret = getSessionSecret();
  if (!secret) return null;

  const signature = createHmac("sha256", secret)
    .update(ADMIN_SESSION_PAYLOAD)
    .digest("hex");

  return `v1.${signature}`;
}

export function isAdminPasswordConfigured() {
  return Boolean(getAdminPassword());
}

export function isValidAdminPassword(input: string) {
  const password = getAdminPassword();
  if (!password) return false;

  return safeEqual(input, password);
}

export async function hasAdminSession() {
  const expected = createSessionValue();
  if (!expected) return false;

  const cookieStore = await cookies();
  const actual = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!actual) return false;

  return safeEqual(actual, expected);
}

export async function setAdminSessionCookie() {
  const value = createSessionValue();
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
