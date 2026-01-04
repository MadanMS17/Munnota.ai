'use client';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, Send, Sparkles, User, MessageSquare, Star, Mic, Keyboard, Volume2, FlagOff } from 'lucide-react';
import { aiMockInterviewer, AIMockInterviewerOutput } from '@/ai/ai-mock-interviewer';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const setupSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters.'),
});

const responseSchema = z.object({
  userResponse: z.string().min(1, 'Please provide a response.'),
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
  feedback?: string;
  score?: number;
};

type InterviewMode = 'text' | 'voice';

// SpeechRecognition and SpeechSynthesis types might not be available in Node.js environment
// We declare them here to avoid TypeScript errors during build.
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export default function MockInterviewerPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [interviewMode, setInterviewMode] = useState<InterviewMode | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastResponse, setLastResponse] = useState<AIMockInterviewerOutput | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // States for voice mode
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const setupForm = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
  });

  const responseForm = useForm<z.infer<typeof responseSchema>>({
    resolver: zodResolver(responseSchema),
  });

  // Text-to-Speech
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (interviewMode === 'voice' && 'speechSynthesis' in window) {
      // Ensure any ongoing speech is stopped when component unmounts or mode changes
      return () => window.speechSynthesis.cancel();
    }
  }, [interviewMode]);


  // Speech-to-Text setup
  useEffect(() => {
    if (interviewMode !== 'voice') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: 'destructive', title: 'Unsupported Browser', description: 'Speech recognition is not supported in this browser.' });
      setInterviewMode('text'); // Fallback to text mode
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
          setTranscript(prev => (prev ? prev + ' ' : '') + finalTranscript.trim());
          responseForm.setValue('userResponse', (responseForm.getValues('userResponse') ? responseForm.getValues('userResponse') + ' ' : '') + finalTranscript.trim());
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
        if (event.error !== 'aborted') {
            console.error('Speech recognition error:', event.error);
            toast({ variant: 'destructive', title: 'Recognition Error', description: event.error });
        }
        setIsListening(false);
    }

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }

  }, [interviewMode, toast, responseForm]);


  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript(''); // Reset transcript for new recording
      responseForm.setValue('userResponse', ''); // Clear form value too
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages])

  const handleStartInterview = async (values: z.infer<typeof setupSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not logged in' });
      return;
    }
    setIsLoading(true);
    setJobDescription(values.jobDescription);
    try {
      const result = await aiMockInterviewer({
        jobDescription: values.jobDescription,
        userResponse: 'Hello, I am ready to start the interview.',
        interviewQuestion: "Let's get started. Please introduce yourself.",
        questionCount: 0,
      });

      const firstQuestion = result.nextQuestion;
      setMessages([{ role: 'assistant', content: firstQuestion }]);
      if (interviewMode === 'voice') speak(firstQuestion);

      setLastResponse(result);
      setQuestionCount(1);
      setIsStarted(true);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to start interview' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResponse = async (values: z.infer<typeof responseSchema>) => {
    if (!user || !lastResponse) return;
    
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    }

    setIsLoading(true);
    const newMessages: Message[] = [
        ...messages, 
        { role: 'user', content: values.userResponse }
    ];
    setMessages(newMessages);
    responseForm.reset();
    setTranscript('');

    try {
      const result = await aiMockInterviewer({
        jobDescription: jobDescription,
        userResponse: values.userResponse,
        interviewQuestion: lastResponse.nextQuestion,
        previousConversation: lastResponse.conversationHistory,
        questionCount: questionCount,
      });
      
      setLastResponse(result);
      
      if (result.isInterviewOver) {
        setMessages([
            ...newMessages,
            { 
                role: 'assistant', 
                content: "Thank you for your time. Here is your final feedback.", 
            }
        ]);
      } else {
        const nextQuestion = result.nextQuestion;
        setMessages([
            ...newMessages,
            { 
                role: 'assistant', 
                content: nextQuestion, 
                feedback: result.feedback, 
                score: result.score 
            }
        ]);
        setQuestionCount(prev => prev + 1);
        if (interviewMode === 'voice') speak(nextQuestion);
      }

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to get response' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndInterview = async () => {
    handleSendResponse({ userResponse: "Thank you, I'd like to end the interview now." });
  }
  
  if (!interviewMode) {
    return (
        <>
            <PageHeader
                title="AI Mock Interviewer"
                description="Practice your interview skills with a real-time AI to build confidence."
            />
            <Card className="max-w-2xl mx-auto bg-card/50 backdrop-blur-lg border border-border/20">
                <CardHeader>
                    <CardTitle>Choose Your Interview Mode</CardTitle>
                    <CardDescription>Select how you'd like to interact with the AI interviewer.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" onClick={() => setInterviewMode('text')}>
                        <Keyboard className="h-8 w-8" />
                        <span className="font-semibold">Text-Based Interview</span>
                        <span className="text-xs text-muted-foreground">Type your responses.</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" onClick={() => setInterviewMode('voice')}>
                        <Volume2 className="h-8 w-8" />
                        <span className="font-semibold">Voice-Based Interview</span>
                        <span className="text-xs text-muted-foreground">Speak your responses.</span>
                    </Button>
                </CardContent>
            </Card>
        </>
    )
  }


  if (!isStarted) {
    return (
      <>
        <PageHeader
          title="AI Mock Interviewer"
          description={`Mode: ${interviewMode === 'text' ? 'Text-Based' : 'Voice-Based'}. First, provide the job description for the role you're practicing for.`}
        />
        <Card className="bg-card/50 backdrop-blur-lg border border-border/20">
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...setupForm}>
              <form onSubmit={setupForm.handleSubmit(handleStartInterview)} className="space-y-6">
                <FormField
                  control={setupForm.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paste the job description below</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., 'Seeking a software engineer with 3+ years of experience in...'" className="min-h-[250px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className={cn('animated-gradient-button p-0', isLoading && 'opacity-50')}>
                  <span>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Start Interview
                  </span>
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </>
    );
  }

  if (lastResponse?.isInterviewOver) {
    return (
        <>
            <PageHeader title="Interview Complete" description="Here is your final report." />
            <Card className="bg-card/50 backdrop-blur-lg border border-border/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Star/> Final Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <p className="text-lg font-semibold">Overall Score</p>
                           <p className="text-4xl font-bold text-primary">{lastResponse.score}/100</p>
                        </div>
                        <Progress value={lastResponse.score} />
                    </div>
                    <Separator />
                    <div>
                        <p className="font-semibold text-lg mb-2">Final Feedback & Analysis</p>
                        <p className="text-muted-foreground whitespace-pre-wrap">{lastResponse.feedback}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => window.location.reload()}>Start New Interview</Button>
                </CardFooter>
            </Card>
        </>
    )
  }

  return (
    <>
      <PageHeader
        title="Mock Interview in Progress"
        description="Respond to the AI's questions below. You'll receive feedback after each answer."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-lg border border-border/20 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className='flex items-center gap-2'><MessageSquare/> Interview Chat</CardTitle>
                <Button variant="destructive" size="sm" onClick={handleEndInterview} disabled={isLoading}>
                    <FlagOff className="mr-2 h-4 w-4" />
                    End Interview
                </Button>
            </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4 mb-4 h-96" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                    {message.role === 'assistant' && (
                      <Avatar className="h-9 w-9 border">
                        <div className="h-full w-full flex items-center justify-center bg-primary rounded-full">
                          <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                      </Avatar>
                    )}
                    <div className={cn("max-w-lg p-3 rounded-lg", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                       <Avatar className="h-9 w-9 border">
                          <div className="h-full w-full flex items-center justify-center bg-muted rounded-full">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                       </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Form {...responseForm}>
                <form onSubmit={responseForm.handleSubmit(handleSendResponse)} className="flex items-start gap-4">
                    {interviewMode === 'text' ? (
                        <FormField
                            control={responseForm.control}
                            name="userResponse"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Textarea placeholder="Type your answer here..." {...field} rows={3} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <div className='flex-1 flex flex-col items-center justify-center gap-2'>
                           <Button type="button" size="icon" onClick={toggleListening} className={cn('h-16 w-16 rounded-full', isListening && 'bg-destructive')}>
                                <Mic className="h-8 w-8" />
                           </Button>
                           <p className="text-sm text-muted-foreground h-4">{isListening ? 'Listening...' : 'Click mic to speak'}</p>
                           <FormField
                                control={responseForm.control}
                                name="userResponse"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormControl>
                                            <Textarea {...field} readOnly className="mt-2 bg-muted/20" placeholder="Your transcribed response will appear here..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                    <Button type="submit" size="icon" disabled={isLoading} className="h-auto aspect-square p-2 self-stretch">
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1 bg-card/50 backdrop-blur-lg border border-border/20">
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><Star /> Last Response Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            {lastResponse && messages.some(m => m.role === 'user') && lastResponse.score !== null ? (
                <>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <p className="font-semibold">Score</p>
                           <p className="text-2xl font-bold text-primary">{lastResponse.score}/100</p>
                        </div>
                        <Progress value={lastResponse.score} />
                    </div>
                    <div>
                        <p className="font-semibold mb-2">Feedback</p>
                        <p className="text-muted-foreground text-sm">{lastResponse.feedback}</p>
                    </div>
                </>
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>Your feedback will appear here after you submit your first response.</p>
                </div>
            )}
            </CardContent>
        </Card>

      </div>
    </>
  );
}
