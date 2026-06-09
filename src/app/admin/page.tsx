import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import { AdminLogin, type AdminPageProps } from "./AdminDashboard";

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const paramsPromise: NonNullable<AdminPageProps["searchParams"]> =
    searchParams ?? Promise.resolve({});
  const params = await paramsPromise;

  if (!(await hasAdminSession())) {
    return <AdminLogin error={params.error} />;
  }

  redirect("/admin/analytics");
}
