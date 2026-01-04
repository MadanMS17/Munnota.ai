'use client';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/app-logo';
import { ArrowRight, Bot, BotMessageSquare, Compass, FileText, Github, Linkedin, Users, Zap } from 'lucide-react';
import SpotlightCard from '@/components/ui/spotlight-card';
import dynamic from 'next/dynamic';

const FloatingLines = dynamic(() => import('@/components/ui/floating-lines'), { ssr: false });
const GridScan = dynamic(() => import('@/components/ui/grid-scan'), { ssr: false });


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
    icon: <Compass className="h-6 w-6" />,
    title: 'Skill Gap Navigator',
    description: 'Chart your course to a new role with a personalized learning roadmap.',
    href: '/skill-gap-navigator'
  },
  {
    icon: <BotMessageSquare className="h-6 w-6" />,
    title: 'AI Mock Interviewer',
    description: 'Practice your interview skills with a real-time AI to build confidence.',
    href: '/mock-interviewer'
  },
];


export default function Home() {
  const { user, isUserLoading } = useUser();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex h-[calc(100vh-8rem)] min-h-[700px] items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0 bg-background">
            <FloatingLines
                enabledWaves={['top', 'middle', 'bottom']}
                lineCount={[8, 8, 8]}
                lineDistance={[8, 100, 4]}
                bendRadius={5.0}
                bendStrength={1}
                interactive={true}
                parallax={true}
            />
          </div>
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
              Land Your Dream Job, Faster.
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-white/80">
              CareerFlow.ai is your AI co-pilot for navigating the job market. From resumes to interviews, we give you the tools to succeed.
            </p>
            <div className="mt-10">
                {!isUserLoading && !user && (
                    <Button size="lg" asChild className="bg-white text-black hover:bg-white/90">
                        <Link href="/signup">Start for Free <ArrowRight className="ml-2" /></Link>
                    </Button>
                )}
                {!isUserLoading && user && (
                    <Button size="lg" asChild className="bg-white text-black hover:bg-white/90">
                        <Link href="/linkedin-post-generator">Go to App <ArrowRight className="ml-2" /></Link>
                    </Button>
                )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-20 sm:py-32 bg-background overflow-hidden">
            <div className="absolute inset-0 z-0">
                <GridScan
                    sensitivity={1}
                    lineThickness={1}
                    linesColor="#200040"
                    gridScale={0.15}
                    scanColor="#8e2de2"
                    scanOpacity={0.4}
                    enablePost
                    bloomIntensity={0.5}
                    chromaticAberration={0.005}
                    noiseIntensity={0.02}
                />
            </div>
            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">The Ultimate Toolkit for Career Success</h2>
                    <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
                        Stop guessing what recruiters want to see. Get data-driven insights and enhance your skills.
                    </p>
                </div>
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    {features.map((feature) => (
                        <Link href={feature.href} key={feature.title}>
                            <SpotlightCard
                            className="p-8 transition-all duration-300 transform hover:-translate-y-2 border-white/10 h-full flex flex-col"
                            spotlightColor="rgba(41, 98, 255, 1)"
                            >
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    {feature.icon}
                                </div>
                                <h3 className="mt-6 text-xl font-bold">{feature.title}</h3>
                                <p className="mt-2 text-muted-foreground flex-1">{feature.description}</p>
                            </SpotlightCard>
                        </Link>
                    ))}
                </div>
            </div>
        </section>

        {/* FOMO Section */}
        <section className="py-20 sm:py-32 bg-gray-900/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <Zap className="mx-auto h-16 w-16 text-primary animate-pulse" />
                <h2 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-white">
                    The Best Candidates Are Already Using AI. Are You?
                </h2>
                <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
                    In today's job market, standing still is falling behind. While you're manually tailoring your resume for the tenth time, top candidates are leveraging AI to get instant feedback, generate targeted content, and chart their learning path. Don't get left in the digital dust.
                </p>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto">
                    <div className="text-center">
                        <p className="text-5xl font-bold text-white">85%</p>
                        <p className="mt-2 text-muted-foreground">More Likely to Land an Interview</p>
                    </div>
                    <div className="text-center">
                        <p className="text-5xl font-bold text-white">3X</p>
                        <p className="mt-2 text-muted-foreground">Faster Application Process</p>
                    </div>
                    <div className="text-center">
                        <p className="text-5xl font-bold text-white">92%</p>
                        <p className="mt-2 text-muted-foreground">Higher Confidence Reported</p>
                    </div>
                </div>

                <div className="mt-16">
                    <Button size="lg" asChild>
                        <Link href="/signup">Get Your Unfair Advantage <ArrowRight className="ml-2" /></Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}
