import { AppLayout } from "@/components/layout/AppLayout";

// Toutes les pages du groupe (app) sont dynamiques — elles nécessitent une auth
// et des données DB en temps réel, donc jamais de SSG.
export const dynamic = "force-dynamic";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
