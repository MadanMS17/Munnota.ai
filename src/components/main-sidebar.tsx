'use client';

import {
  BarChart2,
  BotMessageSquare,
  FileText,
  History,
  LayoutDashboard,
  Linkedin,
  Rocket,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { UserButton } from './user-button';
import { AppLogo } from './app-logo';

const navItems = [
  { href: '/linkedin-post-generator', icon: Linkedin, label: 'LinkedIn Post Generator' },
  { href: '/resume-analyzer', icon: FileText, label: 'Resume Analyzer' },
  { href: '/skill-gap-navigator', icon: BarChart2, label: 'Skill Gap Navigator' },
  { href: '/mock-interviewer', icon: BotMessageSquare, label: 'AI Mock Interviewer' },
  { href: '/history', icon: History, label: 'History' },
];

export function MainSidebar() {
  const pathname = usePathname();

  const navContent = (
    <>
      <div className="p-4">
        <Link href="/" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
            <AppLogo />
        </Link>
      </div>
      <nav className="flex-1 space-y-2 px-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 space-y-4">
        <UserButton />
      </div>
    </>
  );


  return (
    <>
      <div className="hidden lg:flex lg:flex-col lg:w-72 border-r bg-background/50">
        {navContent}
      </div>
      <div className="lg:hidden p-4 fixed top-0 left-0 z-50">
          <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon"><LayoutDashboard className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 flex flex-col p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Main Menu</SheetTitle>
                  <SheetDescription>Navigation links for the application.</SheetDescription>
                </SheetHeader>
                {navContent}
            </SheetContent>
          </Sheet>
      </div>
    </>
  );
}
