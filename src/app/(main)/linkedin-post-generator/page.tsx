'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  generateLinkedInPost,
  GenerateLinkedInPostInput,
} from '@/ai/flows/generate-linkedin-post';
import { storeAndRecallLinkedInPosts } from '@/ai/flows/store-and-recall-linkedin-posts';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { Bot, Clipboard, Loader2, Save } from 'lucide-react';

const formSchema = z.object({
  projectDetails: z.string().min(20, {
    message: 'Project details must be at least 20 characters.',
  }),
  tone: z.enum(['professional', 'casual', 'hype'], {
    required_error: 'You need to select a tone.',
  }),
});

export default function LinkedInPostGeneratorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectDetails: '',
      tone: 'professional',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to generate a post.",
        });
        return;
    }
    
    setIsGenerating(true);
    setGeneratedPost('');
    
    try {
      const input: GenerateLinkedInPostInput = {
        projectDetails: values.projectDetails,
        tone: values.tone,
      };
      
      const previousPostsPrompt = await storeAndRecallLinkedInPosts({
        userId: user.uid,
        newPost: "", // Not storing yet
        prompt: `Project Details: ${values.projectDetails}\nTone: ${values.tone}`
      });

      const result = await generateLinkedInPost({
        ...input,
        projectDetails: previousPostsPrompt.updatedPrompt,
      });
      
      setGeneratedPost(result.post);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Failed to generate LinkedIn post. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
    toast({
      title: 'Copied to Clipboard',
      description: 'The post has been copied to your clipboard.',
    });
  };

  const handleSavePost = async () => {
      if (!user || !generatedPost) return;

      setIsSaving(true);
      try {
        await storeAndRecallLinkedInPosts({
            userId: user.uid,
            newPost: generatedPost,
            prompt: "", // Not needed for saving
        });
        toast({
            title: "Post Saved",
            description: "Your LinkedIn post has been saved to your history."
        });
      } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save the post. Please try again."
        });
      } finally {
        setIsSaving(false);
      }
  }

  return (
    <>
      <PageHeader
        title="LinkedIn Post Generator"
        description="Craft engaging LinkedIn posts in seconds. Describe your project, choose a tone, and let our AI do the rest."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/50 backdrop-blur-lg border border-border/20">
          <CardHeader>
            <CardTitle>Create Your Post</CardTitle>
            <CardDescription>Fill in the details below to generate your post.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="projectDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project or Achievement Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'Just deployed a new feature using Next.js and Tailwind CSS that improved page load times by 40%...'"
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be as descriptive as possible for the best results.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Select a Tone</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="professional" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Professional
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="casual" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Casual
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="hype" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Hype
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="mr-2 h-4 w-4" />
                  )}
                  Generate Post
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-lg border border-border/20 flex flex-col">
          <CardHeader>
            <CardTitle>Generated Post</CardTitle>
            <CardDescription>Here's your AI-crafted LinkedIn post. Review and edit as needed.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Textarea
              readOnly
              value={generatedPost}
              placeholder="Your generated post will appear here..."
              className="min-h-[300px] text-base bg-muted/30"
            />
          </CardContent>
          {generatedPost && (
            <CardFooter className="gap-2">
              <Button onClick={handleCopyToClipboard}>
                <Clipboard className="mr-2 h-4 w-4" /> Copy
              </Button>
              <Button variant="outline" onClick={handleSavePost} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save to History
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </>
  );
}
