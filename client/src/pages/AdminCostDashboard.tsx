import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, DollarSign, Users, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminCostDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Fetch cost statistics
  const { data: statistics, isLoading: statsLoading } = trpc.admin.costStatistics.useQuery();

  // Fetch all user cost summaries
  const { data: userCosts, isLoading: costsLoading, refetch } = trpc.admin.costSummary.useQuery();

  // Fetch detailed history for selected user
  const { data: userHistory } = trpc.admin.userCostHistory.useQuery(
    { userId: selectedUserId!, limit: 50 },
    { enabled: selectedUserId !== null }
  );

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (statsLoading || costsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Calculate high-cost users (monthly cost > $10)
  const highCostUsers = userCosts?.filter(u => u.monthlyCost > 1000) || [];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Cost Monitoring Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track LLM API usage and costs across all users
        </p>
      </div>

      {/* Alert for high-cost users */}
      {highCostUsers.length > 0 && (
        <Alert className="mb-6 border-orange-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{highCostUsers.length} user{highCostUsers.length > 1 ? 's' : ''}</strong> with monthly costs exceeding $10.00
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(statistics?.totalUsers || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(statistics?.totalCalls || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All-Time Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(statistics?.totalCost || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(statistics?.monthlyTotalCost || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* User Cost Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Cost Breakdown</CardTitle>
          <CardDescription>
            Detailed cost analysis per user (sorted by monthly cost)
          </CardDescription>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="w-fit">
            Refresh Data
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Total Calls</TableHead>
                <TableHead>Total Tokens</TableHead>
                <TableHead>All-Time Cost</TableHead>
                <TableHead>Monthly Calls</TableHead>
                <TableHead>Monthly Cost</TableHead>
                <TableHead>Last Call</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userCosts && userCosts.length > 0 ? (
                userCosts.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.userId}</TableCell>
                    <TableCell>{formatNumber(user.totalCalls)}</TableCell>
                    <TableCell>{formatNumber(user.totalTokens)}</TableCell>
                    <TableCell>{formatCost(user.totalCost)}</TableCell>
                    <TableCell>{formatNumber(user.monthlyCallsCount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatCost(user.monthlyCost)}
                        {user.monthlyCost > 1000 && (
                          <Badge variant="destructive">High</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.lastCallAt
                        ? new Date(user.lastCallAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUserId(user.userId)}
                      >
                        View History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No API usage data yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User History Modal/Section */}
      {selectedUserId && userHistory && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>API Call History - User {selectedUserId}</CardTitle>
            <CardDescription>Last 50 API calls</CardDescription>
            <Button
              onClick={() => setSelectedUserId(null)}
              variant="outline"
              size="sm"
              className="w-fit"
            >
              Close
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userHistory.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <Badge variant="outline">{call.feature}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{call.model}</TableCell>
                    <TableCell>{formatNumber(call.totalTokens)}</TableCell>
                    <TableCell>{formatCost(call.estimatedCost)}</TableCell>
                    <TableCell>
                      {call.responseTime ? `${call.responseTime}ms` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {call.success ? (
                        <Badge variant="default">Success</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(call.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
