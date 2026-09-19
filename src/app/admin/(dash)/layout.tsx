import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: "Харчі · Адмінка" };

export default function AdminDashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
