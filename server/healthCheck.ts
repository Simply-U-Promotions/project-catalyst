import { getDb } from "./db";

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
  version: string;
  environment: string;
}

interface HealthCheck {
  status: "pass" | "warn" | "fail";
  message?: string;
  responseTime?: number;
  details?: Record<string, unknown>;
}

/**
 * Comprehensive health check endpoint
 * Returns health status of all critical systems
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  const checks = {
    database: await checkDatabase(),
    memory: checkMemory(),
    disk: checkDisk(),
  };

  // Determine overall status
  const hasFailures = Object.values(checks).some(check => check.status === "fail");
  const hasWarnings = Object.values(checks).some(check => check.status === "warn");
  
  let overallStatus: "healthy" | "degraded" | "unhealthy";
  if (hasFailures) {
    overallStatus = "unhealthy";
  } else if (hasWarnings) {
    overallStatus = "degraded";
  } else {
    overallStatus = "healthy";
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  };
}

/**
 * Check database connectivity and performance
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const db = await getDb();
    
    if (!db) {
      return {
        status: "fail",
        message: "Database connection not available",
        responseTime: Date.now() - startTime,
      };
    }

    // Simple query to test connectivity
    await db.execute("SELECT 1");
    
    const responseTime = Date.now() - startTime;
    
    // Warn if query takes too long
    if (responseTime > 1000) {
      return {
        status: "warn",
        message: "Database response time is slow",
        responseTime,
        details: {
          threshold: "1000ms",
          actual: `${responseTime}ms`,
        },
      };
    }

    return {
      status: "pass",
      message: "Database is healthy",
      responseTime,
    };
  } catch (error) {
    return {
      status: "fail",
      message: error instanceof Error ? error.message : "Database check failed",
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  const heapTotalMB = usage.heapTotal / 1024 / 1024;
  const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

  const details = {
    heapUsed: `${heapUsedMB.toFixed(2)} MB`,
    heapTotal: `${heapTotalMB.toFixed(2)} MB`,
    heapUsagePercent: `${heapUsagePercent.toFixed(2)}%`,
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
  };

  // Warn if heap usage is above 80%
  if (heapUsagePercent > 80) {
    return {
      status: "warn",
      message: "High memory usage detected",
      details,
    };
  }

  // Fail if heap usage is above 95%
  if (heapUsagePercent > 95) {
    return {
      status: "fail",
      message: "Critical memory usage",
      details,
    };
  }

  return {
    status: "pass",
    message: "Memory usage is normal",
    details,
  };
}

/**
 * Check disk usage (simplified - would need OS-specific implementation for real disk checks)
 */
function checkDisk(): HealthCheck {
  // In a real implementation, you would check actual disk usage
  // For now, we'll just return a pass status
  return {
    status: "pass",
    message: "Disk check not implemented",
    details: {
      note: "Disk monitoring requires OS-specific implementation",
    },
  };
}

/**
 * Readiness check - determines if the service is ready to accept traffic
 */
export async function performReadinessCheck(): Promise<{
  ready: boolean;
  message: string;
}> {
  try {
    // Check if database is available
    const db = await getDb();
    if (!db) {
      return {
        ready: false,
        message: "Database not available",
      };
    }

    // Test database connectivity
    await db.execute("SELECT 1");

    return {
      ready: true,
      message: "Service is ready",
    };
  } catch (error) {
    return {
      ready: false,
      message: error instanceof Error ? error.message : "Service not ready",
    };
  }
}

/**
 * Liveness check - determines if the service is alive
 */
export function performLivenessCheck(): {
  alive: boolean;
  message: string;
} {
  // Simple check - if we can execute this function, the process is alive
  return {
    alive: true,
    message: "Service is alive",
  };
}
