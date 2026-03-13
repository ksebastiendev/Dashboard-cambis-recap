import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Contenu principal */}
      <main className="lg:pl-60">
        {/* Padding bottom pour la bottom nav mobile */}
        <div className="min-h-screen px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom navigation mobile */}
      <BottomNav />
    </div>
  );
}
