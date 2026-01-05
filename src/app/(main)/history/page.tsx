'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, Timestamp, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { BarChart, Bot, CheckCircle, Clipboard, ExternalLink, MessageSquare, Star, Trash2, User, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

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

interface MockInterview {
    id: string;
    interviewDate: Date;
    score: number;
    feedback: string;
    transcript: string;
    jobDescription: string;
}

type TranscriptMessage = {
    role: 'user' | 'assistant';
    content: string;
};

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

const parseTranscript = (text: string): TranscriptMessage[] => {
    if (!text) return [];
    return text.split('\n\n').map(line => {
      const [role, ...contentParts] = line.split(': ');
      const content = contentParts.join(': ');
      return {
        role: role.toLowerCase() as 'user' | 'assistant',
        content,
      };
    }).filter(m => m.role && m.content);
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
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterviews, setSelectedInterviews] = useState<string[]>([]);

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
        const interviewsQuery = query(collection(firestore, 'users', user.uid, 'mock_interviews'), orderBy('interviewDate', 'desc'));

        const [postSnapshot, analysesSnapshot, roadmapsSnapshot, interviewsSnapshot] = await Promise.all([
            getDocs(postQuery),
            getDocs(analysesQuery),
            getDocs(roadmapsQuery),
            getDocs(interviewsQuery),
        ]);

        const fetchedPosts: Post[] = postSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                content: data.post,
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

        const fetchedInterviews: MockInterview[] = interviewsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                interviewDate: (data.interviewDate as Timestamp)?.toDate() || new Date(),
            } as MockInterview;
        });

        setPosts(fetchedPosts);
        setAnalyses(fetchedAnalyses);
        setRoadmaps(fetchedRoadmaps);
        setInterviews(fetchedInterviews);

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

  const handleInterviewSelection = (interviewId: string, isSelected: boolean | 'indeterminate') => {
      if (isSelected === true) {
          setSelectedInterviews(prev => [...prev, interviewId]);
      } else {
          setSelectedInterviews(prev => prev.filter(id => id !== interviewId));
      }
  }

  const handleSelectAllInterviews = (isSelected: boolean | 'indeterminate') => {
      if (isSelected === true) {
          setSelectedInterviews(interviews.map(i => i.id));
      } else {
          setSelectedInterviews([]);
      }
  }

  const handleDeleteSelected = async () => {
    if (!user || !firestore || selectedInterviews.length === 0) return;

    try {
        const batch = writeBatch(firestore);
        selectedInterviews.forEach(id => {
            const docRef = doc(firestore, 'users', user.uid, 'mock_interviews', id);
            batch.delete(docRef);
        });
        await batch.commit();
        
        setInterviews(prev => prev.filter(interview => !selectedInterviews.includes(interview.id)));
        setSelectedInterviews([]);
        toast({ title: 'Success', description: `${selectedInterviews.length} interview(s) deleted.` });
    } catch (error) {
        console.error("Error deleting interviews:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete selected interviews.' });
    }
  };

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
          <TabsTrigger value="interviews">Mock Interviews</TabsTrigger>
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
                                <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-2 flex-wrap">
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold">Overall Score: <span className="text-primary">{analysis.overallScore}/100</span></p>
                                        <p className="text-sm text-muted-foreground break-all">For job: {analysis.jobDescription}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground flex-shrink-0 mt-2 sm:mt-0 sm:ml-4">
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
        <TabsContent value="interviews">
          <Card className="bg-card/50 backdrop-blur-lg border border-border/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mock Interview Sessions</CardTitle>
                <CardDescription>A log of all your past interview practice sessions.</CardDescription>
              </div>
              {interviews.length > 0 && (
                 <Button 
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    disabled={selectedInterviews.length === 0}
                 >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedInterviews.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
               <div className="space-y-6">
                {loading && Array.from({ length: 1 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                {!loading && interviews.length === 0 && <p className="text-muted-foreground text-center py-8">No interview sessions found.</p>}
                
                {!loading && interviews.length > 0 && (
                    <div className="flex items-center space-x-2 py-4 border-b">
                        <Checkbox 
                            id="select-all" 
                            onCheckedChange={handleSelectAllInterviews}
                            checked={selectedInterviews.length === interviews.length}
                            aria-label="Select all interviews"
                        />
                        <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
                    </div>
                )}
                
                {!loading && interviews.map((interview) => (
                    <Accordion type="single" collapsible className="w-full" key={interview.id}>
                        <AccordionItem value={interview.id}>
                            <AccordionTrigger className="text-md font-semibold hover:no-underline text-left p-4 rounded-lg bg-muted/30 border">
                                <div className="flex justify-between items-center w-full gap-4">
                                     <Checkbox 
                                        className="mr-4"
                                        checked={selectedInterviews.includes(interview.id)}
                                        onCheckedChange={(checked) => handleInterviewSelection(interview.id, checked)}
                                        onClick={(e) => e.stopPropagation()} // Prevent accordion from toggling
                                    />
                                    <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-2 flex-wrap">
                                        <div className="flex-grow min-w-0">
                                            <p className="font-semibold">Final Score: <span className="text-primary">{interview.score}/100</span></p>
                                            <p className="text-sm text-muted-foreground break-all">For job: {interview.jobDescription}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground flex-shrink-0 mt-2 sm:mt-0 sm:ml-4">
                                            {formatDistanceToNow(interview.interviewDate, { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2 flex items-center"><Star className="h-5 w-5 mr-2 text-yellow-500" /> Final Feedback</h3>
                                        <p className="text-muted-foreground whitespace-pre-wrap bg-muted/20 p-4 rounded-md">{interview.feedback}</p>
                                    </div>

                                    <Separator />
                                    
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2 flex items-center"><MessageSquare className="h-5 w-5 mr-2 text-primary" /> Chat Transcript</h3>
                                        <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/20">
                                            <div className="space-y-4">
                                                {parseTranscript(interview.transcript).map((message, index) => (
                                                    <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                                                        {message.role === 'assistant' && (
                                                        <Avatar className="h-8 w-8 border">
                                                            <div className="h-full w-full flex items-center justify-center bg-primary rounded-full">
                                                                <Bot className="h-4 w-4 text-primary-foreground" />
                                                            </div>
                                                        </Avatar>
                                                        )}
                                                        <div className={cn("max-w-md p-3 rounded-lg text-sm", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background')}>
                                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                                        </div>
                                                        {message.role === 'user' && (
                                                        <Avatar className="h-8 w-8 border">
                                                            <div className="h-full w-full flex items-center justify-center bg-background rounded-full">
                                                                <User className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                        </Avatar>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
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
      </Tabs>
    </>
  );
}

    