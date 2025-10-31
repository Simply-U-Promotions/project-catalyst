import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Key, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface ProviderCredentialsManagerProps {
  provider: string;
  projectId: number;
}

interface CredentialField {
  id: string;
  label: string;
  placeholder: string;
  helpText: string;
  helpLink?: string;
  required: boolean;
}

const providerCredentials: Record<string, CredentialField[]> = {
  vercel: [
    {
      id: "vercel_token",
      label: "Vercel API Token",
      placeholder: "vercel_xxx...",
      helpText: "Create a token in your Vercel account settings",
      helpLink: "https://vercel.com/account/tokens",
      required: true,
    },
    {
      id: "vercel_team_id",
      label: "Team ID (Optional)",
      placeholder: "team_xxx...",
      helpText: "Required only for team deployments",
      required: false,
    },
  ],
  netlify: [
    {
      id: "netlify_token",
      label: "Netlify Personal Access Token",
      placeholder: "netlify_xxx...",
      helpText: "Generate a token in your Netlify user settings",
      helpLink: "https://app.netlify.com/user/applications#personal-access-tokens",
      required: true,
    },
  ],
  railway: [
    {
      id: "railway_token",
      label: "Railway API Token",
      placeholder: "railway_xxx...",
      helpText: "Create a token in Railway account settings",
      helpLink: "https://railway.app/account/tokens",
      required: true,
    },
    {
      id: "railway_project_id",
      label: "Project ID (Optional)",
      placeholder: "project_xxx...",
      helpText: "Leave empty to create a new project",
      required: false,
    },
  ],
  render: [
    {
      id: "render_api_key",
      label: "Render API Key",
      placeholder: "rnd_xxx...",
      helpText: "Generate an API key in your Render account",
      helpLink: "https://dashboard.render.com/account/api-keys",
      required: true,
    },
  ],
};

export function ProviderCredentialsManager({ provider, projectId }: ProviderCredentialsManagerProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const fields = providerCredentials[provider] || [];

  if (provider === "catalyst") {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Catalyst built-in deployment doesn't require API keys. Authentication is handled automatically.
        </AlertDescription>
      </Alert>
    );
  }

  if (fields.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Credential configuration for {provider} is not yet available.
        </AlertDescription>
      </Alert>
    );
  }

  const handleCredentialChange = (fieldId: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [fieldId]: value }));
    setIsVerified(false);
  };

  const toggleSecretVisibility = (fieldId: string) => {
    setShowSecrets((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    // Simulate API verification
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsVerified(true);
    setIsVerifying(false);
  };

  const handleSave = async () => {
    // Save credentials to backend
    console.log("Saving credentials:", credentials);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle className="text-base">API Credentials</CardTitle>
          </div>
          <CardDescription>
            Securely store your {provider} credentials for automated deployments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.helpLink && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    asChild
                  >
                    <a href={field.helpLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Get Token
                    </a>
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  id={field.id}
                  type={showSecrets[field.id] ? "text" : "password"}
                  placeholder={field.placeholder}
                  value={credentials[field.id] || ""}
                  onChange={(e) => handleCredentialChange(field.id, e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => toggleSecretVisibility(field.id)}
                >
                  {showSecrets[field.id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleVerify}
              disabled={isVerifying || !credentials[fields[0].id]}
            >
              {isVerifying ? "Verifying..." : "Verify Credentials"}
            </Button>
            {isVerified && (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Your credentials are encrypted and stored securely. They are only used for deployment operations and are never exposed in logs or UI.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-3">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleSave} disabled={!isVerified}>
              Save Credentials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
