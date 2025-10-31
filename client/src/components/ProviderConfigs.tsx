import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ProviderConfigProps {
  projectId: number;
  onConfigChange: (config: Record<string, any>) => void;
}

export function CatalystConfig({ projectId, onConfigChange }: ProviderConfigProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Catalyst built-in deployment requires no configuration. Just click deploy!
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subdomain">Custom Subdomain</Label>
            <Input
              id="subdomain"
              placeholder="my-app"
              onChange={(e) => onConfigChange({ subdomain: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Will be available at: my-app.catalyst.app
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function VercelConfig({ projectId, onConfigChange }: ProviderConfigProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vercel Configuration</CardTitle>
          <CardDescription>Configure deployment settings for Vercel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vercel-project">Project Name</Label>
            <Input
              id="vercel-project"
              placeholder="my-vercel-project"
              onChange={(e) => onConfigChange({ projectName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vercel-framework">Framework Preset</Label>
            <Select onValueChange={(value) => onConfigChange({ framework: value })}>
              <SelectTrigger id="vercel-framework">
                <SelectValue placeholder="Select framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nextjs">Next.js</SelectItem>
                <SelectItem value="react">Create React App</SelectItem>
                <SelectItem value="vite">Vite</SelectItem>
                <SelectItem value="remix">Remix</SelectItem>
                <SelectItem value="astro">Astro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="vercel-auto-deploy">Auto-deploy on push</Label>
            <Switch
              id="vercel-auto-deploy"
              onCheckedChange={(checked) => onConfigChange({ autoDeploy: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function NetlifyConfig({ projectId, onConfigChange }: ProviderConfigProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Netlify Configuration</CardTitle>
          <CardDescription>Configure deployment settings for Netlify</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="netlify-site">Site Name</Label>
            <Input
              id="netlify-site"
              placeholder="my-netlify-site"
              onChange={(e) => onConfigChange({ siteName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="netlify-build">Build Command</Label>
            <Input
              id="netlify-build"
              placeholder="npm run build"
              defaultValue="npm run build"
              onChange={(e) => onConfigChange({ buildCommand: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="netlify-publish">Publish Directory</Label>
            <Input
              id="netlify-publish"
              placeholder="dist"
              defaultValue="dist"
              onChange={(e) => onConfigChange({ publishDir: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="netlify-forms">Enable Netlify Forms</Label>
            <Switch
              id="netlify-forms"
              onCheckedChange={(checked) => onConfigChange({ enableForms: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RailwayConfig({ projectId, onConfigChange }: ProviderConfigProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Railway Configuration</CardTitle>
          <CardDescription>Configure deployment settings for Railway</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="railway-project">Project Name</Label>
            <Input
              id="railway-project"
              placeholder="my-railway-project"
              onChange={(e) => onConfigChange({ projectName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="railway-region">Region</Label>
            <Select onValueChange={(value) => onConfigChange({ region: value })}>
              <SelectTrigger id="railway-region">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-west1">US West</SelectItem>
                <SelectItem value="us-east1">US East</SelectItem>
                <SelectItem value="eu-west1">Europe</SelectItem>
                <SelectItem value="ap-south1">Asia Pacific</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="railway-postgres">Add PostgreSQL Database</Label>
            <Switch
              id="railway-postgres"
              onCheckedChange={(checked) => onConfigChange({ addPostgres: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="railway-redis">Add Redis Cache</Label>
            <Switch
              id="railway-redis"
              onCheckedChange={(checked) => onConfigChange({ addRedis: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RenderConfig({ projectId, onConfigChange }: ProviderConfigProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Render Configuration</CardTitle>
          <CardDescription>Configure deployment settings for Render</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="render-service">Service Name</Label>
            <Input
              id="render-service"
              placeholder="my-render-service"
              onChange={(e) => onConfigChange({ serviceName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="render-type">Service Type</Label>
            <Select onValueChange={(value) => onConfigChange({ serviceType: value })}>
              <SelectTrigger id="render-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web">Web Service</SelectItem>
                <SelectItem value="static">Static Site</SelectItem>
                <SelectItem value="background">Background Worker</SelectItem>
                <SelectItem value="cron">Cron Job</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="render-plan">Instance Type</Label>
            <Select onValueChange={(value) => onConfigChange({ instanceType: value })}>
              <SelectTrigger id="render-plan">
                <SelectValue placeholder="Select instance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free (512 MB RAM)</SelectItem>
                <SelectItem value="starter">Starter (1 GB RAM)</SelectItem>
                <SelectItem value="standard">Standard (2 GB RAM)</SelectItem>
                <SelectItem value="pro">Pro (4 GB RAM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="render-auto-deploy">Auto-deploy on push</Label>
            <Switch
              id="render-auto-deploy"
              defaultChecked
              onCheckedChange={(checked) => onConfigChange({ autoDeploy: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
