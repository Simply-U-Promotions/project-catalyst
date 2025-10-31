import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitBranch,
  Globe,
  Settings,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Rocket,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Environment {
  id: string;
  name: string;
  type: "development" | "staging" | "production";
  branch: string;
  url: string;
  status: "active" | "inactive" | "deploying";
  autoDeployEnabled: boolean;
  lastDeployedAt: Date | null;
}

interface EnvironmentManagerProps {
  projectId: number;
}

export function EnvironmentManager({ projectId }: EnvironmentManagerProps) {
  const [selectedEnv, setSelectedEnv] = useState<string>("production");
  const [showAddForm, setShowAddForm] = useState(false);

  // Mock data - replace with actual tRPC query
  const environments: Environment[] = [
    {
      id: "prod-1",
      name: "Production",
      type: "production",
      branch: "main",
      url: "https://my-app.catalyst.app",
      status: "active",
      autoDeployEnabled: true,
      lastDeployedAt: new Date("2025-10-30T14:30:00"),
    },
    {
      id: "staging-1",
      name: "Staging",
      type: "staging",
      branch: "develop",
      url: "https://staging-my-app.catalyst.app",
      status: "active",
      autoDeployEnabled: true,
      lastDeployedAt: new Date("2025-10-30T16:45:00"),
    },
    {
      id: "dev-1",
      name: "Development",
      type: "development",
      branch: "feature/new-ui",
      url: "https://dev-my-app.catalyst.app",
      status: "inactive",
      autoDeployEnabled: false,
      lastDeployedAt: new Date("2025-10-29T10:20:00"),
    },
  ];

  const getStatusColor = (status: Environment["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "deploying":
        return "bg-blue-500";
      case "inactive":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeColor = (type: Environment["type"]) => {
    switch (type) {
      case "production":
        return "bg-red-500";
      case "staging":
        return "bg-yellow-500";
      case "development":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleDeploy = (envId: string) => {
    toast.success("Deployment started");
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleToggleAutoDeploy = (envId: string, enabled: boolean) => {
    toast.success(enabled ? "Auto-deploy enabled" : "Auto-deploy disabled");
  };

  const handleDeleteEnvironment = (envId: string) => {
    toast.success("Environment deleted");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Environments</h2>
          <p className="text-sm text-muted-foreground">
            Manage deployment environments for development, staging, and production
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Environment
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <GitBranch className="h-4 w-4" />
        <AlertDescription>
          Each environment can be linked to a different Git branch and deployed independently. Enable auto-deploy to automatically deploy when changes are pushed.
        </AlertDescription>
      </Alert>

      {/* Environments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {environments.map((env) => (
          <Card key={env.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{env.name}</CardTitle>
                    <Badge className={`${getStatusColor(env.status)} text-white`}>
                      {env.status}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={`${getTypeColor(env.type)} text-white`}>
                    {env.type}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteEnvironment(env.id)}
                  disabled={env.type === "production"}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Branch */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GitBranch className="h-3 w-3" />
                  <span>Branch</span>
                </div>
                <p className="text-sm font-mono">{env.branch}</p>
              </div>

              {/* URL */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <span>URL</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono truncate flex-1">{env.url}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyUrl(env.url)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Last Deployed */}
              {env.lastDeployedAt && (
                <div className="text-xs text-muted-foreground">
                  Last deployed: {env.lastDeployedAt.toLocaleString()}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDeploy(env.id)}
                  disabled={env.status === "deploying"}
                >
                  <Rocket className="h-3 w-3 mr-1" />
                  Deploy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleAutoDeploy(env.id, !env.autoDeployEnabled)}
                >
                  {env.autoDeployEnabled ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Settings className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {env.autoDeployEnabled && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Auto-deploy enabled</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Environment Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Environment</CardTitle>
            <CardDescription>
              Configure a new deployment environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Environment Name</Label>
                <Input placeholder="e.g., Preview, QA, Demo" />
              </div>

              <div className="space-y-2">
                <Label>Environment Type</Label>
                <Select defaultValue="development">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Git Branch</Label>
              <Input placeholder="e.g., develop, feature/xyz" />
              <p className="text-xs text-muted-foreground">
                The Git branch to deploy from
              </p>
            </div>

            <div className="space-y-2">
              <Label>Subdomain (Optional)</Label>
              <Input placeholder="e.g., preview, qa" />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="auto-deploy" className="rounded" />
              <Label htmlFor="auto-deploy" className="cursor-pointer">
                Enable auto-deploy on push
              </Label>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Each environment consumes deployment resources. Production environments have higher resource limits.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success("Environment created");
                setShowAddForm(false);
              }}>
                Create Environment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environment Variables per Environment */}
      <Card>
        <CardHeader>
          <CardTitle>Environment-Specific Variables</CardTitle>
          <CardDescription>
            Configure different environment variables for each environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="production">
            <TabsList>
              {environments.map((env) => (
                <TabsTrigger key={env.id} value={env.type}>
                  {env.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {environments.map((env) => (
              <TabsContent key={env.id} value={env.type} className="space-y-4">
                <div className="space-y-3">
                  {[
                    { key: "API_URL", value: "https://api.example.com" },
                    { key: "DATABASE_URL", value: "postgresql://..." },
                    { key: "FEATURE_FLAG_NEW_UI", value: "true" },
                  ].map((envVar, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-mono font-semibold">
                          {envVar.key}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {envVar.value}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
