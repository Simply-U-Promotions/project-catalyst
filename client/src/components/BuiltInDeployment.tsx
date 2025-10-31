import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { 
  Rocket, 
  Square, 
  RotateCw, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Terminal,
  Globe
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BuiltInDeploymentProps {
  projectId: number;
}

export default function BuiltInDeployment({ projectId }: BuiltInDeploymentProps) {
  const [showLogs, setShowLogs] = useState(false);

  // Fetch deployment status
  const { data: deployments, isLoading, refetch } = trpc.builtInDeployment.status.useQuery(
    { projectId },
    { refetchInterval: 5000 } // Poll every 5 seconds
  );

  // Deploy mutation
  const deployMutation = trpc.builtInDeployment.deploy.useMutation({
    onSuccess: (data) => {
      toast.success(`Deployed successfully to ${data.deploymentUrl}`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Deployment failed: ${error.message}`);
    },
  });

  // Stop mutation
  const stopMutation = trpc.builtInDeployment.stop.useMutation({
    onSuccess: () => {
      toast.success("Deployment stopped");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to stop: ${error.message}`);
    },
  });

  // Restart mutation
  const restartMutation = trpc.builtInDeployment.restart.useMutation({
    onSuccess: () => {
      toast.success("Deployment restarted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to restart: ${error.message}`);
    },
  });

  // Get logs query
  const { data: logsData, refetch: refetchLogs } = trpc.builtInDeployment.logs.useQuery(
    { deploymentId: deployments?.[0]?.id || 0, tail: 100 },
    { enabled: showLogs && !!deployments?.[0]?.id }
  );

  const latestDeployment = deployments?.[0];
  const isDeploying = deployMutation.isPending;
  const isActive = latestDeployment?.status === "running";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Running</Badge>;
      case "stopped":
        return <Badge variant="secondary"><Square className="w-3 h-3 mr-1" />Stopped</Badge>;
      case "building":
        return <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Building</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Deployment Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Built-in Deployment
              </CardTitle>
              <CardDescription>
                Deploy to Project Catalyst's infrastructure with one click
              </CardDescription>
            </div>
            {!latestDeployment && (
              <Button
                onClick={() => deployMutation.mutate({ projectId })}
                disabled={isDeploying}
                size="lg"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Deploy to Catalyst
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        {latestDeployment && (
          <CardContent className="space-y-4">
            {/* Deployment Info */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">Current Deployment</h4>
                  {getStatusBadge(latestDeployment.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{latestDeployment.subdomain}.catalyst.app</span>
                  {isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-auto p-0"
                    >
                      <a
                        href={latestDeployment.deploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Deployed {new Date(latestDeployment.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isActive ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restartMutation.mutate({ deploymentId: latestDeployment.id })}
                      disabled={restartMutation.isPending}
                    >
                      <RotateCw className="w-4 h-4 mr-2" />
                      Restart
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => stopMutation.mutate({ deploymentId: latestDeployment.id })}
                      disabled={stopMutation.isPending}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => deployMutation.mutate({ projectId })}
                    disabled={isDeploying}
                    size="sm"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Redeploy
                  </Button>
                )}
              </div>
            </div>

            {/* Logs Section */}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowLogs(!showLogs);
                  if (!showLogs) refetchLogs();
                }}
              >
                <Terminal className="w-4 h-4 mr-2" />
                {showLogs ? "Hide Logs" : "View Logs"}
              </Button>

              {showLogs && (
                <div className="mt-4 p-4 bg-black text-green-400 rounded-lg font-mono text-xs overflow-auto max-h-96">
                  <pre>{logsData?.logs || "No logs available"}</pre>
                </div>
              )}
            </div>

            {/* Resource Info */}
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Resource Limits:</strong> 1 CPU core, 512MB RAM, 1GB storage
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Info Card */}
      {!latestDeployment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Why Use Built-in Deployment?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Zero configuration</strong> - Automatic buildpack detection</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Instant deployment</strong> - No external accounts required</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Free subdomain</strong> - yourapp.catalyst.app included</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Real-time logs</strong> - Monitor your application instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>One-click management</strong> - Start, stop, restart anytime</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
