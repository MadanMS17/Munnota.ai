'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateLearningRoadmap, SkillGapNavigatorOutput } from '@/ai/flows/skill-gap-navigator';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { Bot, Loader2, Compass } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  targetRole: z.string().min(3, 'Target role must be at least 3 characters.'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters.'),
});

export default function SkillGapNavigatorPage() {
  const { user } = useUser();
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
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setIsGenerating(true);
    setRoadmap(null);

    try {
      const result = await generateLearningRoadmap(values);
      setRoadmap(result);
      toast({ title: 'Roadmap Generated', description: 'Your personalized learning roadmap is ready.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: 'Could not generate roadmap. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  }

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
              {roadmap ? (
                 <ScrollArea className="h-[60vh] w-full">
                    <pre className="whitespace-pre-wrap text-sm text-foreground p-4 bg-muted/20 rounded-md font-sans">
                        {roadmap.learningRoadmap}
                    </pre>
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
