'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { analyzeResume, AnalyzeResumeOutput } from '@/ai/flows/analyze-resume-against-job-description';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { Bot, FileUp, Loader2, BarChart, CheckCircle, XCircle, Trash2, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { addDoc, collection, serverTimestamp, doc, deleteDoc, query, orderBy, limit, writeBatch } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MAX_RESUMES = 2;
const MAX_FILE_SIZE_MB = 3;

const formSchema = z.object({
  resume: z.union([
    z.any().refine(files => files?.length === 1, { message: 'Resume file is required.' })
          .refine(files => files?.[0]?.size <= MAX_FILE_SIZE_MB * 1024 * 1024, { message: `Max file size is ${MAX_FILE_SIZE_MB}MB.` }),
    z.string().min(1, { message: 'Please select a resume.' })
  ]),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters.'),
});

type ResumeDoc = {
    id: string;
    resumeName: string;
    resumeUrl: string;
    createdAt: any;
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


export default function ResumeAnalyzerPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const resumesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const resumesRef = collection(firestore, 'users', user.uid, 'resumes');
    return query(resumesRef, orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: resumes, isLoading: resumesLoading } = useCollection<ResumeDoc>(resumesQuery);

  const [analysisResult, setAnalysisResult] = useState<AnalyzeResumeOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<FileList | null>(null);
  const [selectedResume, setSelectedResume] = useState<string | undefined>(undefined);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (resumes && resumes.length > 0 && !selectedResume) {
      const defaultResumeId = resumes[0].id;
      setSelectedResume(defaultResumeId);
      form.setValue('resume', defaultResumeId);
    }
  }, [resumes, selectedResume, form]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  async function handleResumeUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    
    if (resumes && resumes.length >= MAX_RESUMES) {
      setFileToUpload(files);
      setDeleteDialogOpen(true);
    } else {
      await uploadResume(files[0]);
    }
  }

  async function uploadResume(file: File) {
    if (!user || !firestore) return;

    const resumeDataUri = await fileToBase64(file);
    const newResumeRef = collection(firestore, 'users', user.uid, 'resumes');
    const newDoc = await addDoc(newResumeRef, {
        resumeName: file.name,
        resumeUrl: resumeDataUri,
        createdAt: serverTimestamp(),
        userId: user.uid,
    });
    
    toast({ title: 'Success', description: 'Resume uploaded successfully.' });
    setSelectedResume(newDoc.id); // Select the new resume
    form.setValue('resume', newDoc.id);
  }

  async function handleDeleteConfirmation() {
    if (!resumeToDelete || !fileToUpload || !user || !firestore) return;
    
    const docRef = doc(firestore, 'users', user.uid, 'resumes', resumeToDelete);
    await deleteDoc(docRef);

    setDeleteDialogOpen(false);
    toast({ title: 'Success', description: 'Resume deleted.' });
    
    await uploadResume(fileToUpload[0]);
    setFileToUpload(null);
    setResumeToDelete(null);
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
        let resumeDataUri: string;
        let resumeName: string = "Uploaded Resume";

        if (typeof values.resume === 'string') {
            const selected = resumes?.find(r => r.id === values.resume);
            if (!selected) throw new Error("Selected resume not found.");
            resumeDataUri = selected.resumeUrl;
            resumeName = selected.resumeName;
        } else {
            const resumeFile = values.resume[0];
            resumeDataUri = await fileToBase64(resumeFile);
            resumeName = resumeFile.name;
        }


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
            resumeName,
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
                
                <FormField
                    control={form.control}
                    name="resume"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Resumes</FormLabel>
                            <FormDescription>Select a resume to analyze or upload a new one. You can store up to {MAX_RESUMES}.</FormDescription>
                            
                            {resumesLoading && <Skeleton className="h-20 w-full" />}
                            
                            {!resumesLoading && resumes && resumes.length > 0 && (
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setSelectedResume(value);
                                        }}
                                        value={field.value}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
                                    >
                                        {resumes.map((resume) => (
                                            <div key={resume.id} className="flex-1">
                                                <RadioGroupItem value={resume.id} id={resume.id} className="sr-only peer" />
                                                <Label 
                                                    htmlFor={resume.id}
                                                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                                >
                                                    <FileText className="mb-2 h-6 w-6" />
                                                    <span className="truncate">{resume.resumeName}</span>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                            )}
                           
                            <div className="flex items-center gap-4 pt-2">
                                <div className="relative flex-1">
                                    <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        type="file" 
                                        className="pl-10" 
                                        accept=".pdf,.doc,.docx,.txt" 
                                        onChange={(e) => handleResumeUpload(e.target.files)} 
                                    />
                                </div>
                            </div>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                
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
                <Button type="submit" disabled={isAnalyzing} className={cn(
                    'animated-gradient-button',
                    isAnalyzing ? 'bg-muted' : 'bg-background'
                )}>
                  {isAnalyzing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Analyzing...</span>
                    </>
                    ) : (
                    <>
                        <BarChart className="mr-2 h-4 w-4" />
                        <span>Analyze</span>
                    </>
                    )
                  }
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
                    <h3 className="font-semibold text-lg mb-4 flex items-center"><Bot className="h-5 w-5 mr-2 text-primary" /> Optimization Suggestions</h3>
                    <div className="bg-muted/20 p-6 rounded-md">
                        <Suggestions suggestions={analysisResult.suggestions} />
                    </div>
                </div>

            </CardContent>
          </Card>
        )}
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Resume Limit Reached</AlertDialogTitle>
                    <AlertDialogDescription>
                        You can only store up to {MAX_RESUMES} resumes. Please select one to delete to continue.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <RadioGroup onValueChange={setResumeToDelete} className="gap-4 py-4">
                    {resumes?.map(resume => (
                         <div key={resume.id} className="flex-1">
                            <RadioGroupItem value={resume.id} id={`delete-${resume.id}`} className="sr-only peer" />
                            <Label 
                                htmlFor={`delete-${resume.id}`}
                                className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-destructive [&:has([data-state=checked])]:border-destructive"
                            >
                                <span className="truncate">{resume.resumeName}</span>
                                <Trash2 className="h-5 w-5 text-destructive opacity-50 peer-data-[state=checked]:opacity-100" />
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setFileToUpload(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirmation} disabled={!resumeToDelete} className={buttonVariants({ variant: "destructive" })}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete and Upload
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </>
  );
}

    
