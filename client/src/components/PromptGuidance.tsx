import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PromptGuidance() {
  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-lg">Writing Effective Prompts</CardTitle>
        </div>
        <CardDescription>
          Follow these guidelines to get the best results from AI code generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Principles */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Key Principles:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>Be specific</strong> - Include exact features, technologies, and requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>Provide context</strong> - Explain the purpose and target audience</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>List requirements</strong> - Break down features into clear bullet points</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>Mention tech stack</strong> - Specify frameworks, libraries, or APIs if needed</span>
            </li>
          </ul>
        </div>

        {/* Good Example */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Good Example
            </Badge>
          </div>
          <Alert className="bg-green-500/5 border-green-500/20">
            <AlertDescription className="text-sm">
              <strong>Prompt:</strong> "Build a task management app with user authentication. 
              Features: create/edit/delete tasks, assign priorities (high/medium/low), set due dates, 
              filter by status (todo/in-progress/done), and search tasks. Use React with TypeScript, 
              Tailwind CSS for styling, and include a clean dashboard layout with sidebar navigation."
            </AlertDescription>
          </Alert>
          <p className="text-xs text-muted-foreground">
            ✓ Specific features listed • ✓ Tech stack mentioned • ✓ Clear requirements • ✓ UI expectations
          </p>
        </div>

        {/* Bad Example */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              Bad Example
            </Badge>
          </div>
          <Alert className="bg-red-500/5 border-red-500/20">
            <AlertDescription className="text-sm">
              <strong>Prompt:</strong> "Make a todo app"
            </AlertDescription>
          </Alert>
          <p className="text-xs text-muted-foreground">
            ✗ Too vague • ✗ No features specified • ✗ No tech preferences • ✗ Missing context
          </p>
        </div>

        {/* Another Good Example */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Good Example
            </Badge>
          </div>
          <Alert className="bg-green-500/5 border-green-500/20">
            <AlertDescription className="text-sm">
              <strong>Prompt:</strong> "Create a landing page for a SaaS product targeting small businesses. 
              Include: hero section with CTA button, features grid (4-6 features with icons), pricing table 
              (3 tiers), testimonials carousel, and FAQ accordion. Design should be modern and professional 
              with a blue/white color scheme. Make it fully responsive."
            </AlertDescription>
          </Alert>
          <p className="text-xs text-muted-foreground">
            ✓ Target audience defined • ✓ Sections clearly listed • ✓ Design preferences • ✓ Responsiveness mentioned
          </p>
        </div>

        {/* Another Bad Example */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              Bad Example
            </Badge>
          </div>
          <Alert className="bg-red-500/5 border-red-500/20">
            <AlertDescription className="text-sm">
              <strong>Prompt:</strong> "Build something cool with React"
            </AlertDescription>
          </Alert>
          <p className="text-xs text-muted-foreground">
            ✗ No specific project type • ✗ No features • ✗ "Cool" is subjective • ✗ No clear goal
          </p>
        </div>

        {/* Pro Tips */}
        <div className="space-y-2 pt-2 border-t">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Pro Tips:
          </h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Start with the project type (e.g., "dashboard", "landing page", "e-commerce")</li>
            <li>• Use bullet points to list features for clarity</li>
            <li>• Mention any specific APIs or integrations needed</li>
            <li>• Describe the visual style (modern, minimal, colorful, etc.)</li>
            <li>• Include any constraints (mobile-first, accessibility, performance)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
