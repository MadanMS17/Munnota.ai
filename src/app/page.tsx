'use client';
import { useUser } from '@/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/app-logo';
import { ArrowRight, Bot, FileText, Linkedin } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const features = [
  {
    icon: <Linkedin className="h-6 w-6" />,
    title: 'LinkedIn Post Generator',
    description: 'Craft engaging posts that attract HR professionals and hiring managers.',
    href: '/linkedin-post-generator',
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Resume Analyzer & ATS Optimizer',
    description: 'Optimize your resume against job descriptions to beat the bots.',
    href: '/resume-analyzer',
  },
  {
    icon: <Bot className="h-6 w-6" />,
    title: 'AI Mock Interviewer',
    description: 'Practice your interview skills with a real-time AI and get instant feedback.',
    href: '/mock-interviewer',
  },
];


export default function Home() {
  const { user, isUserLoading } = useUser();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
            <AppLogo />
            <div className="flex items-center gap-2">
                {!isUserLoading && !user && (
                    <>
                        <Button variant="ghost" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/signup">Get Started <ArrowRight className="ml-2" /></Link>
                        </Button>
                    </>
                )}
                {!isUserLoading && user && (
                    <Button asChild>
                        <Link href="/linkedin-post-generator">Go to App <ArrowRight className="ml-2" /></Link>
                    </Button>
                )}
            </div>
            </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex h-screen min-h-[700px] items-center justify-center pt-20">
          <div className="absolute inset-0 z-10" />
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="https://picsum.photos/seed/tech-abstract/1920/1080"
              alt="Abstract technology background"
              fill
              className="object-cover"
              data-ai-hint="abstract technology"
              priority
            />
             <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="relative z-20 text-center text-primary-foreground px-4">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight font-headline">
              Land Your Dream Job
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-primary-foreground/80">
              CareerFlow.ai is your AI co-pilot for navigating the job market. From resumes to interviews, we give you the tools to succeed.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">Start for Free <ArrowRight className="ml-2" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-32 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight font-headline">The Ultimate Toolkit for Career Success</h2>
                    <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
                        Stop guessing what recruiters want to see. Get data-driven insights and AI-powered tools to build a winning application.
                    </p>
                </div>
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature) => (
                        <div key={feature.title} className="bg-secondary/50 p-8 rounded-2xl border border-border">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                {feature.icon}
                            </div>
                            <h3 className="mt-6 text-xl font-bold">{feature.title}</h3>
                            <p className="mt-2 text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="py-8 bg-muted/20 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
            <AppLogo className="justify-center mb-4"/>
            <p>&copy; {new Date().getFullYear()} CareerFlow.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
