'use server';

/**
 * @fileOverview A LinkedIn post generator AI agent.
 *
 * - generateLinkedInPost - A function that handles the generation of LinkedIn posts.
 * - GenerateLinkedInPostInput - The input type for the generateLinkedInPost function.
 * - GenerateLinkedInPostOutput - The return type for the generateLinkedInPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLinkedInPostInputSchema = z.object({
  projectDetails: z.string().describe('Details about the project or achievement to highlight in the post.'),
  tone: z.enum(['professional', 'casual', 'hype']).describe('The desired tone of the LinkedIn post.'),
});
export type GenerateLinkedInPostInput = z.infer<typeof GenerateLinkedInPostInputSchema>;

const GenerateLinkedInPostOutputSchema = z.object({
  post: z.string().describe('The generated LinkedIn post.'),
});
export type GenerateLinkedInPostOutput = z.infer<typeof GenerateLinkedInPostOutputSchema>;

export async function generateLinkedInPost(input: GenerateLinkedInPostInput): Promise<GenerateLinkedInPostOutput> {
  return generateLinkedInPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLinkedInPostPrompt',
  input: {schema: GenerateLinkedInPostInputSchema},
  output: {schema: GenerateLinkedInPostOutputSchema},
  prompt: `You are an expert LinkedIn post writer, skilled at creating engaging content that attracts HR professionals and hiring managers.  Write a LinkedIn post based on the following project details, using the specified tone.

Project Details: {{{projectDetails}}}

Tone: {{{tone}}}

Make sure the post will attract users and HR on linkedIn. Optimize it to get most engagement. Fully optimized to attract HR and hiring managers.`,
});

const generateLinkedInPostFlow = ai.defineFlow(
  {
    name: 'generateLinkedInPostFlow',
    inputSchema: GenerateLinkedInPostInputSchema,
    outputSchema: GenerateLinkedInPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
