import { cn } from "@/lib/utils";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PageShell({ children, className, ...props }: PageShellProps) {
    return (
        <div className={cn("flex-1 pt-16 lg:pt-0", className)} {...props}>
            <main className="p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    )
}
