'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateLearningRoadmap, SkillGapNavigatorOutput } from '@/ai/flows/skill-gap-navigator';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { Bot, Loader2, Compass, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  targetRole: z.string().min(3, 'Target role must be at least 3 characters.').default(''),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters.').default(''),
});

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

export default function SkillGapNavigatorPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [roadmap, setRoadmap] = useState<SkillGapNavigatorOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetRole: '',
      jobDescription: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setIsGenerating(true);
    setRoadmap(null);

    try {
      const result = await generateLearningRoadmap(values);
      setRoadmap(result);
      toast({ title: 'Roadmap Generated', description: 'Your personalized learning roadmap is ready.' });

      // Automatically save the result
      try {
        const roadmapsCollectionRef = collection(firestore, 'users', user.uid, 'skill_gap_roadmaps');
        await addDoc(roadmapsCollectionRef, {
          roadmap: result.learningRoadmap,
          targetRole: values.targetRole,
          jobDescription: values.jobDescription,
          creationDate: serverTimestamp(),
          userId: user.uid,
        });
        toast({
            title: "Roadmap Saved",
            description: "Your roadmap has been saved to your history."
        });
      } catch (saveError) {
          console.error("Failed to save roadmap", saveError);
          toast({
              variant: "destructive",
              title: "Save Failed",
              description: "Could not save the roadmap to your history."
          });
      }

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: 'Could not generate roadmap. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  }

  const parseRoadmap = (text: string) => {
    if (!text) return [];
    return text
      .split(/(\*\*Week \d+:.*?\*\*)/)
      .filter(part => part.trim() !== '')
      .reduce((acc, part, index, array) => {
        if (part.startsWith('**Week')) {
          const title = part.replace(/\*\*/g, '');
          const content = array[index + 1] || '';
          acc.push({ title: title.trim(), content: content.trim() });
        }
        return acc;
      }, [] as { title: string, content: string }[]);
  };

  const parsedRoadmap = roadmap ? parseRoadmap(roadmap.learningRoadmap) : [];

  return (
    <>
      <PageHeader
        title="Skill Gap Navigator"
        description="Chart your course to a new role. Get a 30-day personalized learning roadmap with resources and projects."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="bg-card/50 backdrop-blur-lg border border-border/20 sticky top-20">
            <CardHeader>
              <CardTitle>Define Your Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="targetRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., AI Engineer, Frontend Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ideal Job Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Paste a job description you're aiming for..." className="min-h-[150px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isGenerating} className="w-full">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Compass className="mr-2 h-4 w-4" />}
                    Generate Roadmap
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-card/50 backdrop-blur-lg border border-border/20 min-h-[500px]">
            <CardHeader>
              <CardTitle>Your 30-Day Learning Roadmap</CardTitle>
              <CardDescription>Follow this plan to gain the skills you need for your target role.</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating && (
                <div className="flex flex-col items-center justify-center h-full pt-16">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">Generating your personalized roadmap...</p>
                </div>
              )}
              {roadmap && parsedRoadmap.length > 0 ? (
                <ScrollArea className="h-[60vh] w-full pr-4">
                  <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                    {parsedRoadmap.map((week, index) => (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline text-left">
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
                                    <span className="mt-1">
                                      &bull;
                                    </span>
                                    <span><RenderLine line={trimmedLine.substring(2)} /></span>
                                  </p>
                                );
                              }

                              if (trimmedLine.endsWith(':')) {
                                return <h4 key={i} className="font-semibold text-foreground mt-4 mb-1"><RenderLine line={trimmedLine} /></h4>
                              }

                              return <p key={i}><RenderLine line={trimmedLine} /></p>
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              ) : !isGenerating && (
                <div className="flex flex-col items-center justify-center h-full pt-16 text-center">
                  <Compass className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Your learning journey starts here. Fill out the form to generate your roadmap.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
