import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Plus, Trash2, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CostAlert {
  id: number;
  alertType: "daily" | "weekly" | "monthly" | "total";
  threshold: number;
  currentValue: number;
  isActive: number;
  lastTriggeredAt: Date | null;
  notificationMethod: "email" | "dashboard" | "both";
}

export function CostAlertManager() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alertType: "daily" as const,
    threshold: 500, // $5.00
    notificationMethod: "both" as const,
  });

  // Mock data - replace with actual tRPC query
  const alerts: CostAlert[] = [
    {
      id: 1,
      alertType: "daily",
      threshold: 500,
      currentValue: 320,
      isActive: 1,
      lastTriggeredAt: null,
      notificationMethod: "both",
    },
    {
      id: 2,
      alertType: "monthly",
      threshold: 10000,
      currentValue: 8750,
      isActive: 1,
      lastTriggeredAt: new Date("2025-10-25"),
      notificationMethod: "email",
    },
  ];

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      total: "Total (All-Time)",
    };
    return labels[type] || type;
  };

  const getProgressPercentage = (current: number, threshold: number) => {
    return Math.min((current / threshold) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-orange-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleAddAlert = () => {
    toast.success("Cost alert created successfully");
    setShowAddForm(false);
    setNewAlert({
      alertType: "daily",
      threshold: 500,
      notificationMethod: "both",
    });
  };

  const handleToggleAlert = (alertId: number, isActive: boolean) => {
    toast.success(isActive ? "Alert enabled" : "Alert disabled");
  };

  const handleDeleteAlert = (alertId: number) => {
    toast.success("Alert deleted successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cost Alerts</h2>
          <p className="text-sm text-muted-foreground">
            Set up alerts to monitor your spending and stay within budget
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Alert
        </Button>
      </div>

      {/* Fair Use Policy Info */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Fair Use Policy:</strong> Free tier includes $10/month in AI credits. Additional usage is billed at cost. Set alerts to monitor your spending.
        </AlertDescription>
      </Alert>

      {/* Add Alert Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Alert</CardTitle>
            <CardDescription>Configure a cost threshold alert</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alert Period</Label>
                <Select
                  value={newAlert.alertType}
                  onValueChange={(value: any) =>
                    setNewAlert({ ...newAlert, alertType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="total">Total (All-Time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Threshold Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    value={(newAlert.threshold / 100).toFixed(2)}
                    onChange={(e) =>
                      setNewAlert({
                        ...newAlert,
                        threshold: Math.round(parseFloat(e.target.value) * 100),
                      })
                    }
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notification Method</Label>
              <Select
                value={newAlert.notificationMethod}
                onValueChange={(value: any) =>
                  setNewAlert({ ...newAlert, notificationMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="dashboard">Dashboard Only</SelectItem>
                  <SelectItem value="both">Email + Dashboard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAlert}>Create Alert</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const progress = getProgressPercentage(alert.currentValue, alert.threshold);
          const progressColor = getProgressColor(progress);

          return (
            <Card key={alert.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {getAlertTypeLabel(alert.alertType)} Cost Alert
                        </h3>
                        {alert.isActive ? (
                          <Badge className="bg-green-500">
                            <Bell className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <BellOff className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Threshold: {formatCurrency(alert.threshold)} •{" "}
                        {alert.notificationMethod === "both"
                          ? "Email + Dashboard"
                          : alert.notificationMethod === "email"
                          ? "Email Only"
                          : "Dashboard Only"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.isActive === 1}
                        onCheckedChange={(checked) =>
                          handleToggleAlert(alert.id, checked)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Usage</span>
                      <span className="font-semibold">
                        {formatCurrency(alert.currentValue)} / {formatCurrency(alert.threshold)}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressColor} transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{progress.toFixed(1)}% of threshold</span>
                      {alert.lastTriggeredAt && (
                        <span>
                          Last triggered:{" "}
                          {new Date(alert.lastTriggeredAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Warning */}
                  {progress >= 75 && (
                    <Alert className="border-orange-500">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <AlertDescription className="text-sm">
                        {progress >= 90
                          ? "You're approaching your cost threshold! Consider reviewing your usage."
                          : "You've used 75% of your alert threshold."}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {alerts.length === 0 && !showAddForm && (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Cost Alerts</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first alert to monitor spending
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
