import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, GitBranch, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";

export default function ImportRepository() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [repoUrl, setRepoUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    info?: { name: string; description: string; defaultBranch: string; isPrivate: boolean };
    error?: string;
  } | null>(null);

  const importMutation = trpc.github.import.useMutation({
    onSuccess: (data) => {
      setLocation(`/projects/${data.projectId}`);
    },
  });

  // Move useUtils to component level - hooks must be called at top level
  const utils = trpc.useUtils();

  const handleValidate = async () => {
    if (!repoUrl.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const info = await utils.github.getRepoInfo.fetch({ repoUrl });
      setValidationResult({
        valid: true,
        info,
      });
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : "Failed to validate repository",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = () => {
    if (!validationResult?.valid) return;
    importMutation.mutate({ repoUrl });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>You need to sign in to import repositories</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
            <span className="font-semibold text-lg">{APP_TITLE}</span>
          </div>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <GitBranch className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Import Existing Repository</h1>
            <p className="text-lg text-muted-foreground">
              Connect your existing GitHub repository to enable AI-powered modifications and deployments
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Repository URL</CardTitle>
              <CardDescription>
                Enter the GitHub repository URL you want to import. We'll fetch the code and set up the project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="repoUrl">GitHub Repository URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="repoUrl"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={(e) => {
                      setRepoUrl(e.target.value);
                      setValidationResult(null);
                    }}
                    disabled={isValidating || importMutation.isPending}
                  />
                  <Button
                    onClick={handleValidate}
                    disabled={!repoUrl.trim() || isValidating || importMutation.isPending}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating
                      </>
                    ) : (
                      "Validate"
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Supported formats: https://github.com/owner/repo or git@github.com:owner/repo.git
                </p>
              </div>

              {/* Validation Result */}
              {validationResult && (
                <div
                  className={`p-4 rounded-lg border ${
                    validationResult.valid
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                      : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                  }`}
                >
                  {validationResult.valid && validationResult.info ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900 dark:text-green-100">
                            Repository Found
                          </h3>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {validationResult.info.description || "No description available"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <span className="ml-2 font-medium">{validationResult.info.name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Branch:</span>
                          <span className="ml-2 font-medium">{validationResult.info.defaultBranch}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Visibility:</span>
                          <span className="ml-2 font-medium">
                            {validationResult.info.isPrivate ? "Private" : "Public"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900 dark:text-red-100">Validation Failed</h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {validationResult.error || "Unable to access repository"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Import Button */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!validationResult?.valid || importMutation.isPending}
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    "Import Repository"
                  )}
                </Button>
              </div>

              {/* Error Display */}
              {importMutation.error && (
                <div className="p-4 rounded-lg border bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-100">Import Failed</h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {importMutation.error.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">What happens when you import?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>We fetch all files from your repository (up to 100 files)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Your code is analyzed to understand the project structure and dependencies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>You can use AI to modify specific files or add new features</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Changes are submitted as pull requests, not direct commits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Deploy your existing project to Vercel, Railway, or Kubernetes</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
