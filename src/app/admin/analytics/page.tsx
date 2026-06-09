import {
  AdminSectionPage,
  type AdminPageProps,
} from "../AdminDashboard";

export default function AdminAnalyticsPage(props: AdminPageProps) {
  return <AdminSectionPage {...props} activeSection="analytics" />;
}
