import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | 피지크허브",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
