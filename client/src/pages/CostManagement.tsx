import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { CostAlertManager } from "@/components/CostAlertManager";
import { UsageAnalyticsDashboard } from "@/components/UsageAnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Bell,
  BarChart3,
  Shield,
  ExternalLink
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { Navigate } from "wouter";

export default function CostManagement() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Mock current usage data
  const currentUsage = {
    monthlySpend: 8750, // $87.50 in cents
    freeCredits: 1000, // $10.00 in cents
    billedAmount: 7750, // $77.50 in cents
    dailyAverage: 292, // $2.92 in cents
    projectedMonthly: 8760, // $87.60 in cents
    daysRemaining: 1,
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getUsageStatus = () => {
    if (currentUsage.monthlySpend <= currentUsage.freeCredits) {
      return {
        status: "excellent",
        message: "You're within the free tier!",
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/20",
        borderColor: "border-green-200 dark:border-green-900",
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      };
    } else if (currentUsage.monthlySpend < currentUsage.freeCredits * 2) {
      return {
        status: "good",
        message: "Usage is moderate and within expected range",
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/20",
        borderColor: "border-blue-200 dark:border-blue-900",
        icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      };
    } else {
      return {
        status: "warning",
        message: "Usage is higher than usual",
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/20",
        borderColor: "border-orange-200 dark:border-orange-900",
        icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
      };
    }
  };

  const usageStatus = getUsageStatus();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Cost Management</h1>
          <p className="text-muted-foreground">
            Monitor your spending, set alerts, and optimize your usage
          </p>
        </div>

        {/* Current Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(currentUsage.monthlySpend)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(currentUsage.freeCredits)} free credits included
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Billed Amount</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(currentUsage.billedAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  After free credits
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Daily Average</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(currentUsage.dailyAverage)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Projected</p>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(currentUsage.projectedMonthly)}
                </p>
                <p className="text-xs text-muted-foreground">
                  End of month estimate
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Status Alert */}
        <Alert className={`${usageStatus.bgColor} ${usageStatus.borderColor}`}>
          {usageStatus.icon}
          <AlertDescription>
            <strong className={usageStatus.color}>{usageStatus.status.toUpperCase()}:</strong>{" "}
            {usageStatus.message}
            {currentUsage.daysRemaining > 0 && (
              <span className="ml-2">
                • {currentUsage.daysRemaining} day{currentUsage.daysRemaining !== 1 ? "s" : ""} remaining in billing cycle
              </span>
            )}
          </AlertDescription>
        </Alert>

        {/* Fair Use Policy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Fair Use Policy</CardTitle>
            </div>
            <CardDescription>
              Understanding your usage limits and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Free Tier Includes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• $10/month in AI credits</li>
                  <li>• Unlimited projects</li>
                  <li>• Unlimited deployments</li>
                  <li>• GitHub integration</li>
                  <li>• Database provisioning</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Additional Usage:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Billed at cost (no markup)</li>
                  <li>• Pay only for what you use</li>
                  <li>• Monthly billing cycle</li>
                  <li>• Set alerts to control spending</li>
                  <li>• Cancel anytime</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold text-sm mb-2">Pricing Breakdown:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Code Generation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ~$0.02 per 1K tokens
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Codebase Analysis</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ~$0.015 per 1K tokens
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Chat Interactions</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ~$0.01 per 1K tokens
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <a href="/docs/pricing" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Pricing Documentation
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Tabs for Alerts and Analytics */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-2" />
              Cost Alerts
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Usage Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="mt-6">
            <CostAlertManager />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <UsageAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
