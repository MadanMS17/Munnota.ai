'use server';

/**
 * @fileOverview Skill Gap Navigator AI agent.
 *
 * - generateLearningRoadmap - A function that generates a 30-day learning roadmap tailored to a target role.
 * - SkillGapNavigatorInput - The input type for the generateLearningRoadmap function.
 * - SkillGapNavigatorOutput - The return type for the generateLearningRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SkillGapNavigatorInputSchema = z.object({
  targetRole: z.string().describe('The target role (e.g., AI Engineer, Frontend Dev).'),
  jobDescription: z.string().describe('The job description of the target role.'),
});
export type SkillGapNavigatorInput = z.infer<typeof SkillGapNavigatorInputSchema>;

const SkillGapNavigatorOutputSchema = z.object({
  learningRoadmap: z.string().describe('A 30-day learning roadmap tailored to the target role, including topics, resources, and GitHub links.'),
});
export type SkillGapNavigatorOutput = z.infer<typeof SkillGapNavigatorOutputSchema>;

export async function generateLearningRoadmap(input: SkillGapNavigatorInput): Promise<SkillGapNavigatorOutput> {
  return generateLearningRoadmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'skillGapNavigatorPrompt',
  input: {schema: SkillGapNavigatorInputSchema},
  output: {schema: SkillGapNavigatorOutputSchema},
  prompt: `You are an AI career coach specializing in creating personalized learning roadmaps.

  Based on the target role and job description provided, generate a detailed 30-day learning roadmap with specific topics to cover each week, recommended online courses or tutorials, and relevant GitHub repositories for hands-on practice.

  Target Role: {{{targetRole}}}
  Job Description: {{{jobDescription}}}

  The roadmap should be structured as follows:

  **Week 1: [Topic]**
  - [Specific subtopics to learn]
  - Resources: [Links to courses, tutorials, or documentation]
  - GitHub: [Links to relevant repositories for practice]

  **Week 2: [Topic]**
  - [Specific subtopics to learn]
  - Resources: [Links to courses, tutorials, or documentation]
  - GitHub: [Links to relevant repositories for practice]

  **Week 3: [Topic]**
  - [Specific subtopics to learn]
  - Resources: [Links to courses, tutorials, or documentation]
  - GitHub: [Links to relevant repositories for practice]

  **Week 4: [Topic]**
  - [Specific subtopics to learn]
  - Resources: [Links to courses, tutorials, or documentation]
  - GitHub: [Links to relevant repositories for practice]

  Ensure that the roadmap is practical, actionable, and tailored to help the user acquire the necessary skills to excel in the target role.
  `,
});

const generateLearningRoadmapFlow = ai.defineFlow(
  {
    name: 'generateLearningRoadmapFlow',
    inputSchema: SkillGapNavigatorInputSchema,
    outputSchema: SkillGapNavigatorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
