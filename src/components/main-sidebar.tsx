
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
import { UserButton } from './user-button';
import { AppLogo } from './app-logo';
import { cn } from '@/lib/utils';


const navItems = [
  { href: '/linkedin-post-generator', icon: Linkedin, label: 'LinkedIn Post Generator' },
  { href: '/resume-analyzer', icon: FileText, label: 'Resume Analyzer' },
  { href: '/skill-gap-navigator', icon: BarChart2, label: 'Skill Gap Navigator' },
  { href: '/mock-interviewer', icon: BotMessageSquare, label: 'AI Mock Interviewer' },
  { href: '/history', icon: History, label: 'History' },
];

export function MainSidebar() {
  const pathname = usePathname();

  const navLinks = (
    <nav className="flex items-center space-x-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center justify-between gap-8 h-32 px-4 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
          <Link href="/linkedin-post-generator">
            <AppLogo />
          </Link>
          {navLinks}
          <UserButton />
        </div>
      </header>
      
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-28 items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="mr-4">
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="sr-only">Open Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 flex flex-col p-0">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  </SheetHeader>
                  <div className="p-4">
                    <Link href="/linkedin-post-generator">
                        <AppLogo />
                    </Link>
                  </div>
                  <nav className="flex-1 space-y-2 px-4">
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
                  <div className="mt-auto p-4 space-y-4">
                    <UserButton />
                  </div>
              </SheetContent>
            </Sheet>
            <div className="flex flex-1 items-center justify-end space-x-4">
                <UserButton />
            </div>
        </div>
      </header>
    </>
  );
}
