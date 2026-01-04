import { Rocket } from 'lucide-react';

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="rounded-lg bg-primary/10 p-2">
        <Rocket className="h-6 w-6 text-primary" />
      </div>
      <h1 className="font-headline text-xl font-bold text-foreground">
        CareerFlow.ai
      </h1>
    </div>
  );
}
