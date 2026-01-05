
# 🚀 Munnota.ai: Your AI-Powered Career Co-Pilot

<p align="center">
  <strong>Land your dream job, faster.</strong>
  <br />
  Munnota.ai is not just a tool; it's your personal career strategist, powered by cutting-edge Generative AI to give you an unfair advantage in the competitive job market.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Google_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google AI">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
</p>

---

## ✨ Why Munnota.ai is a Game-Changer

In today's job market, standing still is falling behind. Top candidates are leveraging AI to get instant feedback, generate targeted content, and chart their learning path. Munnota.ai democratizes access to these tools, providing an integrated suite of AI-powered features designed to navigate every stage of the job hunt.

This project was built for the **Tech Sprint Challenge**, with a core focus on leveraging powerful **Google Technologies** to solve a real-world problem for students and aspiring professionals.

🏆 **Our Winning Edge:**
*   **Powered by Google Gemini:** At its heart, Munnota.ai uses Google's powerful Gemini models via the **Genkit** framework. This enables sophisticated, context-aware content generation and analysis that sets our features apart.
*   **Built on Firebase:** The entire backend infrastructure—from user authentication with **Firebase Auth** to real-time data storage in **Firestore**—runs on Google's scalable and secure Firebase platform, ready for production.

## 🛠️ The Ultimate Toolkit for Career Success

Munnota.ai is more than just a single feature; it's a comprehensive platform.

### ✍️ LinkedIn Post Generator
**Stop wondering what to post. Start building your brand.**
Craft highly engaging LinkedIn posts that capture the attention of recruiters and hiring managers. Our AI analyzes your project details and generates content in a professional, casual, or "hype" tone, complete with algorithm-friendly formatting and relevant hashtags.

### 📄 Resume Analyzer & ATS Optimizer
**Beat the bots. Get the interview.**
Upload your resume and a target job description. Our AI performs a deep analysis, scoring your resume on key metrics like keyword alignment, technical knowledge, and project impact. Receive specific, actionable suggestions to optimize your resume for any Applicant Tracking System (ATS).

### 🗺️ Skill Gap Navigator
**Don't just apply for the job. Become the ideal candidate.**
Select your dream role, and our AI generates a personalized 30-day learning roadmap. This detailed plan includes weekly themes, daily topics, curated learning resources (docs, courses), and relevant GitHub repositories to get you hands-on experience.

### 🤖 AI Mock Interviewer
**Walk into any interview with confidence.**
Practice makes perfect. Our AI Mock Interviewer conducts real-time interviews via text or voice. It asks relevant questions based on the job description and your resume, then provides instant, objective feedback and a score on your performance. It's the most effective way to prepare.

---

## 💻 Tech Stack & Architecture

This project is built with a modern, robust, and scalable technology stack, showcasing best practices in web and AI development.

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **UI**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.com/)
*   **AI Orchestration**: [Genkit](https://firebase.google.com/docs/genkit)
*   **Generative AI Model**: [Google Gemini](https://deepmind.google/technologies/gemini/)
*   **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, App Hosting)

---

## 🚀 Getting Started

Follow these instructions to get your local development environment set up and running.

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/munnota-ai.git](https://github.com/MadanMS17/Munnota.ai)
cd munnota-ai
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of the project and add your Firebase project configuration keys. You will also need a Google AI API key for Genkit.

```.env.local
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."

# Genkit/Google AI API Key
GEMINI_API_KEY="AIza..."
```

### 4. Run the Development Server

You'll need to run two separate processes for the Next.js app and the Genkit AI flows.

**Terminal 1: Run the Next.js App**
```bash
npm run dev
```
Your application will be available at `http://localhost:9002`.

**Terminal 2: Run the Genkit AI Flows**
```bash
npm run genkit:watch
```
This will start the Genkit development server and watch for changes in your AI flow files.

You are now all set to explore and build upon Munnota.ai!
