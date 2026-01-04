'use client'
import { PageShell } from "@/components/page-shell";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MainSidebar } from "@/components/main-sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !initialAuthCheckComplete) {
      setInitialAuthCheckComplete(true);
    }
  }, [isUserLoading, initialAuthCheckComplete]);

  useEffect(() => {
    if (initialAuthCheckComplete && !user) {
      router.push('/login');
    }
  }, [user, initialAuthCheckComplete, router]);

  if (!initialAuthCheckComplete || !user) {
    return (
        <div className="flex min-h-screen flex-col pt-32">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                 <div className="container flex h-14 items-center">
                    <Skeleton className="h-8 w-32" />
                    <div className="flex flex-1 items-center justify-end space-x-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            </header>
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
    <div className="flex-1 flex pt-24">
      <MainSidebar />
      <PageShell>
          {children}
      </PageShell>
    </div>
  );
}
