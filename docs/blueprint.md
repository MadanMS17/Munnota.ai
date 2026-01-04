# **App Name**: CareerFlow.ai

## Core Features:

- LinkedIn Post Generator: Generates engaging LinkedIn posts based on user-provided project details and desired tone, offering options for professional, casual, or hype styles. Fully optimized to engage users on liked in and attract HR and hiring managers.
- Resume Analysis & ATS Optimizer: Analyzes uploaded resumes against target job descriptions (JD) to identify keyword matches and gaps, providing specific suggestions to align the resume with ATS requirements. The ATS should be scored on 3d parameters like student project portfolio vs JD tech stack , technical knowledge and the key words with its context . The score should be given to all the 3D separately which will help in optimization of resume in detail.
- Skill Gap Navigator: Generates a 30-day learning roadmap tailored to selected target roles (e.g., AI Engineer, Frontend Dev), with its job description providing a structured plan with topics, resources, and GitHub links.
- AI Mock Interviewer: Conducts real-time AI mock interviews with voice/text interaction, providing instant feedback and scores to simulate the interview experience, allowing students to practice and refine their responses.
- Profile & Data Storage: Implements user authentication via Firebase Auth (Google Login) and stores generated posts in a `posts` collection under the user's UID in Firestore.
- History: Generated Linkedin posts should be persisted using Firestore so that the user can view what they created previously. Enable the AI to use previous output to "remember" what the user is trying to accomplish and maintain a consistent tone. The scores of the resume ats provides ,Skill gap & AI mock interviews conducted .

## Style Guidelines:

- Primary color: Deep blue (#2962FF) to evoke trust and professionalism.
- Background color: Dark gray (#242526) for a modern, dark-mode interface with glassmorphism effects.
- Accent color: neno green (#39FF14) for highlights and interactive elements.
- Body and headline font: 'Inter', a grotesque-style sans-serif, with a modern, machined, objective, neutral look
- Use sharp, minimalist icons to represent features and actions.
- Implement a responsive design with clear section divisions and a focus on readability.
- Subtle transitions and animations to guide users and provide feedback.
- Modern UIUX and animations that will create a WOW factor on first sight.