import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-resume-against-job-description.ts';
import '@/ai/flows/generate-linkedin-post.ts';
import '@/ai/flows/store-and-recall-linkedin-posts.ts';
import '@/ai/flows/skill-gap-navigator.ts';