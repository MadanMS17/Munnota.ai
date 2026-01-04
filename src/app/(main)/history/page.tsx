'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useFirestore, useAuth } from '@/firebase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  post: string;
  timestamp: Date;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const postsRef = collection(firestore, 'posts', user.uid, 'linkedin_posts');
        const q = query(postsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedPosts: Post[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedPosts.push({
            id: doc.id,
            post: data.post,
            timestamp: data.timestamp.toDate(),
          });
        });
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch your history.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [user, toast, firestore]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Post content copied to clipboard.' });
  }

  return (
    <>
      <PageHeader
        title="Your History"
        description="Review your generated content and past analyses."
      />
      <Tabs defaultValue="linkedin">
        <TabsList>
          <TabsTrigger value="linkedin">LinkedIn Posts</TabsTrigger>
          <TabsTrigger value="resume" disabled>Resume Analysis</TabsTrigger>
          <TabsTrigger value="roadmap" disabled>Skill Roadmaps</TabsTrigger>
          <TabsTrigger value="interviews" disabled>Mock Interviews</TabsTrigger>
        </TabsList>
        <TabsContent value="linkedin">
          <Card className="bg-card/50 backdrop-blur-lg border border-border/20">
            <CardHeader>
              <CardTitle>Generated LinkedIn Posts</CardTitle>
              <CardDescription>
                A log of all the LinkedIn posts you've generated and saved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {loading && (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                  ))
                )}
                {!loading && posts.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                        You haven't saved any posts yet.
                    </p>
                )}
                {!loading && posts.map((post) => (
                  <div key={post.id} className="p-4 rounded-lg bg-muted/30 border">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(post.timestamp, { addSuffix: true })}
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(post.post)}>
                            <Clipboard className="h-4 w-4 mr-2" />
                            Copy
                        </Button>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{post.post}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
