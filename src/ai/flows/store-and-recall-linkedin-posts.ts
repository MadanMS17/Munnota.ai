'use server';
/**
 * @fileOverview Saves and recalls LinkedIn posts to maintain a consistent tone.
 *
 * - storeAndRecallLinkedInPosts - A function that stores and recalls LinkedIn posts.
 * - StoreAndRecallLinkedInPostsInput - The input type for the storeAndRecallLinkedInPosts function.
 * - StoreAndRecallLinkedInPostsOutput - The return type for the storeAndRecallLinkedInPosts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {Firestore} from '@google-cloud/firestore';

const StoreAndRecallLinkedInPostsInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  newPost: z.string().describe('The new LinkedIn post to store.'),
  prompt: z.string().describe('Prompt to generate new Linkedin post.'),
});
export type StoreAndRecallLinkedInPostsInput = z.infer<typeof StoreAndRecallLinkedInPostsInputSchema>;

const StoreAndRecallLinkedInPostsOutputSchema = z.object({
  updatedPrompt: z.string().describe('Updated prompt with previous posts.'),
});
export type StoreAndRecallLinkedInPostsOutput = z.infer<typeof StoreAndRecallLinkedInPostsOutputSchema>;

export async function storeAndRecallLinkedInPosts(input: StoreAndRecallLinkedInPostsInput): Promise<StoreAndRecallLinkedInPostsOutput> {
  return storeAndRecallLinkedInPostsFlow(input);
}

const storeAndRecallLinkedInPostsFlow = ai.defineFlow(
  {
    name: 'storeAndRecallLinkedInPostsFlow',
    inputSchema: StoreAndRecallLinkedInPostsInputSchema,
    outputSchema: StoreAndRecallLinkedInPostsOutputSchema,
  },
  async input => {
    const {
      userId,
      newPost,
      prompt,
    } = input;

    const db = new Firestore();
    const postsCollection = db.collection('posts');
    const userPostsCollection = postsCollection.doc(userId).collection('linkedin_posts');

    // Store the new post
    await userPostsCollection.add({post: newPost, timestamp: new Date()});

    // Recall previous posts
    const snapshot = await userPostsCollection.orderBy('timestamp', 'desc').limit(5).get();
    const previousPosts = snapshot.docs.map(doc => doc.data().post);

    // Update the prompt with previous posts
    let updatedPrompt = prompt;
    if (previousPosts.length > 0) {
      updatedPrompt += `\n\nPrevious posts: ${previousPosts.join('\n')}`;
    }

    return {updatedPrompt};
  }
);
