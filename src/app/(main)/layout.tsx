'use client'
import { MainSidebar } from "@/components/main-sidebar";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
        <div className="flex min-h-screen">
            <div className="hidden lg:flex lg:flex-col lg:w-72 border-r bg-background/50 p-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <div className="mt-auto">
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
            <PageShell>
                <Skeleton className="h-12 w-1/3 mb-8" />
                <div className="space-y-8">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </PageShell>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <MainSidebar />
      <PageShell>
        {children}
      </PageShell>
    </div>
  );
}
