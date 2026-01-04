'use client';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/app-logo';
import { ArrowRight, Bot, Compass, FileText, Linkedin } from 'lucide-react';
import ColorBends from '@/components/color-bends-background';
import SpotlightCard from '@/components/ui/spotlight-card';
import { GridScan } from '@/components/ui/grid-scan';
import Threads from '@/components/ui/threads';



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
                            <Link href="/signup">Get Started</Link>
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
        <section className="relative flex h-screen min-h-[700px] items-center justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 z-0">
          <ColorBends
            rotation={-180}
            autoRotate={-2}
            speed={0.5}
            scale={1.5}
            frequency={1.2}
            warpStrength={1.2}
            mouseInfluence={2}
            parallax={1.1}
            noise={0.71}
            transparent={true}
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
              <Button size="lg" asChild className="bg-white text-black hover:bg-white/90">
                <Link href="/signup">Start for Free <ArrowRight className="ml-2" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-20 sm:py-32 bg-background overflow-hidden">
            <div className="absolute inset-0 z-0">
                <GridScan
                    sensitivity={0.55}
                    lineThickness={1}
                    linesColor="#200040" 
                    gridScale={0.15}
                    scanColor="#8e2de2"
                    scanOpacity={0.4}
                    enablePost
                    bloomIntensity={0.2}
                    chromaticAberration={0.005}
                    noiseIntensity={0.02}
                />
            </div>
            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">The Ultimate Toolkit for Career Success</h2>
                    <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
                        Stop guessing what recruiters want to see. Get data-driven insights and AI-powered tools to build a winning application.
                    </p>
                </div>
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {features.map((feature) => (
                        <SpotlightCard 
                          key={feature.title} 
                          className="p-8 transition-all duration-300 transform hover:-translate-y-2 border-white/10"
                          spotlightColor="rgba(41, 98, 255, 1)"
                        >
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                {feature.icon}
                            </div>
                            <h3 className="mt-6 text-xl font-bold">{feature.title}</h3>
                            <p className="mt-2 text-muted-foreground">{feature.description}</p>
                        </SpotlightCard>
                    ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="relative py-8 bg-card border-t border-border overflow-hidden">
        <div className="absolute inset-0 z-0">
            <Threads
                amplitude={1}
                distance={0}
                enableMouseInteraction={true}
            />
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
            <AppLogo className="justify-center mb-4"/>
            <p>&copy; {new Date().getFullYear()} CareerFlow.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
