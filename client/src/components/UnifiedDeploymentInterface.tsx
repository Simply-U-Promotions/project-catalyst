import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Rocket,
  Settings,
  Activity,
  Globe,
  Key,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { DeploymentProviderSelector } from "./DeploymentProviderSelector";

interface UnifiedDeploymentInterfaceProps {
  projectId: number;
  projectName: string;
  githubRepoUrl?: string;
}

export function UnifiedDeploymentInterface({
  projectId,
  projectName,
  githubRepoUrl,
}: UnifiedDeploymentInterfaceProps) {
  const [selectedProvider, setSelectedProvider] = useState("catalyst");
  const [deploymentStatus, setDeploymentStatus] = useState<"idle" | "deploying" | "success" | "failed">("idle");

  const getStatusIcon = () => {
    switch (deploymentStatus) {
      case "deploying":
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Rocket className="h-5 w-5" />;
    }
  };

  const getStatusBadge = () => {
    switch (deploymentStatus) {
      case "deploying":
        return <Badge className="bg-blue-500">Deploying...</Badge>;
      case "success":
        return <Badge className="bg-green-500">Live</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Not Deployed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <CardTitle>Deployment Status</CardTitle>
                <CardDescription>
                  {projectName} • {selectedProvider}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          {deploymentStatus === "success" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Your app is live!</span>
                </div>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Site
                </Button>
              </div>
            </div>
          )}
          {deploymentStatus === "idle" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This project hasn't been deployed yet. Choose a provider and deploy to make it live.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Deployment Interface */}
      <Tabs defaultValue="provider" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="provider">
            <Rocket className="h-4 w-4 mr-2" />
            Provider
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="credentials">
            <Key className="h-4 w-4 mr-2" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="space-y-4">
          <DeploymentProviderSelector
            projectId={projectId}
            currentProvider={selectedProvider}
            onProviderSelect={setSelectedProvider}
          />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Configuration</CardTitle>
              <CardDescription>
                Configure deployment settings for {selectedProvider}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Configuration options will appear here based on the selected provider.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys & Credentials</CardTitle>
              <CardDescription>
                Manage authentication credentials for {selectedProvider}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Credential management interface will appear here for external providers.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Monitoring</CardTitle>
              <CardDescription>
                Track deployment metrics and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Monitoring dashboard will appear here once deployed.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deploy Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => setDeploymentStatus("deploying")}
          disabled={deploymentStatus === "deploying"}
        >
          <Rocket className="h-4 w-4 mr-2" />
          Deploy to {selectedProvider}
        </Button>
      </div>
    </div>
  );
}
