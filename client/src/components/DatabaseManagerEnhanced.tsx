import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Database, Trash2, Copy, Loader2, Plus, RefreshCw, HardDrive, Activity, Clock, Download, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DatabaseManagerEnhancedProps {
  projectId: number;
}

export default function DatabaseManagerEnhanced({ projectId }: DatabaseManagerEnhancedProps) {
  const [isProvisionDialogOpen, setIsProvisionDialogOpen] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [newDbType, setNewDbType] = useState<"postgresql" | "mysql" | "mongodb" | "redis">("postgresql");
  const [newDbSize, setNewDbSize] = useState<"small" | "medium" | "large">("small");
  const [selectedDb, setSelectedDb] = useState<number | null>(null);
  
  const { data: databases, isLoading, refetch } = trpc.database.list.useQuery({ projectId });
  const { data: metrics, refetch: refetchMetrics } = trpc.database.getMetrics.useQuery(
    { databaseId: selectedDb! },
    { enabled: selectedDb !== null, refetchInterval: 5000 } // Auto-refresh every 5s
  );
  
  const provisionMutation = trpc.database.provision.useMutation({
    onSuccess: () => {
      toast.success("Database provisioned successfully!");
      refetch();
      setIsProvisionDialogOpen(false);
      setNewDbName("");
    },
    onError: (error) => {
      toast.error(`Failed to provision database: ${error.message}`);
    },
  });
  
  const deleteMutation = trpc.database.delete.useMutation({
    onSuccess: () => {
      toast.success("Database deleted successfully!");
      if (selectedDb) setSelectedDb(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete database: ${error.message}`);
    },
  });
  
  const testConnectionMutation = trpc.database.testConnection.useMutation({
    onSuccess: (data) => {
      toast.success(`Connection successful! Latency: ${data.latency}ms`);
    },
    onError: (error) => {
      toast.error(`Connection failed: ${error.message}`);
    },
  });

  const createBackupMutation = trpc.database.createBackup.useMutation({
    onSuccess: (data) => {
      toast.success(`Backup created! ID: ${data.backupId} (${data.size}MB)`);
    },
    onError: (error) => {
      toast.error(`Backup failed: ${error.message}`);
    },
  });

  const restoreBackupMutation = trpc.database.restoreBackup.useMutation({
    onSuccess: () => {
      toast.success("Database restored successfully!");
    },
    onError: (error) => {
      toast.error(`Restore failed: ${error.message}`);
    },
  });

  const handleProvision = () => {
    if (!newDbName.trim()) {
      toast.error("Please enter a database name");
      return;
    }
    provisionMutation.mutate({
      projectId,
      name: newDbName,
      type: newDbType,
      size: newDbSize,
    });
  };

  const handleDelete = (databaseId: number, dbName: string) => {
    if (confirm(`Are you sure you want to delete database "${dbName}"? This action cannot be undone.`)) {
      deleteMutation.mutate({ databaseId });
    }
  };

  const handleBackup = (databaseId: number) => {
    if (confirm("Create a backup of this database?")) {
      createBackupMutation.mutate({ databaseId });
    }
  };

  const handleRestore = (databaseId: number) => {
    const backupId = prompt("Enter backup ID to restore from:");
    if (backupId) {
      restoreBackupMutation.mutate({ databaseId, backupId });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getDbIcon = (type: string) => {
    return <Database className="h-5 w-5" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      provisioning: "secondary",
      failed: "destructive",
      deleted: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Databases</h2>
          <p className="text-muted-foreground">Manage databases for your project</p>
        </div>
        <Dialog open={isProvisionDialogOpen} onOpenChange={setIsProvisionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Provision Database
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provision New Database</DialogTitle>
              <DialogDescription>
                Create a new database instance for your project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="db-name">Database Name</Label>
                <Input
                  id="db-name"
                  placeholder="my-database"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db-type">Database Type</Label>
                <Select value={newDbType} onValueChange={(value: any) => setNewDbType(value)}>
                  <SelectTrigger id="db-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                    <SelectItem value="redis">Redis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="db-size">Size</Label>
                <Select value={newDbSize} onValueChange={(value: any) => setNewDbSize(value)}>
                  <SelectTrigger id="db-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1GB RAM, 10GB Storage)</SelectItem>
                    <SelectItem value="medium">Medium (2GB RAM, 25GB Storage)</SelectItem>
                    <SelectItem value="large">Large (4GB RAM, 50GB Storage)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProvisionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleProvision} disabled={provisionMutation.isPending}>
                {provisionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Provision
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {databases && databases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No databases yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Provision a database to get started
            </p>
            <Button onClick={() => setIsProvisionDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Provision Database
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {databases?.map((db) => (
            <Card key={db.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getDbIcon(db.type)}
                    <div>
                      <CardTitle className="text-lg">{db.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span className="uppercase text-xs font-medium">{db.type}</span>
                        <span>•</span>
                        <span className="capitalize">{db.size}</span>
                        <span>•</span>
                        {getStatusBadge(db.status)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnectionMutation.mutate({ databaseId: db.id })}
                      disabled={testConnectionMutation.isPending || db.status !== "active"}
                    >
                      {testConnectionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(db.id, db.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="connection" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="connection">Connection</TabsTrigger>
                    <TabsTrigger value="monitoring" onClick={() => setSelectedDb(db.id)}>
                      Monitoring
                    </TabsTrigger>
                    <TabsTrigger value="backup">Backup</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="connection" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Host</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded flex-1">{db.host}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(db.host, "Host")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Port</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded flex-1">{db.port}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(db.port.toString(), "Port")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Username</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded flex-1">{db.username}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(db.username, "Username")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Password</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded flex-1">••••••••</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(db.password, "Password")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {db.connectionString && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Connection String</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                            {db.connectionString}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(db.connectionString || "", "Connection string")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="monitoring" className="space-y-4 mt-4">
                    {selectedDb === db.id && metrics ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Real-time Metrics</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refetchMetrics()}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">CPU Usage</span>
                              <span className="font-medium">{metrics.cpu}%</span>
                            </div>
                            <Progress value={metrics.cpu} />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Memory</span>
                              <span className="font-medium">{metrics.memory}%</span>
                            </div>
                            <Progress value={metrics.memory} />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Storage</span>
                              <span className="font-medium">{metrics.storage}%</span>
                            </div>
                            <Progress value={metrics.storage} />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Connections</span>
                              <span className="font-medium">{metrics.connections}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Queries/sec</span>
                              <span className="font-medium">{metrics.queries}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Uptime</span>
                              <span className="font-medium">{formatUptime(metrics.uptime)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="backup" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Backup & Restore</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleBackup(db.id)}
                        disabled={createBackupMutation.isPending || db.status !== "active"}
                        className="flex-1"
                      >
                        {createBackupMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Create Backup
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRestore(db.id)}
                        disabled={restoreBackupMutation.isPending || db.status !== "active"}
                        className="flex-1"
                      >
                        {restoreBackupMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Restore Backup
                      </Button>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                      <p className="font-medium mb-2">Backup Information:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Backups are created instantly and stored securely</li>
                        <li>Point-in-time recovery available</li>
                        <li>Automatic daily backups (retained for 7 days)</li>
                        <li>Manual backups retained for 30 days</li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="text-xs text-muted-foreground mt-4">
                  Created {new Date(db.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
