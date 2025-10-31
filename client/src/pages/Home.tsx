import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Code2, Send, Sparkles, GitBranch, GitCommit, Rocket } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { PromptGuidance } from "@/components/PromptGuidance";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [chatStarted, setChatStarted] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!isAuthenticated) {
      // Show login prompt for non-authenticated users
      toast.info("Sign in to start building your project", {
        action: {
          label: "Sign In",
          onClick: () => window.location.href = getLoginUrl(),
        },
      });
      return;
    }

    // Redirect to create project with the message as description
    setLocation("/projects/new");
  };

  const examplePrompts = [
    "Build a SaaS landing page with pricing tiers",
    "Create a todo app with user authentication",
    "Make a crypto portfolio tracker dashboard",
    "Build an e-commerce store with Stripe",
  ];

  const handleExampleClick = (prompt: string) => {
    setMessage(prompt);
    setChatStarted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Code2 className="h-5 w-5 text-primary" />
            {APP_TITLE}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button size="sm" onClick={() => setLocation("/dashboard")}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
                <Button size="sm" asChild>
                  <a href={getLoginUrl()}>Get Started</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl space-y-8">
          {/* Hero Section */}
          {!chatStarted && (
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                What do you want to build?
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Describe your project in plain English. Our AI will generate production-ready code and deploy it instantly.
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Button variant="outline" onClick={() => setLocation("/templates")}>
                  Browse Templates
                </Button>
              </div>
            </div>
          )}

          {/* Chat Input */}
          <Card className="p-6 shadow-lg">
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="e.g., Build a landing page for my startup with a hero section, features, and pricing..."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (e.target.value && !chatStarted) setChatStarted(true);
                  }}
                  className="flex-1 h-12 text-base"
                  autoFocus
                />
                <Button type="submit" size="lg" disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground text-center">
                  You can start chatting without signing in. Sign in to save and deploy your project.
                </p>
              )}
            </form>
          </Card>

          {/* Example Prompts */}
          {!chatStarted && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Try an example:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(prompt)}
                    className="text-left p-4 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <p className="text-sm">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Guidance */}
          {!chatStarted && (
            <div className="mt-8">
              <PromptGuidance />
            </div>
          )}

          {/* GitHub Integration Section */}
          {!chatStarted && (
            <div className="mt-16 pt-12 border-t">
              <div className="text-center space-y-4 mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                  <GitBranch className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold">Seamless GitHub Integration</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Every project automatically creates a GitHub repository with your generated code. 
                  Full version control, automatic commits, and deployment pipeline included.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Auto Repository Creation</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically creates a GitHub repository with proper structure, README, and .gitignore. 
                    Supports both personal accounts and organizations.
                  </p>
                </Card>

                <Card className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GitCommit className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Smart Commits</h3>
                  <p className="text-sm text-muted-foreground">
                    Every code change automatically commits to GitHub with descriptive messages following 
                    conventional commit format (feat, fix, refactor).
                  </p>
                </Card>

                <Card className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Deploy from GitHub</h3>
                  <p className="text-sm text-muted-foreground">
                    Deployments pull directly from your GitHub repository. Every push triggers automatic 
                    rebuilds with zero-downtime updates.
                  </p>
                </Card>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 border">
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Technical Details</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>GitHub API Integration:</strong> Uses fine-grained personal access tokens with repo scope for secure operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Automatic Initialization:</strong> Creates main branch, adds comprehensive README.md, and configures .gitignore for your stack</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Commit History:</strong> Full version control with detailed commit messages explaining each change</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Branch Management:</strong> Supports feature branches, pull requests, and merge strategies (Pro tier)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>CI/CD Ready:</strong> Repository structure optimized for GitHub Actions and automated deployment workflows</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Features */}
          {!chatStarted && (
            <div className="grid sm:grid-cols-3 gap-6 pt-12">
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Generate complete apps from natural language
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Production Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Clean, maintainable code with best practices
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Instant Deploy</h3>
                <p className="text-sm text-muted-foreground">
                  Ship to production with one click
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
