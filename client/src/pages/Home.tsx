import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Code2, Rocket, Zap, GitBranch } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-xl">
            <Code2 className="h-6 w-6 text-primary" />
            {APP_TITLE}
          </div>
          {isAuthenticated ? (
            <Button onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
          ) : (
            <Button asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container py-20">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              From Idea to Production
              <span className="block text-primary mt-2">In Minutes</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered code generation meets seamless deployment. Build complete applications from natural language and ship to production instantly.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => setLocation("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>Get Started Free</a>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg border space-y-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">AI Code Generation</h3>
            <p className="text-muted-foreground">
              Describe your project in plain English. Our AI generates production-ready code with best practices built in.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border space-y-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <GitBranch className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">GitHub Integration</h3>
            <p className="text-muted-foreground">
              Automatic repository creation, commits, and version control. Your code is always backed up and ready to share.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border space-y-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">One-Click Deploy</h3>
            <p className="text-muted-foreground">
              Deploy to production with a single click. Automatic SSL, custom domains, and zero-downtime updates.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-32 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
