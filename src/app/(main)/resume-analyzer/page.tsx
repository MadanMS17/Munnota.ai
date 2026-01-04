'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { analyzeResume, AnalyzeResumeOutput } from '@/ai/flows/analyze-resume-against-job-description';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { Bot, FileUp, Loader2, BarChart, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  resume: z.any().refine(file => file?.length == 1, 'Resume is required.'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters.'),
});

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

export default function ResumeAnalyzerPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResumeOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const resumeFile = values.resume[0];
      const resumeDataUri = await fileToBase64(resumeFile);

      const result = await analyzeResume({
        resumeDataUri,
        jobDescription: values.jobDescription,
      });
      setAnalysisResult(result);
      toast({ title: 'Analysis Complete', description: 'Your resume has been successfully analyzed.' });

      // Automatically save the result
      try {
        const analysesCollectionRef = collection(firestore, 'users', user.uid, 'resume_analyses');
        await addDoc(analysesCollectionRef, {
            ...result,
            jobDescription: values.jobDescription,
            analysisDate: serverTimestamp(),
            userId: user.uid,
        });
        toast({
            title: "Analysis Saved",
            description: "Your resume analysis has been saved to your history."
        });
      } catch (saveError) {
        console.error("Failed to save analysis", saveError);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save the analysis to your history."
        });
      }

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Something went wrong. Please try again.' });
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Resume Analyzer & ATS Optimizer"
        description="Get an in-depth analysis of your resume against a job description and optimize it for Applicant Tracking Systems (ATS)."
      />
      <div className="space-y-8">
        <Card className="bg-card/50 backdrop-blur-lg border border-border/20">
            <CardHeader>
                <CardTitle>Analyze Your Resume</CardTitle>
            </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="resume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Your Resume</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input type="file" className="pl-10" accept=".pdf,.doc,.docx" onChange={(e) => field.onChange(e.target.files)} />
                        </div>
                      </FormControl>
                      <FormDescription>PDF, DOC, or DOCX files are accepted.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Job Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Paste the job description here..." className="min-h-[200px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isAnalyzing}>
                  {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart className="mr-2 h-4 w-4" />}
                  Analyze
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {isAnalyzing && (
            <div className="text-center p-8">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary"/>
                <p className="mt-4 text-muted-foreground">Analyzing your resume... this may take a moment.</p>
            </div>
        )}

        {analysisResult && (
          <Card className="bg-card/50 backdrop-blur-lg border border-border/20">
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>Overall ATS Score: <span className="text-primary font-bold text-2xl">{analysisResult.overallScore}/100</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ScoreCard title="Project Portfolio" score={analysisResult.studentProjectPortfolioScore} description="Relevance of projects to JD tech stack."/>
                    <ScoreCard title="Technical Knowledge" score={analysisResult.technicalKnowledgeScore} description="Depth and breadth of technical skills."/>
                    <ScoreCard title="Keyword Match" score={analysisResult.keywordScore} description="Contextual keyword alignment with JD."/>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Matched Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                            {analysisResult.keywordMatches.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center"><XCircle className="h-5 w-5 mr-2 text-red-500" /> Missing Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                            {analysisResult.keywordGaps.map(kw => <Badge key={kw} variant="destructive">{kw}</Badge>)}
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center"><Bot className="h-5 w-5 mr-2 text-primary" /> Optimization Suggestions</h3>
                    <div className="prose prose-invert max-w-none text-muted-foreground bg-muted/20 p-4 rounded-md">
                        <p>{analysisResult.suggestions}</p>
                    </div>
                </div>

            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
