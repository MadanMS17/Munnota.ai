'use client';

import { signOut } from 'firebase/auth';
import { BarChart2, BotMessageSquare, FileText, History, LayoutDashboard, LogIn, LogOut, Linkedin, User as UserIcon } from 'lucide-react';
import { useUser, useFirebase } from '@/firebase';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const navItems = [
    { href: '/linkedin-post-generator', icon: Linkedin, label: 'LinkedIn Post Generator' },
    { href: '/resume-analyzer', icon: FileText, label: 'Resume Analyzer' },
    { href: '/skill-gap-navigator', icon: BarChart2, label: 'Skill Gap Navigator' },
    { href: '/mock-interviewer', icon: BotMessageSquare, label: 'AI Mock Interviewer' },
    { href: '/history', icon: History, label: 'History' },
];

export function UserButton({ className }: { className?: string }) {
  const { user, isUserLoading: loading } = useUser();
  const { auth } = useFirebase();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  if (!isClient || loading) {
    return <Skeleton className={cn("h-10 w-10 rounded-full", className)} />;
  }

  if (!user) {
    return (
      <Button asChild className={cn(className)} variant="ghost" size="icon">
        <Link href="/login">
          <LogIn className="h-5 w-5" />
          <span className="sr-only">Sign In</span>
        </Link>
      </Button>
    );
  }

  return (
    <div className={cn(className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
              <AvatarFallback>
                {user.displayName
                  ? user.displayName.charAt(0)
                  : <UserIcon className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
            <DropdownMenuLabel>Features</DropdownMenuLabel>
            {navItems.map(item => (
                <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                    </Link>
                </DropdownMenuItem>
            ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
