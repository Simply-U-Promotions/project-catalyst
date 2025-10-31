import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Key, Plus, Trash2, Eye, EyeOff, Edit2, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EnvVarsManagerProps {
  deploymentId: number;
}

export default function EnvVarsManager({ deploymentId }: EnvVarsManagerProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [visibleSecrets, setVisibleSecrets] = useState<Set<number>>(new Set());

  const { data: envVars, refetch } = trpc.builtInDeployment.getEnvVars.useQuery({ deploymentId });

  const addEnvVarMutation = trpc.builtInDeployment.addEnvVar.useMutation({
    onSuccess: () => {
      toast.success("Environment variable added");
      setNewKey("");
      setNewValue("");
      setIsSecret(false);
      setIsAdding(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add variable: ${error.message}`);
    },
  });

  const updateEnvVarMutation = trpc.builtInDeployment.updateEnvVar.useMutation({
    onSuccess: () => {
      toast.success("Environment variable updated");
      setEditingId(null);
      setEditValue("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update variable: ${error.message}`);
    },
  });

  const removeEnvVarMutation = trpc.builtInDeployment.removeEnvVar.useMutation({
    onSuccess: () => {
      toast.success("Environment variable removed");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to remove variable: ${error.message}`);
    },
  });

  const handleAddEnvVar = () => {
    if (!newKey.trim() || !newValue.trim()) {
      toast.error("Please enter both key and value");
      return;
    }
    addEnvVarMutation.mutate({ 
      deploymentId, 
      key: newKey.trim(), 
      value: newValue.trim(),
      isSecret 
    });
  };

  const handleUpdateEnvVar = (envVarId: number) => {
    if (!editValue.trim()) {
      toast.error("Value cannot be empty");
      return;
    }
    updateEnvVarMutation.mutate({ envVarId, value: editValue.trim() });
  };

  const toggleSecretVisibility = (id: number) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleSecrets(newVisible);
  };

  const maskValue = (value: string) => {
    return "•".repeat(Math.min(value.length, 20));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Environment Variables
            </CardTitle>
            <CardDescription>
              Manage environment variables for your deployment
            </CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Variable
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAdding && (
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>Key</Label>
              <Input
                placeholder="API_KEY"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                placeholder="your-api-key-here"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                type={isSecret ? "password" : "text"}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="secret-mode"
                checked={isSecret}
                onCheckedChange={setIsSecret}
              />
              <Label htmlFor="secret-mode">Mark as secret (masked in UI)</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddEnvVar} disabled={addEnvVarMutation.isPending} size="sm">
                Add
              </Button>
              <Button variant="outline" onClick={() => {
                setIsAdding(false);
                setNewKey("");
                setNewValue("");
                setIsSecret(false);
              }} size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {envVars && envVars.length > 0 ? (
          <div className="space-y-2">
            {envVars.map((envVar) => (
              <div key={envVar.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{envVar.key}</span>
                    {envVar.isSecret === 1 && <Badge variant="secondary" className="text-xs">Secret</Badge>}
                  </div>
                  {editingId === envVar.id ? (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="font-mono text-sm"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleUpdateEnvVar(envVar.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingId(null);
                        setEditValue("");
                      }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="font-mono text-sm text-muted-foreground">
                      {envVar.isSecret === 1 && !visibleSecrets.has(envVar.id)
                        ? maskValue(envVar.value)
                        : envVar.value}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {envVar.isSecret === 1 && editingId !== envVar.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSecretVisibility(envVar.id)}
                    >
                      {visibleSecrets.has(envVar.id) ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  {editingId !== envVar.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(envVar.id);
                        setEditValue(envVar.value);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEnvVarMutation.mutate({ envVarId: envVar.id })}
                    disabled={removeEnvVarMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No environment variables configured</p>
            <p className="text-sm mt-1">Add variables to configure your deployment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
