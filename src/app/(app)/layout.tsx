import { AppLayout } from "@/components/layout/AppLayout";

// Layout partagé pour toutes les pages protégées (groupe route app)
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
