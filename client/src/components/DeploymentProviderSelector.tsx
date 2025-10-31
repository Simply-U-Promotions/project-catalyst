import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink } from "lucide-react";
import { useState } from "react";

interface DeploymentProvider {
  id: string;
  name: string;
  description: string;
  logo: string;
  features: string[];
  pricing: string;
  setupRequired: boolean;
}

const providers: DeploymentProvider[] = [
  {
    id: "catalyst",
    name: "Catalyst Built-in",
    description: "Zero-configuration deployment with automatic buildpack detection",
    logo: "🚀",
    features: ["Free subdomain", "Automatic SSL", "Environment variables", "Custom domains", "Deployment history"],
    pricing: "Included",
    setupRequired: false,
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Deploy to Vercel's global edge network with automatic previews",
    logo: "▲",
    features: ["Edge functions", "Preview deployments", "Analytics", "Custom domains", "Team collaboration"],
    pricing: "Free tier available",
    setupRequired: true,
  },
  {
    id: "netlify",
    name: "Netlify",
    description: "Deploy to Netlify with continuous deployment from Git",
    logo: "🌐",
    features: ["Split testing", "Forms", "Functions", "Identity", "Large media"],
    pricing: "Free tier available",
    setupRequired: true,
  },
  {
    id: "railway",
    name: "Railway",
    description: "Deploy full-stack applications with databases and services",
    logo: "🚂",
    features: ["PostgreSQL", "Redis", "Cron jobs", "Private networking", "Metrics"],
    pricing: "$5/month minimum",
    setupRequired: true,
  },
  {
    id: "render",
    name: "Render",
    description: "Deploy web services, static sites, and databases",
    logo: "🎨",
    features: ["Auto-deploy", "Custom domains", "Private services", "Background workers", "Databases"],
    pricing: "Free tier available",
    setupRequired: true,
  },
];

interface DeploymentProviderSelectorProps {
  projectId: number;
  currentProvider?: string;
  onProviderSelect: (providerId: string) => void;
}

export function DeploymentProviderSelector({
  projectId,
  currentProvider = "catalyst",
  onProviderSelect,
}: DeploymentProviderSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState(currentProvider);

  const handleSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    onProviderSelect(providerId);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Deployment Provider</h3>
        <p className="text-sm text-muted-foreground">
          Select where you want to deploy your application. You can change this later.
        </p>
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className={`cursor-pointer transition-all ${
              selectedProvider === provider.id
                ? "border-primary ring-2 ring-primary/20"
                : "hover:border-primary/50"
            }`}
            onClick={() => handleSelect(provider.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{provider.logo}</div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {provider.name}
                      {selectedProvider === provider.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {provider.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={provider.setupRequired ? "secondary" : "default"}>
                  {provider.pricing}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {provider.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                {provider.setupRequired && selectedProvider === provider.id && (
                  <div className="pt-2 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Configure {provider.name}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
