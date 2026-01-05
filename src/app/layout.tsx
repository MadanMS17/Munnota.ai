import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AppLogo } from '@/components/app-logo';
import Link from 'next/link';
import { Github, Users } from 'lucide-react';
import { UserButton } from '@/components/user-button';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CareerFlow.ai',
  description: 'Your AI-powered career co-pilot.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-body antialiased flex flex-col min-h-screen`}>
        <FirebaseClientProvider>
          <header className="fixed top-4 left-0 right-0 z-50 px-4">
              <div className="container mx-auto flex w-full items-center justify-between h-16 px-6 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
                  <Link href="/">
                      <AppLogo />
                  </Link>
                  <UserButton />
              </div>
          </header>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <footer className="py-16 bg-card border-t border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-muted-foreground">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <div>
                        <AppLogo className="justify-center md:justify-start mb-4"/>
                        <p className="text-sm">&copy; {new Date().getFullYear()} CareerFlow.ai. All rights reserved.</p>
                    </div>
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <h3 className="font-semibold text-foreground mb-2">Features</h3>
                        <Link href="/linkedin-post-generator" className="hover:text-primary transition-colors">LinkedIn Post Generator</Link>
                        <Link href="/resume-analyzer" className="hover:text-primary transition-colors">Resume Analyzer</Link>
                        <Link href="/skill-gap-navigator" className="hover:text-primary transition-colors">Skill Gap Navigator</Link>
                        <Link href="/mock-interviewer" className="hover:text-primary transition-colors">AI Mock Interviewer</Link>
                    </div>
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <h3 className="font-semibold text-foreground mb-2">Community</h3>
                        <div className="flex gap-4 justify-center md:justify-start">
                            <Link href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                                <Github className="h-6 w-6 hover:text-primary transition-colors" />
                            </Link>
                            <Link href="https://gdg.community.dev/" target="_blank" rel="noopener noreferrer" aria-label="Google Developer Groups">
                                <Users className="h-6 w-6 hover:text-primary transition-colors" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
          </footer>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
