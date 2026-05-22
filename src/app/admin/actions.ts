"use server";

import { redirect } from "next/navigation";
import {
  clearAdminSessionCookie,
  isAdminPasswordConfigured,
  isValidAdminPassword,
  setAdminSessionCookie,
} from "@/lib/admin-auth";

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
