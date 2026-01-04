'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, Send, Sparkles, User, MessageSquare, Star } from 'lucide-react';
import { aiMockInterviewer, AIMockInterviewerOutput } from '@/ai/ai-mock-interviewer';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

const setupSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters.'),
});

const responseSchema = z.object({
  userResponse: z.string().min(10, 'Please provide a more detailed response.'),
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
  feedback?: string;
  score?: number;
};

export default function MockInterviewerPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastResponse, setLastResponse] = useState<AIMockInterviewerOutput | null>(null);

  const setupForm = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
  });

  const responseForm = useForm<z.infer<typeof responseSchema>>({
    resolver: zodResolver(responseSchema),
  });

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
        userResponse: 'Hello, thank you for having me.',
        interviewQuestion: "Let's get started. Please introduce yourself.",
      });
      setMessages([{ role: 'assistant', content: result.nextQuestion }]);
      setLastResponse(result);
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

    setIsLoading(true);
    const newMessages: Message[] = [
        ...messages, 
        { role: 'user', content: values.userResponse }
    ];
    setMessages(newMessages);
    responseForm.reset();

    try {
      const result = await aiMockInterviewer({
        jobDescription: jobDescription,
        userResponse: values.userResponse,
        interviewQuestion: lastResponse.nextQuestion,
        previousConversation: lastResponse.conversationHistory,
      });

      setMessages([
          ...newMessages,
          { 
              role: 'assistant', 
              content: result.nextQuestion, 
              feedback: result.feedback, 
              score: result.score 
          }
      ]);
      setLastResponse(result);

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to get response' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isStarted) {
    return (
      <>
        <PageHeader
          title="AI Mock Interviewer"
          description="First, provide the job description for the role you're practicing for."
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

  return (
    <>
      <PageHeader
        title="Mock Interview in Progress"
        description="Respond to the AI's questions below. You'll receive feedback after each answer."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-lg border border-border/20 flex flex-col">
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><MessageSquare/> Interview Chat</CardTitle>
            </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4 mb-4 h-96">
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
            {lastResponse && messages.some(m => m.role === 'user') ? (
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
