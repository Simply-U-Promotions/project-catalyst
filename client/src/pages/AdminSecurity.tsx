import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminSecurity() {
  // In a real implementation, these would be fetched from the server
  const [killSwitches, setKillSwitches] = useState({
    codeModification: false,
    codebaseAnalysis: false,
    codeGeneration: false,
  });

  const handleToggle = (feature: keyof typeof killSwitches) => {
    const newState = !killSwitches[feature];
    setKillSwitches(prev => ({ ...prev, [feature]: newState }));
    
    if (newState) {
      toast.error(`${formatFeatureName(feature)} has been disabled`);
    } else {
      toast.success(`${formatFeatureName(feature)} has been enabled`);
    }
    
    // In production, this would call an API to update environment variables
    console.log(`[KillSwitch] ${feature}: ${newState ? 'DISABLED' : 'ENABLED'}`);
  };

  const formatFeatureName = (feature: string) => {
    return feature.replace(/([A-Z])/g, ' $1').trim();
  };

  const anyDisabled = Object.values(killSwitches).some(v => v);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Security Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Emergency controls and security configuration
        </p>
      </div>

      {anyDisabled && (
        <Alert className="mb-6 border-orange-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> One or more features are currently disabled. Users will not be able to access disabled features.
          </AlertDescription>
        </Alert>
      )}

      {/* Kill Switches */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Feature Kill Switches</CardTitle>
          <CardDescription>
            Emergency controls to disable features instantly. Use these if you detect abuse or need to perform maintenance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="code-modification" className="text-base font-medium">
                Code Modification
              </Label>
              <p className="text-sm text-muted-foreground">
                AI-powered code modification with PR creation
              </p>
            </div>
            <Switch
              id="code-modification"
              checked={killSwitches.codeModification}
              onCheckedChange={() => handleToggle('codeModification')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="codebase-analysis" className="text-base font-medium">
                Codebase Analysis
              </Label>
              <p className="text-sm text-muted-foreground">
                AI-powered codebase analysis and tech stack detection
              </p>
            </div>
            <Switch
              id="codebase-analysis"
              checked={killSwitches.codebaseAnalysis}
              onCheckedChange={() => handleToggle('codebaseAnalysis')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="code-generation" className="text-base font-medium">
                Code Generation
              </Label>
              <p className="text-sm text-muted-foreground">
                AI-powered code generation from natural language
              </p>
            </div>
            <Switch
              id="code-generation"
              checked={killSwitches.codeGeneration}
              onCheckedChange={() => handleToggle('codeGeneration')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>Security Monitoring</CardTitle>
          <CardDescription>
            Recent security events and prompt injection attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Security event logging is active. Check server logs for detailed information about jailbreak attempts and suspicious patterns.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>Active Protections:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Prompt injection detection (30+ patterns)</li>
              <li>Jailbreak attempt blocking</li>
              <li>Delimiter injection sanitization</li>
              <li>Token exhaustion prevention</li>
              <li>Request length limiting (10,000 chars)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
          <CardDescription>
            Current rate limiting configuration per feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Code Modification</h4>
              <p className="text-sm text-muted-foreground">10 requests/hour, 50 requests/day</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Codebase Analysis</h4>
              <p className="text-sm text-muted-foreground">20 requests/hour, 100 requests/day</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Code Generation</h4>
              <p className="text-sm text-muted-foreground">15 requests/hour, 75 requests/day</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
