import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Terminal,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import ProviderSelector from "@/components/ProviderSelector";

interface DeploymentsProps {
  projectId: number;
}

export default function Deployments({ projectId }: DeploymentsProps) {
  const [selectedDeployment, setSelectedDeployment] = useState<number | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"vercel" | "railway" | "kubernetes">("vercel");
  const [showProviderSelector, setShowProviderSelector] = useState(false);

  const { data: deployments = [], isLoading, refetch } = trpc.deployments.getByProject.useQuery(
    { projectId },
    { refetchInterval: 5000 } // Poll every 5 seconds for updates
  );

  const { data: selectedDeploymentData } = trpc.deployments.getById.useQuery(
    { deploymentId: selectedDeployment! },
    { enabled: selectedDeployment !== null, refetchInterval: 2000 }
  );

  const createDeploymentMutation = trpc.deployments.create.useMutation({
    onSuccess: () => {
      toast.success(`Deployment started on ${selectedProvider}!`);
      setShowProviderSelector(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start deployment");
    },
  });

  const handleDeployClick = () => {
    if (!showProviderSelector) {
      setShowProviderSelector(true);
    } else {
      createDeploymentMutation.mutate({ projectId, provider: selectedProvider });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "deploying":
      case "building":
      case "pending":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      failed: "destructive",
      deploying: "secondary",
      building: "secondary",
      pending: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Deploy Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Deployments</h3>
          <p className="text-sm text-muted-foreground">
            Deploy your project to production
          </p>
        </div>
        <Button
          onClick={handleDeployClick}
          disabled={createDeploymentMutation.isPending}
          className="gap-2"
        >
          {createDeploymentMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              {showProviderSelector ? "Confirm Deployment" : "Deploy Now"}
            </>
          )}
        </Button>
      </div>

      {/* Provider Selector */}
      {showProviderSelector && (
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-semibold">Select Deployment Provider</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProviderSelector(false)}
            >
              Cancel
            </Button>
          </div>
          <ProviderSelector
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
          />
        </Card>
      )}

      {deployments.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Rocket className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No deployments yet</p>
          <p className="text-sm mt-2">Click "Deploy Now" to deploy your project</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-[350px_1fr] gap-4">
          {/* Deployment List */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3">History</h4>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {deployments.map((deployment: any) => (
                  <button
                    key={deployment.id}
                    onClick={() => setSelectedDeployment(deployment.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDeployment === deployment.id
                        ? "border-primary bg-accent"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(deployment.status)}
                        <span className="font-medium text-sm">
                          #{deployment.id}
                        </span>
                      </div>
                      {getStatusBadge(deployment.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(deployment.createdAt).toLocaleString()}
                    </p>
                    {deployment.deploymentUrl && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">Live</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Deployment Details */}
          <Card className="p-4">
            {selectedDeployment && selectedDeploymentData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">Deployment #{selectedDeploymentData.id}</h4>
                    {getStatusBadge(selectedDeploymentData.status)}
                  </div>
                  {selectedDeploymentData.deploymentUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a
                        href={selectedDeploymentData.deploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Live Site
                      </a>
                    </Button>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  Started: {new Date(selectedDeploymentData.createdAt).toLocaleString()}
                  {selectedDeploymentData.completedAt && (
                    <> • Completed: {new Date(selectedDeploymentData.completedAt).toLocaleString()}</>
                  )}
                </div>

                {/* Logs */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="h-4 w-4" />
                    <h5 className="font-semibold text-sm">Deployment Logs</h5>
                  </div>
                  <ScrollArea className="h-[400px] rounded-lg border bg-black/5 dark:bg-black/20 p-4">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {selectedDeploymentData.logs || "No logs available"}
                    </pre>
                  </ScrollArea>
                </div>

                {selectedDeploymentData.errorMessage && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-semibold text-destructive mb-1">Error</p>
                    <p className="text-sm text-destructive/80">{selectedDeploymentData.errorMessage}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                <p>Select a deployment to view details</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
