import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, GitPullRequest, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface CodeModificationProps {
  projectId: number;
  repoUrl: string;
}

export default function CodeModification({ projectId, repoUrl }: CodeModificationProps) {
  const [modificationRequest, setModificationRequest] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    filesToModify: string[];
    changes: string;
    branchName: string;
    prTitle: string;
    prBody: string;
  } | null>(null);

  const [prCreationState, setPrCreationState] = useState<{
    isCreating: boolean;
    success: boolean;
    prUrl?: string;
    error?: string;
  }>({
    isCreating: false,
    success: false,
  });

  const createPRMutation = trpc.github.createPR.useMutation({
    onSuccess: (data) => {
      setPrCreationState({
        isCreating: false,
        success: true,
        prUrl: data.prUrl,
      });
      toast.success("Pull request created successfully!");
    },
    onError: (error) => {
      setPrCreationState({
        isCreating: false,
        success: false,
        error: error.message,
      });
      toast.error("Failed to create pull request");
    },
  });

  const modifyCodeMutation = trpc.github.modifyCode.useMutation();

  const handleAnalyzeModification = async () => {
    if (!modificationRequest.trim()) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await modifyCodeMutation.mutateAsync({
        projectId,
        description: modificationRequest,
      });

      setAnalysisResult({
        filesToModify: result.filesToModify,
        changes: result.summary,
        branchName: result.branchName,
        prTitle: result.prTitle,
        prBody: result.prBody,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to analyze modification request");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreatePR = async () => {
    if (!analysisResult || !modifyCodeMutation.data) return;

    setPrCreationState({ isCreating: true, success: false });

    try {
      const files = modifyCodeMutation.data.changes.map(change => ({
        path: change.path,
        content: change.content,
      }));

      await createPRMutation.mutateAsync({
        repoUrl,
        branchName: analysisResult.branchName,
        title: analysisResult.prTitle,
        body: analysisResult.prBody,
        files,
        commitMessage: `feat: ${analysisResult.prTitle}`,
      });
    } catch (error) {
      console.error("PR creation error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Code Modification</CardTitle>
          <CardDescription>
            Describe the changes you want to make, and AI will generate a pull request with the modifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modification">What would you like to change?</Label>
            <Textarea
              id="modification"
              placeholder="e.g., Add a dark mode toggle to the header, Update the homepage hero section with a new design, Fix the responsive layout on mobile..."
              value={modificationRequest}
              onChange={(e) => {
                setModificationRequest(e.target.value);
                setAnalysisResult(null);
                setPrCreationState({ isCreating: false, success: false });
              }}
              rows={4}
              disabled={isAnalyzing || prCreationState.isCreating}
            />
          </div>

          <Button
            onClick={handleAnalyzeModification}
            disabled={!modificationRequest.trim() || isAnalyzing || prCreationState.isCreating}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Changes...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Analyze & Preview Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Result */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Proposed Changes</CardTitle>
            <CardDescription>Review the changes before creating a pull request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Files to be Modified:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {analysisResult.filesToModify.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Summary of Changes:</h3>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <Streamdown>{analysisResult.changes}</Streamdown>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Branch:</span>
                <span className="ml-2 font-mono">{analysisResult.branchName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">PR Title:</span>
                <span className="ml-2">{analysisResult.prTitle}</span>
              </div>
            </div>

            <Button
              onClick={handleCreatePR}
              disabled={prCreationState.isCreating || prCreationState.success}
              className="w-full"
            >
              {prCreationState.isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Pull Request...
                </>
              ) : prCreationState.success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Pull Request Created
                </>
              ) : (
                <>
                  <GitPullRequest className="mr-2 h-4 w-4" />
                  Create Pull Request
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {prCreationState.success && prCreationState.prUrl && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Pull Request Created Successfully!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Your changes have been committed to a new branch and a pull request has been created.
                </p>
                <Button asChild variant="outline" size="sm">
                  <a href={prCreationState.prUrl} target="_blank" rel="noopener noreferrer">
                    View Pull Request on GitHub
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {prCreationState.error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Failed to Create Pull Request</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{prCreationState.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How it Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>AI analyzes your request and determines which files need to be modified</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Changes are generated with context awareness of your existing codebase</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>A new branch is created automatically for the changes</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Pull request is submitted for review before merging</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>You maintain full control - review and merge at your own pace</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
