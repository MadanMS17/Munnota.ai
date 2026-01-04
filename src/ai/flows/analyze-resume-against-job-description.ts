'use server';
/**
 * @fileOverview Analyzes a resume against a job description to identify keyword matches and gaps, providing suggestions to optimize the resume for ATS.
 *
 * - analyzeResume - A function that handles the resume analysis process.
 * - AnalyzeResumeInput - The input type for the analyzeResume function.
 * - AnalyzeResumeOutput - The return type for the analyzeResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  jobDescription: z.string().describe('The target job description.'),
});
export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

const AnalyzeResumeOutputSchema = z.object({
  overallScore: z.number().describe('The overall ATS score of the resume (0-100).'),
  studentProjectPortfolioScore: z
    .number()
    .describe('The score for the student project portfolio (0-100).'),
  technicalKnowledgeScore: z
    .number()
    .describe('The score for technical knowledge (0-100).'),
  keywordScore: z
    .number()
    .describe('The score based on keyword matches and context (0-100).'),
  keywordMatches: z.array(z.string()).describe('List of keywords matched in the resume.'),
  keywordGaps: z.array(z.string()).describe('List of keywords missing from the resume.'),
  suggestions: z.string().describe('Specific suggestions to optimize the resume for ATS.'),
});
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  return analyzeResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeResumePrompt',
  input: {schema: AnalyzeResumeInputSchema},
  output: {schema: AnalyzeResumeOutputSchema},
  prompt: `You are an expert resume analyst, specializing in Applicant Tracking Systems (ATS) optimization.

You will analyze the resume against the provided job description and provide an ATS score based on the following parameters:

- Student Project Portfolio: Assesses the relevance and quality of student projects in relation to the job description's tech stack.
- Technical Knowledge: Evaluates the depth and breadth of technical skills demonstrated in the resume.
- Keywords with Context: Identifies keyword matches between the resume and job description, considering the context in which they are used.

Provide a score (0-100) for each parameter and an overall ATS score (0-100).
List the keywords matched and keywords missing from the resume compared to the job description.
Provide specific suggestions to optimize the resume for ATS, focusing on keyword integration and content enhancement.

Resume:
{{media url=resumeDataUri}}

Job Description:
{{jobDescription}}`,
});

const analyzeResumeFlow = ai.defineFlow(
  {
    name: 'analyzeResumeFlow',
    inputSchema: AnalyzeResumeInputSchema,
    outputSchema: AnalyzeResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
