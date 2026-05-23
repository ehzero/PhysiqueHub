"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSessionCookie,
  hasAdminSession,
  isAdminPasswordConfigured,
  isValidAdminPassword,
  setAdminSessionCookie,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function loginAdmin(formData: FormData) {
  if (!isAdminPasswordConfigured()) {
    redirect("/admin?error=missing-config");
  }

  const password = String(formData.get("password") || "");

  if (!isValidAdminPassword(password)) {
    redirect("/admin?error=invalid-password");
  }

  await setAdminSessionCookie();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSessionCookie();
  redirect("/admin");
}

export async function updateCompetitionReview(formData: FormData) {
  if (!(await hasAdminSession())) {
    redirect("/admin");
  }

  const id = getString(formData, "id");
  const intent = getString(formData, "intent");

  if (!id) {
    throw new Error("수정할 대회 ID가 없습니다.");
  }

  const reviewStatus =
    intent === "approve" || intent === "approve-next"
      ? "approved"
      : getString(formData, "reviewStatus") || "needs-review";
  const dateStartsOn = getNullableDate(formData, "dateStartsOn");
  const dateEndsOn = getNullableDate(formData, "dateEndsOn");
  const feeMinAmount = getNullableNumber(formData, "feeMinAmount");

  await prisma.competitionSchedule.update({
    where: { id },
    data: {
      title: getString(formData, "title") || undefined,
      dateStartsOn,
      dateEndsOn,
      dateRawText: getNullableString(formData, "dateRawText"),
      dateConfidence: getString(formData, "dateConfidence") || "low",
      registrationStatus: getString(formData, "registrationStatus") || "unknown",
      registrationClosesAt: getNullableDateTimeEndOfDay(formData, "registrationClosesAt"),
      registrationUrl: getNullableString(formData, "registrationUrl"),
      registrationConfidence: getString(formData, "registrationConfidence") || "low",
      feeMinAmount,
      feeMaxAmount: feeMinAmount,
      feeRawText: feeMinAmount ? `${feeMinAmount.toLocaleString("ko-KR")}원` : null,
      region: getNullableString(formData, "region"),
      city: getNullableString(formData, "city"),
      venue: getNullableString(formData, "venue"),
      locationRawText: getNullableString(formData, "locationRawText"),
      locationConfidence: getString(formData, "locationConfidence") || "low",
      reviewStatus,
      confidence: getString(formData, "confidence") || "low",
      notes: getNullableString(formData, "notes"),
      normalizedAt: new Date(),
    },
  });

  revalidatePath("/admin");
  redirect(getSafeAdminRedirect(formData, intent === "approve-next" ? "nextRedirectTo" : "redirectTo"));
}

function getString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function getNullableString(formData: FormData, key: string): string | null {
  return getString(formData, key) || null;
}

function getNullableNumber(formData: FormData, key: string): number | null {
  const value = getString(formData, key).replace(/[^\d]/g, "");

  if (!value) {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function getNullableDate(formData: FormData, key: string): Date | null {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getNullableDateTimeEndOfDay(formData: FormData, key: string): Date | null {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T23:59:00+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getSafeAdminRedirect(formData: FormData, key: string): string {
  const value = getString(formData, key);

  return value.startsWith("/admin") ? value : "/admin";
}
