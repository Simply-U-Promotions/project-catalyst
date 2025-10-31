import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Globe, Plus, Trash2, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CustomDomainsManagerProps {
  deploymentId: number;
}

export default function CustomDomainsManager({ deploymentId }: CustomDomainsManagerProps) {
  const [newDomain, setNewDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: domains, refetch } = trpc.builtInDeployment.getCustomDomains.useQuery(
    { deploymentId },
    { refetchInterval: 10000 }
  );

  const addDomainMutation = trpc.builtInDeployment.addCustomDomain.useMutation({
    onSuccess: (data) => {
      toast.success(`Domain added! Verification token: ${data.verificationToken}`);
      setNewDomain("");
      setIsAdding(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add domain: ${error.message}`);
    },
  });

  const removeDomainMutation = trpc.builtInDeployment.removeCustomDomain.useMutation({
    onSuccess: () => {
      toast.success("Domain removed");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to remove domain: ${error.message}`);
    },
  });

  const handleAddDomain = () => {
    if (!newDomain.trim()) {
      toast.error("Please enter a domain name");
      return;
    }
    addDomainMutation.mutate({ deploymentId, domain: newDomain.trim() });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
      case "pending":
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Pending</Badge>;
      case "verifying":
        return <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Verifying</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSSLBadge = (sslStatus: string) => {
    switch (sslStatus) {
      case "active":
        return <Badge className="bg-green-500">SSL Active</Badge>;
      case "pending":
        return <Badge variant="secondary">SSL Pending</Badge>;
      case "expired":
        return <Badge variant="destructive">SSL Expired</Badge>;
      case "failed":
        return <Badge variant="destructive">SSL Failed</Badge>;
      default:
        return <Badge variant="outline">No SSL</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Custom Domains
            </CardTitle>
            <CardDescription>
              Add custom domains to your deployment
            </CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAdding && (
          <div className="flex gap-2">
            <Input
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
            />
            <Button onClick={handleAddDomain} disabled={addDomainMutation.isPending}>
              {addDomainMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </Button>
            <Button variant="outline" onClick={() => {
              setIsAdding(false);
              setNewDomain("");
            }}>
              Cancel
            </Button>
          </div>
        )}

        {domains && domains.length > 0 ? (
          <div className="space-y-3">
            {domains.map((domain) => (
              <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{domain.domain}</span>
                    {getStatusBadge(domain.status)}
                    {getSSLBadge(domain.sslStatus)}
                  </div>
                  {domain.status === "pending" && domain.verificationToken && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>DNS Verification Required:</strong> Add a TXT record with value: {domain.verificationToken}
                      </AlertDescription>
                    </Alert>
                  )}
                  {domain.sslExpiresAt && (
                    <p className="text-xs text-muted-foreground">
                      SSL expires: {new Date(domain.sslExpiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDomainMutation.mutate({ domainId: domain.id })}
                  disabled={removeDomainMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No custom domains configured</p>
            <p className="text-sm mt-1">Add a custom domain to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
