'use server';

/**
 * @fileOverview AI Mock Interviewer flow that simulates a real-time interview experience, providing feedback and scores.
 *
 * - aiMockInterviewer - A function that conducts an AI mock interview and provides feedback.
 * - AIMockInterviewerInput - The input type for the aiMockInterviewer function.
 * - AIMockInterviewerOutput - The return type for the aiMockInterviewer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIMockInterviewerInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description for the target role.'),
  userResponse: z
    .string()
    .describe('The user response to the interview question.'),
  interviewQuestion: z.string().describe('The current interview question.'),
  previousConversation: z
    .string()
    .optional()
    .describe('The previous conversation in the interview.'),
});
export type AIMockInterviewerInput = z.infer<typeof AIMockInterviewerInputSchema>;

const AIMockInterviewerOutputSchema = z.object({
  feedback: z.string().describe('The feedback on the user response.'),
  score: z.number().describe('The score for the user response (0-100).'),
  nextQuestion: z.string().describe('The next interview question.'),
  conversationHistory: z
    .string()
    .describe('The complete conversation history.'),
});
export type AIMockInterviewerOutput = z.infer<typeof AIMockInterviewerOutputSchema>;

export async function aiMockInterviewer(input: AIMockInterviewerInput): Promise<AIMockInterviewerOutput> {
  return aiMockInterviewerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiMockInterviewerPrompt',
  input: {schema: AIMockInterviewerInputSchema},
  output: {schema: AIMockInterviewerOutputSchema},
  prompt: `You are an AI interviewer conducting a mock interview.

  The job description for the target role is: {{{jobDescription}}}.
  The previous conversation is: {{{previousConversation}}}
  The current interview question is: {{{interviewQuestion}}}.
  The user response is: {{{userResponse}}}.

  Provide feedback on the user response, assign a score (0-100), and generate the next interview question. Also, maintain a conversation history.
  Ensure the score reflects technical knowledge , key words in the user response and context of the previous conversation. All the 3D are scored independently and also provide feedback for improving all.

  Output in the following JSON format:
  {
    "feedback": "The feedback on the user response.",
    "score": The score for the user response (0-100).,
    "nextQuestion": "The next interview question.",
    "conversationHistory": "The complete conversation history, incorporating previous context and the latest exchange.",
  }
  `,
});

const aiMockInterviewerFlow = ai.defineFlow(
  {
    name: 'aiMockInterviewerFlow',
    inputSchema: AIMockInterviewerInputSchema,
    outputSchema: AIMockInterviewerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
