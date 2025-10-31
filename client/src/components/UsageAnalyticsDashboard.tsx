import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Zap,
  GitCommit,
  Rocket,
  Clock,
  Calendar,
} from "lucide-react";

interface UsageMetric {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

interface DailyUsage {
  date: string;
  projectsCreated: number;
  codeGenerations: number;
  deploymentsTriggered: number;
  githubCommits: number;
  aiTokensUsed: number;
  costIncurred: number;
}

export function UsageAnalyticsDashboard() {
  // Mock data - replace with actual tRPC query
  const currentPeriod: UsageMetric[] = [
    {
      label: "Total Cost",
      value: "$87.50",
      change: "+12.5%",
      trend: "up",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: "AI Tokens Used",
      value: "2.4M",
      change: "+8.3%",
      trend: "up",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      label: "Code Generations",
      value: "45",
      change: "+15.0%",
      trend: "up",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: "Deployments",
      value: "32",
      change: "-5.2%",
      trend: "down",
      icon: <Rocket className="h-4 w-4" />,
    },
    {
      label: "GitHub Commits",
      value: "128",
      change: "+22.1%",
      trend: "up",
      icon: <GitCommit className="h-4 w-4" />,
    },
    {
      label: "Active Time",
      value: "18.5h",
      change: "+3.2%",
      trend: "up",
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  const dailyUsage: DailyUsage[] = [
    {
      date: "2025-10-25",
      projectsCreated: 2,
      codeGenerations: 8,
      deploymentsTriggered: 5,
      githubCommits: 18,
      aiTokensUsed: 125000,
      costIncurred: 425,
    },
    {
      date: "2025-10-26",
      projectsCreated: 1,
      codeGenerations: 5,
      deploymentsTriggered: 3,
      githubCommits: 12,
      aiTokensUsed: 98000,
      costIncurred: 340,
    },
    {
      date: "2025-10-27",
      projectsCreated: 3,
      codeGenerations: 12,
      deploymentsTriggered: 7,
      githubCommits: 25,
      aiTokensUsed: 185000,
      costIncurred: 620,
    },
    {
      date: "2025-10-28",
      projectsCreated: 1,
      codeGenerations: 6,
      deploymentsTriggered: 4,
      githubCommits: 15,
      aiTokensUsed: 110000,
      costIncurred: 385,
    },
    {
      date: "2025-10-29",
      projectsCreated: 2,
      codeGenerations: 9,
      deploymentsTriggered: 6,
      githubCommits: 21,
      aiTokensUsed: 142000,
      costIncurred: 490,
    },
    {
      date: "2025-10-30",
      projectsCreated: 4,
      codeGenerations: 15,
      deploymentsTriggered: 9,
      githubCommits: 32,
      aiTokensUsed: 225000,
      costIncurred: 780,
    },
  ];

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Usage Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Track your platform usage, costs, and activity over time
        </p>
      </div>

      {/* Period Selector */}
      <Tabs defaultValue="month" className="w-full">
        <TabsList>
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-6 mt-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentPeriod.map((metric, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                          {getTrendIcon(metric.trend)} {metric.change}
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {metric.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Daily Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daily Breakdown</CardTitle>
                  <CardDescription>Activity and costs per day</CardDescription>
                </div>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyUsage.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{day.projectsCreated} projects</span>
                        <span>{day.codeGenerations} generations</span>
                        <span>{day.deploymentsTriggered} deployments</span>
                        <span>{day.githubCommits} commits</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-semibold">{formatCurrency(day.costIncurred)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(day.aiTokensUsed)} tokens
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>Where your credits are being spent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "AI Code Generation", value: 4250, percentage: 48.6, color: "bg-blue-500" },
                  { label: "Codebase Analysis", value: 2100, percentage: 24.0, color: "bg-purple-500" },
                  { label: "Code Modifications", value: 1850, percentage: 21.1, color: "bg-green-500" },
                  { label: "Chat Interactions", value: 550, percentage: 6.3, color: "bg-orange-500" },
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(item.value)} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Usage Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Insights</CardTitle>
              <CardDescription>AI-powered recommendations based on your activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Peak Usage Detected</p>
                  <p className="text-xs text-muted-foreground">
                    You generate the most code on weekends. Consider batching work to optimize costs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Cost Optimization</p>
                  <p className="text-xs text-muted-foreground">
                    You're well within the free tier. Current pace: $87.50/month (Free tier: $10/month included).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
                <Zap className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Efficiency Tip</p>
                  <p className="text-xs text-muted-foreground">
                    Your code modifications use 21% of credits. Try being more specific in prompts to reduce iterations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tab contents would be similar */}
        <TabsContent value="day">
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Today's usage data will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">This week's usage data will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">All-time usage data will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
