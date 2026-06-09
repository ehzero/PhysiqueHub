import {
  AdminSectionPage,
  type AdminPageProps,
} from "../AdminDashboard";

export default function AdminReviewPage(props: AdminPageProps) {
  return <AdminSectionPage {...props} activeSection="review" />;
}
