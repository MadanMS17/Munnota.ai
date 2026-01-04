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
    icon: <Linkedin />,
    title: 'LinkedIn Post Generator',
    description: 'Craft engaging posts that attract HR professionals and hiring managers.',
  },
  {
    icon: <FileText />,
    title: 'Resume Analyzer & ATS Optimizer',
    description: 'Optimize your resume against job descriptions to beat the bots.',
  },
  {
    icon: <Bot />,
    title: 'AI Mock Interviewer',
    description: 'Practice your interview skills with a real-time AI and get instant feedback.',
  },
];


export default function Home() {
  const { user, isUserLoading } = useUser();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg">
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 z-10" />
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="https://picsum.photos/seed/college-students/1920/1080"
              alt="College students collaborating"
              fill
              className="object-cover"
              data-ai-hint="college students working"
              priority
            />
             <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="relative z-20 text-center text-primary-foreground px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight font-headline">
              Your AI-Powered Career Co-Pilot
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-primary-foreground/80">
              From crafting the perfect LinkedIn post to acing your interviews, CareerFlow.ai gives you the tools to land your dream job.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/signup">Start Your Career Journey <ArrowRight className="ml-2" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-32 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-headline">The Ultimate Toolkit for Career Success</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                        Everything you need to stand out in today's competitive job market.
                    </p>
                </div>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature) => (
                        <Card key={feature.title} className="bg-card/50 backdrop-blur-lg border border-border/20 text-center">
                            <CardHeader>
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    {feature.icon}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardTitle>{feature.title}</CardTitle>
                                <CardDescription className="mt-2">{feature.description}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="py-8 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} CareerFlow.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
