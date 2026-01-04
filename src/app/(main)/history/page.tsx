'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { BarChart, CheckCircle, Clipboard, ExternalLink, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface Post {
  id: string;
  content: string;
  creationDate: Date;
  tone: string;
  projectDetails: string;
}

interface ResumeAnalysis {
    id: string;
    overallScore: number;
    studentProjectPortfolioScore: number;
    technicalKnowledgeScore: number;
    keywordScore: number;
    keywordMatches: string[];
    keywordGaps: string[];
    suggestions: string;
    jobDescription: string;
    analysisDate: Date;
}

interface SkillGapRoadmap {
    id: string;
    targetRole: string;
    jobDescription: string;
    roadmap: string;
    creationDate: Date;
}

const RenderLine = ({ line }: { line: string }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = line.split(urlRegex);
  
    return (
      <>
        {parts.map((part, index) => {
          if (part.match(urlRegex)) {
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80 inline-flex items-center gap-1"
              >
                {part} <ExternalLink className="h-3 w-3" />
              </a>
            );
          }
          return part;
        })}
      </>
    );
  };

const parseRoadmap = (text: string) => {
    if (!text) return [];
    
    const weekHeaders = text.match(/\*\*.+?\*\*/g) || [];
    if (weekHeaders.length === 0) return [];
    
    const splitPattern = new RegExp(`(${weekHeaders.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    const parts = text.split(splitPattern).filter(p => p.trim());

    const result: { title: string, content: string }[] = [];

    for (let i = 0; i < parts.length; i += 2) {
      if (parts[i] && parts[i+1]) {
        result.push({
          title: parts[i].replace(/\*\*/g, '').trim(),
          content: parts[i+1].trim(),
        });
      }
    }
    return result;
};

const Suggestions = ({ suggestions }: { suggestions: string }) => {
    const introMatch = suggestions.match(/^(.*?)(?=1\.\s)/s);
    const intro = introMatch ? introMatch[1].trim() : '';
    const itemsText = introMatch ? suggestions.substring(introMatch[0].length) : suggestions;
  
    const suggestionItems = itemsText.split(/\s*(?=\d+\.\s)/).filter(s => s.trim().length > 0);
  
    return (
      <div className="space-y-4">
        {intro && <p className="text-muted-foreground mb-6">{intro}</p>}
        {suggestionItems.map((item, index) => {
          const match = item.match(/(\d+)\.\s(?:_|\*)*(.+?)(?:_|\*)*:\s*(.*)/s);
          
          if (!match) {
            return <p key={index} className="text-muted-foreground">{item.replace(/\*\*/g, '')}</p>;
          }
          
          const [, number, title, description] = match;
          
          return (
            <div key={number} className="flex gap-4 items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold mt-1">
                  {number}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{title}</h4>
                <p className="text-muted-foreground">{description.replace(/\*\*/g, '')}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ScoreCard = ({ title, score, description }: { title: string; score: number, description: string }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-4xl">{score}/100</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-xs text-muted-foreground">{description}</div>
        </CardContent>
        <CardContent>
            <Progress value={score} aria-label={`${title} score`} />
        </CardContent>
    </Card>
)

export default function HistoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [analyses, setAnalyses] = useState<ResumeAnalysis[]>([]);
  const [roadmaps, setRoadmaps] = useState<SkillGapRoadmap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user || !firestore) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const postQuery = query(collection(firestore, 'posts', user.uid, 'linkedin_posts'), orderBy('timestamp', 'desc'));
        const analysesQuery = query(collection(firestore, 'users', user.uid, 'resume_analyses'), orderBy('analysisDate', 'desc'));
        const roadmapsQuery = query(collection(firestore, 'users', user.uid, 'skill_gap_roadmaps'), orderBy('creationDate', 'desc'));

        const [postSnapshot, analysesSnapshot, roadmapsSnapshot] = await Promise.all([
            getDocs(postQuery),
            getDocs(analysesQuery),
            getDocs(roadmapsQuery),
        ]);

        const fetchedPosts: Post[] = postSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                content: data.post, // Note: field name is 'post' in linkedin-post-generator
                creationDate: (data.timestamp as Timestamp)?.toDate() || new Date(),
                tone: data.tone,
                projectDetails: data.projectDetails,
            }
        });

        const fetchedAnalyses: ResumeAnalysis[] = analysesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                analysisDate: (data.analysisDate as Timestamp)?.toDate() || new Date(),
            } as ResumeAnalysis;
        });
        
        const fetchedRoadmaps: SkillGapRoadmap[] = roadmapsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                creationDate: (data.creationDate as Timestamp)?.toDate() || new Date(),
            } as SkillGapRoadmap;
        });

        setPosts(fetchedPosts);
        setAnalyses(fetchedAnalyses);
        setRoadmaps(fetchedRoadmaps);

      } catch (error) {
        console.error("Error fetching history: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch your history.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user, toast, firestore]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Content copied to clipboard.' });
  }

  return (
    <>
      <PageHeader
        title="Your History"
        description="Review your generated content and past analyses."
      />
      <Tabs defaultValue="linkedin" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="linkedin">LinkedIn Posts</TabsTrigger>
          <TabsTrigger value="resume">Resume Analysis</TabsTrigger>
          <TabsTrigger value="roadmap">Skill Roadmaps</TabsTrigger>
          <TabsTrigger value="interviews" disabled>Mock Interviews</TabsTrigger>
        </TabsList>
        <TabsContent value="linkedin">
          <Card className="bg-card/50 backdrop-blur-lg border border-border/20">
            <CardHeader>
              <CardTitle>Generated LinkedIn Posts</CardTitle>
              <CardDescription>
                A log of all the LinkedIn posts you've generated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                {!loading && posts.length === 0 && <p className="text-muted-foreground text-center py-8">No posts generated yet.</p>}
                {!loading && posts.map((post) => (
                  <div key={post.id} className="p-4 rounded-lg bg-muted/30 border">
                    <div className="flex justify-between items-start mb-2 gap-4">
                        <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(post.creationDate, { addSuffix: true })}
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(post.content)}>
                            <Clipboard className="h-4 w-4 mr-2" /> Copy Post
                        </Button>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="resume">
          <Card className="bg-card/50 backdrop-blur-lg border border-border/20">
            <CardHeader>
              <CardTitle>Resume Analyses</CardTitle>
              <CardDescription>A log of all your resume analyses.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-6">
                {loading && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                {!loading && analyses.length === 0 && <p className="text-muted-foreground text-center py-8">No resume analyses performed yet.</p>}
                {!loading && analyses.map((analysis) => (
                    <Accordion type="single" collapsible className="w-full" key={analysis.id}>
                        <AccordionItem value={analysis.id}>
                            <AccordionTrigger className="text-md font-semibold hover:no-underline text-left p-4 rounded-lg bg-muted/30 border">
                                <div className="flex justify-between items-center w-full">
                                    <div className="w-full overflow-hidden">
                                        <p className="font-semibold">Overall Score: <span className="text-primary">{analysis.overallScore}/100</span></p>
                                        <p className="text-sm text-muted-foreground truncate">For job: {analysis.jobDescription}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground flex-shrink-0 ml-4">
                                        {formatDistanceToNow(analysis.analysisDate, { addSuffix: true })}
                                    </p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <ScoreCard title="Project Portfolio" score={analysis.studentProjectPortfolioScore} description="Relevance of projects to JD tech stack."/>
                                        <ScoreCard title="Technical Knowledge" score={analysis.technicalKnowledgeScore} description="Depth and breadth of technical skills."/>
                                        <ScoreCard title="Keyword Match" score={analysis.keywordScore} description="Contextual keyword alignment with JD."/>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2 flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Matched Keywords</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.keywordMatches.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2 flex items-center"><XCircle className="h-5 w-5 mr-2 text-red-500" /> Missing Keywords</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.keywordGaps.map(kw => <Badge key={kw} variant="destructive">{kw}</Badge>)}
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="font-semibold text-lg mb-4 flex items-center"><BarChart className="h-5 w-5 mr-2 text-primary" /> Optimization Suggestions</h3>
                                        <div className="bg-muted/20 p-6 rounded-md">
                                            <Suggestions suggestions={analysis.suggestions} />
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="roadmap">
          <Card className="bg-card/50 backdrop-blur-lg border border-border/20">
            <CardHeader>
              <CardTitle>Skill Gap Roadmaps</CardTitle>
              <CardDescription>A log of all your generated learning roadmaps.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {loading && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-60 w-full" />)}
                {!loading && roadmaps.length === 0 && <p className="text-muted-foreground text-center py-8">No roadmaps generated yet.</p>}
                {!loading && roadmaps.map((roadmap) => {
                    const parsed = parseRoadmap(roadmap.roadmap);
                    return (
                        <div key={roadmap.id} className="p-4 rounded-lg bg-muted/30 border">
                            <div className="flex justify-between items-start mb-2 gap-4">
                                <div>
                                    <p className="font-semibold text-lg">{roadmap.targetRole}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Generated {formatDistanceToNow(roadmap.creationDate, { addSuffix: true })}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleCopy(roadmap.roadmap)}>
                                    <Clipboard className="h-4 w-4 mr-2" /> Copy Roadmap
                                </Button>
                            </div>
                            <Accordion type="single" collapsible className="w-full">
                                {parsed.map((week, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger className="text-md font-semibold hover:no-underline text-left">
                                        {week.title}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="prose prose-invert max-w-none text-muted-foreground space-y-2">
                                            {week.content.split('\n').map((line, i) => {
                                            const trimmedLine = line.trim().replace(/\*\*/g, '');
                                            if (!trimmedLine) return null;

                                            if (trimmedLine.startsWith('- ')) {
                                                return (
                                                <p key={i} className="ml-4 flex items-start gap-2">
                                                    <span className="mt-1">&bull;</span>
                                                    <span><RenderLine line={trimmedLine.substring(2)} /></span>
                                                </p>
                                                );
                                            }
                                            if (trimmedLine.endsWith(':')) {
                                                return <h4 key={i} className="font-semibold text-foreground mt-4 mb-1"><RenderLine line={trimmedLine} /></h4>
                                            }
                                            return <p key={i}><RenderLine line={trimmedLine}/></p>
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
