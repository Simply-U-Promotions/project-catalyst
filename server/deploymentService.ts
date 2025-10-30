import { GeneratedFile } from "../drizzle/schema";
import { deployToVercel, getVercelDeploymentStatus, getVercelDeploymentLogs } from "./providers/vercel";
import { deployToRailway, getRailwayDeploymentStatus, getRailwayDeploymentLogs } from "./providers/railway";
import { deployToKubernetes, getKubernetesDeploymentStatus, getKubernetesDeploymentLogs } from "./providers/kubernetes";

export type DeploymentProvider = "vercel" | "railway" | "kubernetes";

interface DeploymentOptions {
  provider: DeploymentProvider;
  projectName: string;
  files: GeneratedFile[];
  githubRepoUrl?: string;
  tokens: {
    vercel?: string;
    railway?: string;
    kubeconfig?: string;
  };
}

interface DeploymentResult {
  success: boolean;
  deploymentId?: string;
  deploymentUrl?: string;
  error?: string;
}

interface DeploymentStatus {
  status: "pending" | "building" | "deploying" | "success" | "failed";
  logs?: string;
  url?: string;
}

/**
 * Unified deployment service that routes to the appropriate provider
 */
export async function deployProject(options: DeploymentOptions): Promise<DeploymentResult> {
  const { provider, projectName, files, githubRepoUrl, tokens } = options;

  try {
    switch (provider) {
      case "vercel":
        if (!tokens.vercel) {
          return { success: false, error: "Vercel token not configured" };
        }
        return await deployToVercel({
          projectName,
          files,
          githubRepoUrl,
          vercelToken: tokens.vercel,
        });

      case "railway":
        if (!tokens.railway) {
          return { success: false, error: "Railway token not configured" };
        }
        return await deployToRailway({
          projectName,
          files,
          githubRepoUrl,
          railwayToken: tokens.railway,
        });

      case "kubernetes":
        if (!tokens.kubeconfig) {
          return { success: false, error: "Kubernetes config not configured" };
        }
        return await deployToKubernetes({
          projectName,
          files,
          githubRepoUrl,
          kubeconfig: tokens.kubeconfig,
        });

      default:
        return { success: false, error: `Unknown provider: ${provider}` };
    }
  } catch (error) {
    console.error(`[DeploymentService] Deployment to ${provider} failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get deployment status from the appropriate provider
 */
export async function getDeploymentStatus(
  provider: DeploymentProvider,
  deploymentId: string,
  tokens: DeploymentOptions["tokens"]
): Promise<DeploymentStatus> {
  try {
    switch (provider) {
      case "vercel":
        if (!tokens.vercel) {
          return { status: "failed", logs: "Vercel token not configured" };
        }
        return await getVercelDeploymentStatus(deploymentId, tokens.vercel);

      case "railway":
        if (!tokens.railway) {
          return { status: "failed", logs: "Railway token not configured" };
        }
        return await getRailwayDeploymentStatus(deploymentId, tokens.railway);

      case "kubernetes":
        if (!tokens.kubeconfig) {
          return { status: "failed", logs: "Kubernetes config not configured" };
        }
        return await getKubernetesDeploymentStatus(deploymentId, tokens.kubeconfig);

      default:
        return { status: "failed", logs: `Unknown provider: ${provider}` };
    }
  } catch (error) {
    return {
      status: "failed",
      logs: error instanceof Error ? error.message : "Failed to get deployment status",
    };
  }
}

/**
 * Get deployment logs from the appropriate provider
 */
export async function getDeploymentLogs(
  provider: DeploymentProvider,
  deploymentId: string,
  tokens: DeploymentOptions["tokens"]
): Promise<string> {
  try {
    switch (provider) {
      case "vercel":
        if (!tokens.vercel) {
          return "Vercel token not configured";
        }
        return await getVercelDeploymentLogs(deploymentId, tokens.vercel);

      case "railway":
        if (!tokens.railway) {
          return "Railway token not configured";
        }
        return await getRailwayDeploymentLogs(deploymentId, tokens.railway);

      case "kubernetes":
        if (!tokens.kubeconfig) {
          return "Kubernetes config not configured";
        }
        return await getKubernetesDeploymentLogs(deploymentId, tokens.kubeconfig);

      default:
        return `Unknown provider: ${provider}`;
    }
  } catch (error) {
    return error instanceof Error ? error.message : "Failed to get deployment logs";
  }
}

/**
 * Get provider recommendations based on project type
 */
export function getProviderRecommendation(projectType?: string): {
  recommended: DeploymentProvider;
  reason: string;
  alternatives: Array<{ provider: DeploymentProvider; reason: string }>;
} {
  // Default recommendation
  let recommended: DeploymentProvider = "vercel";
  let reason = "Best for frontend and full-stack applications";
  let alternatives: Array<{ provider: DeploymentProvider; reason: string }> = [
    { provider: "railway", reason: "Great for apps with databases and background jobs" },
    { provider: "kubernetes", reason: "Ultimate flexibility for complex deployments" },
  ];

  // Customize based on project type
  if (projectType) {
    const type = projectType.toLowerCase();
    
    if (type.includes("api") || type.includes("backend")) {
      recommended = "railway";
      reason = "Optimized for backend services and APIs";
      alternatives = [
        { provider: "kubernetes", reason: "More control for microservices architecture" },
        { provider: "vercel", reason: "Works for serverless APIs" },
      ];
    } else if (type.includes("enterprise") || type.includes("microservice")) {
      recommended = "kubernetes";
      reason = "Best for enterprise-grade and microservices deployments";
      alternatives = [
        { provider: "railway", reason: "Simpler alternative for smaller scale" },
        { provider: "vercel", reason: "Good for frontend components" },
      ];
    } else if (type.includes("landing") || type.includes("static") || type.includes("portfolio")) {
      recommended = "vercel";
      reason = "Perfect for static sites and Next.js applications";
      alternatives = [
        { provider: "railway", reason: "Alternative with more backend flexibility" },
        { provider: "kubernetes", reason: "Overkill but provides full control" },
      ];
    }
  }

  return { recommended, reason, alternatives };
}
