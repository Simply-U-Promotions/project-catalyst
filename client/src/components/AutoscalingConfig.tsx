import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Cpu, MemoryStick, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AutoscalingConfigProps {
  deploymentId: number;
}

export function AutoscalingConfig({ deploymentId }: AutoscalingConfigProps) {
  const [enabled, setEnabled] = useState(true);
  const [minInstances, setMinInstances] = useState(1);
  const [maxInstances, setMaxInstances] = useState(5);
  const [cpuThreshold, setCpuThreshold] = useState(70);
  const [memoryThreshold, setMemoryThreshold] = useState(80);
  const [scaleUpCooldown, setScaleUpCooldown] = useState(60);
  const [scaleDownCooldown, setScaleDownCooldown] = useState(300);

  // Mock current metrics
  const currentMetrics = {
    instances: 2,
    avgCpu: 45,
    avgMemory: 62,
    requestsPerSecond: 125,
  };

  const handleSave = () => {
    toast.success("Autoscaling configuration saved");
  };

  const getMetricColor = (value: number, threshold: number) => {
    if (value >= threshold) return "text-red-600";
    if (value >= threshold * 0.8) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Autoscaling Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Automatically scale your deployment based on resource usage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Autoscaling</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-base">Current Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Instances</p>
              <p className="text-2xl font-bold">{currentMetrics.instances}</p>
              <p className="text-xs text-muted-foreground">
                of {maxInstances} max
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg CPU Usage</p>
              <p className={`text-2xl font-bold ${getMetricColor(currentMetrics.avgCpu, cpuThreshold)}`}>
                {currentMetrics.avgCpu}%
              </p>
              <p className="text-xs text-muted-foreground">
                Threshold: {cpuThreshold}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Memory Usage</p>
              <p className={`text-2xl font-bold ${getMetricColor(currentMetrics.avgMemory, memoryThreshold)}`}>
                {currentMetrics.avgMemory}%
              </p>
              <p className="text-xs text-muted-foreground">
                Threshold: {memoryThreshold}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Requests/sec</p>
              <p className="text-2xl font-bold">{currentMetrics.requestsPerSecond}</p>
              <p className="text-xs text-muted-foreground">
                Across all instances
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Scaling Rules</CardTitle>
          <CardDescription>
            Define when and how your deployment should scale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instance Limits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Instance Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Instances</Label>
                <Input
                  type="number"
                  min="1"
                  max={maxInstances}
                  value={minInstances}
                  onChange={(e) => setMinInstances(parseInt(e.target.value))}
                  disabled={!enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Always keep at least this many instances running
                </p>
              </div>
              <div className="space-y-2">
                <Label>Maximum Instances</Label>
                <Input
                  type="number"
                  min={minInstances}
                  max="20"
                  value={maxInstances}
                  onChange={(e) => setMaxInstances(parseInt(e.target.value))}
                  disabled={!enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Never scale beyond this limit
                </p>
              </div>
            </div>
          </div>

          {/* CPU Threshold */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                <h3 className="font-semibold text-sm">CPU Threshold</h3>
              </div>
              <Badge variant="outline">{cpuThreshold}%</Badge>
            </div>
            <Slider
              value={[cpuThreshold]}
              onValueChange={(value) => setCpuThreshold(value[0])}
              min={10}
              max={100}
              step={5}
              disabled={!enabled}
            />
            <p className="text-xs text-muted-foreground">
              Scale up when average CPU usage exceeds this threshold
            </p>
          </div>

          {/* Memory Threshold */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4" />
                <h3 className="font-semibold text-sm">Memory Threshold</h3>
              </div>
              <Badge variant="outline">{memoryThreshold}%</Badge>
            </div>
            <Slider
              value={[memoryThreshold]}
              onValueChange={(value) => setMemoryThreshold(value[0])}
              min={10}
              max={100}
              step={5}
              disabled={!enabled}
            />
            <p className="text-xs text-muted-foreground">
              Scale up when average memory usage exceeds this threshold
            </p>
          </div>

          {/* Cooldown Periods */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Cooldown Periods</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scale Up Cooldown (seconds)</Label>
                <Input
                  type="number"
                  min="30"
                  max="600"
                  step="30"
                  value={scaleUpCooldown}
                  onChange={(e) => setScaleUpCooldown(parseInt(e.target.value))}
                  disabled={!enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Wait time before scaling up again
                </p>
              </div>
              <div className="space-y-2">
                <Label>Scale Down Cooldown (seconds)</Label>
                <Input
                  type="number"
                  min="60"
                  max="1800"
                  step="60"
                  value={scaleDownCooldown}
                  onChange={(e) => setScaleDownCooldown(parseInt(e.target.value))}
                  disabled={!enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Wait time before scaling down again
                </p>
              </div>
            </div>
          </div>

          {/* Scaling Strategy */}
          <div className="space-y-2">
            <Label>Scaling Strategy</Label>
            <Select defaultValue="balanced" disabled={!enabled}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aggressive">
                  Aggressive - Scale quickly, optimize for performance
                </SelectItem>
                <SelectItem value="balanced">
                  Balanced - Balance performance and cost
                </SelectItem>
                <SelectItem value="conservative">
                  Conservative - Scale slowly, optimize for cost
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {enabled ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Autoscaling is enabled. Your deployment will automatically scale between{" "}
            <strong>{minInstances}</strong> and <strong>{maxInstances}</strong> instances
            based on CPU ({cpuThreshold}%) and memory ({memoryThreshold}%) thresholds.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Autoscaling is disabled. Your deployment will maintain a fixed number of instances.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={handleSave} disabled={!enabled}>
          Save Configuration
        </Button>
      </div>

      {/* Pricing Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost Impact</CardTitle>
          <CardDescription>
            Estimated cost based on current configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Base cost (min instances)</span>
            <span className="font-semibold">${(minInstances * 0.05).toFixed(2)}/hour</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Max cost (max instances)</span>
            <span className="font-semibold">${(maxInstances * 0.05).toFixed(2)}/hour</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm font-semibold">Estimated monthly cost</span>
            <span className="font-bold text-lg">
              ${(minInstances * 0.05 * 24 * 30).toFixed(2)} - ${(maxInstances * 0.05 * 24 * 30).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Actual cost depends on traffic patterns and scaling behavior
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
