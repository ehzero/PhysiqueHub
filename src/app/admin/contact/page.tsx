import {
  AdminSectionPage,
  type AdminPageProps,
} from "../AdminDashboard";

export default function AdminContactPage(props: AdminPageProps) {
  return <AdminSectionPage {...props} activeSection="contact" />;
}
