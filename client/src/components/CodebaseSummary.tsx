import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Code2,
  FileCode,
  Layers,
  Lightbulb,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Streamdown } from "streamdown";

interface CodebaseSummaryProps {
  projectId: number;
}

export default function CodebaseSummary({ projectId }: CodebaseSummaryProps) {
  const {
    data: analysis,
    isLoading,
    refetch,
    isRefetching,
  } = trpc.github.analyzeCodebase.useQuery({ projectId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Analyzing codebase...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No analysis available</p>
        </CardContent>
      </Card>
    );
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "simple":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "complex":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Codebase Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated analysis of your repository
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                Project Summary
              </CardTitle>
              <CardDescription className="mt-2">
                <Streamdown>{analysis.summary}</Streamdown>
              </CardDescription>
            </div>
            <Badge className={getComplexityColor(analysis.complexity)}>
              {analysis.complexity.charAt(0).toUpperCase() + analysis.complexity.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total Files:</span>
              <span className="font-semibold">{analysis.totalFiles}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total Lines:</span>
              <span className="font-semibold">{analysis.totalLines.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Tech Stack
          </CardTitle>
          <CardDescription>Technologies and frameworks used in this project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="px-3 py-1">
                {tech}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Project Structure
          </CardTitle>
          <CardDescription>Architecture and organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <Streamdown>{analysis.structure}</Streamdown>
          </div>
        </CardContent>
      </Card>

      {/* Key Components */}
      {analysis.keyComponents && analysis.keyComponents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              Key Components
            </CardTitle>
            <CardDescription>Main features and modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.keyComponents.map((component, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-semibold mb-2">{component.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{component.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {component.files.slice(0, 5).map((file) => (
                      <Badge key={file} variant="outline" className="text-xs font-mono">
                        {file}
                      </Badge>
                    ))}
                    {component.files.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{component.files.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Recommendations
            </CardTitle>
            <CardDescription>Suggestions for improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
