import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

export default function MockInterviewerPage() {
  return (
    <>
      <PageHeader
        title="AI Mock Interviewer"
        description="Practice your interview skills with a real-time AI. Coming soon!"
      />
      <Card className="bg-card/50 backdrop-blur-lg border border-border/20">
        <CardHeader>
            <CardTitle>Feature in Development</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center p-16">
            <Bot className="h-24 w-24 text-primary animate-pulse" />
            <h2 className="mt-6 text-2xl font-semibold">Get Ready to Ace Your Interviews</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
                Our AI Mock Interviewer is currently being trained to provide you with the most realistic and helpful interview experience. Check back soon!
            </p>
        </CardContent>
      </Card>
    </>
  );
}
