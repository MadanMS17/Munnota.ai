
'use client';

import {
  BarChart2,
  BotMessageSquare,
  FileText,
  History,
  LayoutDashboard,
  Linkedin,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { AppLogo } from './app-logo';
import { cn } from '@/lib/utils';


const navItems = [
  { href: '/linkedin-post-generator', icon: Linkedin, label: 'LinkedIn Post Generator', className: 'h-6 w-6' },
  { href: '/resume-analyzer', icon: FileText, label: 'Resume Analyzer', className: 'h-6 w-6' },
  { href: '/skill-gap-navigator', icon: BarChart2, label: 'Skill Gap Navigator', className: 'h-6 w-6' },
  { href: '/mock-interviewer', icon: BotMessageSquare, label: 'AI Mock Interviewer', className: 'h-6 w-6' },
  { href: '/history', icon: History, label: 'History', className: 'h-6 w-6' },
];

export function MainSidebar() {
  const pathname = usePathname();

  const navLinks = (
    <>
      {navItems.map((item) => {
          const [line1, ...rest] = item.label.split(' ');
          const line2 = rest.join(' ');
          return (
          <Link
              key={item.href}
              href={item.href}
              className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors text-xs font-medium h-20 justify-center w-24',
              pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
          >
              <item.icon className={cn("mb-1", item.className)} />
              <span className="text-center leading-tight">{line1}</span>
              <span className="text-center leading-tight">{line2}</span>
          </Link>
          )
      })}
    </>
  );


  return (
    <>
      {/* Desktop Feature Sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen">
        <div className="flex flex-col items-center justify-center gap-4 h-full p-4">
              <div className="flex flex-col items-center justify-center gap-4 h-auto p-4 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
                {navLinks}
              </div>
        </div>
      </aside>
      
      {/* Mobile Feature Trigger */}
      <aside className="lg:hidden fixed bottom-4 left-4 z-40">
        <Sheet>
            <SheetTrigger asChild>
            <Button variant="outline" size="icon">
                <LayoutDashboard className="h-5 w-5" />
                <span className="sr-only">Open Features Menu</span>
            </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 flex flex-col p-0">
                <SheetHeader className='p-4 border-b'>
                  <Link href="/">
                      <AppLogo />
                  </Link>
                </SheetHeader>
                <nav className="flex-1 space-y-2 px-4 py-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
                        pathname === item.href
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
            </SheetContent>
        </Sheet>
      </aside>
    </>
  );
}
