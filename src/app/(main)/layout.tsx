'use client'
import { MainSidebar } from "@/components/main-sidebar";
import { PageShell } from "@/components/page-shell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <MainSidebar />
      <PageShell>
        {children}
      </PageShell>
    </div>
  );
}
