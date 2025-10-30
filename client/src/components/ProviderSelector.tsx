import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Rocket, Server, Cloud } from "lucide-react";

type DeploymentProvider = "vercel" | "railway" | "kubernetes";

interface ProviderInfo {
  id: DeploymentProvider;
  name: string;
  icon: React.ReactNode;
  description: string;
  bestFor: string[];
  features: string[];
  badge?: string;
}

const providers: ProviderInfo[] = [
  {
    id: "vercel",
    name: "Vercel",
    icon: <Rocket className="h-6 w-6" />,
    description: "Optimized for Next.js, React, and static sites with edge functions",
    bestFor: ["Frontend apps", "Static sites", "Serverless APIs"],
    features: ["Instant deployments", "Global CDN", "Automatic HTTPS", "Preview deployments"],
    badge: "Recommended",
  },
  {
    id: "railway",
    name: "Railway",
    icon: <Server className="h-6 w-6" />,
    description: "Full-stack platform with databases, cron jobs, and background workers",
    bestFor: ["Backend APIs", "Full-stack apps", "Apps with databases"],
    features: ["Built-in databases", "Cron jobs", "Background workers", "Docker support"],
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    icon: <Cloud className="h-6 w-6" />,
    description: "Self-hosted container orchestration for enterprise-grade deployments",
    bestFor: ["Microservices", "Enterprise apps", "Complex architectures"],
    features: ["Full control", "Auto-scaling", "Load balancing", "Multi-region"],
    badge: "Advanced",
  },
];

interface ProviderSelectorProps {
  selectedProvider: DeploymentProvider;
  onProviderChange: (provider: DeploymentProvider) => void;
  recommendation?: {
    recommended: DeploymentProvider;
    reason: string;
  };
}

export default function ProviderSelector({
  selectedProvider,
  onProviderChange,
  recommendation,
}: ProviderSelectorProps) {
  return (
    <div className="space-y-4">
      {recommendation && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recommended Provider</CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              {recommendation.reason}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          const isRecommended = recommendation?.recommended === provider.id;

          return (
            <Card
              key={provider.id}
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "hover:border-primary/50"
              }`}
              onClick={() => onProviderChange(provider.id)}
            >
              {provider.badge && (
                <Badge
                  className="absolute right-2 top-2"
                  variant={isRecommended ? "default" : "secondary"}
                >
                  {provider.badge}
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {provider.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">{provider.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Best for:</h4>
                  <div className="flex flex-wrap gap-1">
                    {provider.bestFor.map((item) => (
                      <Badge key={item} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium">Features:</h4>
                  <ul className="space-y-1">
                    {provider.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {isSelected && (
                  <Button className="w-full" size="sm">
                    <Check className="mr-2 h-4 w-4" />
                    Selected
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
