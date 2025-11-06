import { GeneratedFile } from "../../drizzle/schema";

interface VercelDeploymentOptions {
  projectName: string;
  files: GeneratedFile[];
  githubRepoUrl?: string;
  vercelToken: string;
}

interface VercelDeploymentResult {
  success: boolean;
  deploymentId?: string;
  deploymentUrl?: string;
  error?: string;
}

/**
 * Deploy a project to Vercel using their API
 * Documentation: https://vercel.com/docs/rest-api
 */
export async function deployToVercel(
  options: VercelDeploymentOptions
): Promise<VercelDeploymentResult> {
  const { projectName, files, githubRepoUrl, vercelToken } = options;

  try {
    // If GitHub repo is provided, use Git integration (recommended)
    if (githubRepoUrl) {
      return await deployFromGitHub(projectName, githubRepoUrl, vercelToken);
    }

    // Otherwise, deploy files directly
    return await deployFiles(projectName, files, vercelToken);
  } catch (error) {
    console.error("[Vercel] Deployment failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Deploy from GitHub repository (recommended approach)
 */
async function deployFromGitHub(
  projectName: string,
  githubRepoUrl: string,
  vercelToken: string
): Promise<VercelDeploymentResult> {
  // Extract owner and repo from GitHub URL
  const match = githubRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL format");
  }

  const [, owner, repo] = match;
  const repoName = repo.replace(/\.git$/, "");

  // Step 1: Create or get Vercel project
  const projectResponse = await fetch("https://api.vercel.com/v9/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      gitRepository: {
        type: "github",
        repo: `${owner}/${repoName}`,
      },
    }),
  });

  if (!projectResponse.ok) {
    // Project might already exist, try to get it
    const existingProject = await getVercelProject(projectName, vercelToken);
    if (!existingProject) {
      throw new Error(`Failed to create Vercel project: ${await projectResponse.text()}`);
    }
  }

  // Step 2: Trigger deployment
  const deployResponse = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      gitSource: {
        type: "github",
        repo: `${owner}/${repoName}`,
        ref: "main",
      },
      target: "production",
    }),
  });

  if (!deployResponse.ok) {
    throw new Error(`Deployment failed: ${await deployResponse.text()}`);
  }

  const deployment = await deployResponse.json();

  return {
    success: true,
    deploymentId: deployment.id,
    deploymentUrl: `https://${deployment.url}`,
  };
}

/**
 * Deploy files directly to Vercel (for projects without GitHub)
 */
async function deployFiles(
  projectName: string,
  files: GeneratedFile[],
  vercelToken: string
): Promise<VercelDeploymentResult> {
  // Convert files to Vercel's format
  const vercelFiles = files.reduce((acc, file) => {
    // Remove leading slash if present
    const path = file.filePath.startsWith("/") ? file.filePath.slice(1) : file.filePath;
    acc[path] = {
      file: Buffer.from(file.content).toString("base64"),
      encoding: "base64",
    };
    return acc;
  }, {} as Record<string, { file: string; encoding: string }>);

  // Deploy to Vercel
  const response = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      files: vercelFiles,
      target: "production",
    }),
  });

  if (!response.ok) {
    throw new Error(`Deployment failed: ${await response.text()}`);
  }

  const deployment = await response.json();

  return {
    success: true,
    deploymentId: deployment.id,
    deploymentUrl: `https://${deployment.url}`,
  };
}

/**
 * Get existing Vercel project
 */
async function getVercelProject(projectName: string, vercelToken: string) {
  const response = await fetch(
    `https://api.vercel.com/v9/projects/${projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`,
    {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

/**
 * Get deployment status from Vercel
 */
export async function getVercelDeploymentStatus(
  deploymentId: string,
  vercelToken: string
): Promise<{
  status: "pending" | "building" | "deploying" | "success" | "failed";
  logs?: string;
  url?: string;
}> {
  try {
    const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    });

    if (!response.ok) {
      return { status: "failed", logs: `Failed to fetch status: ${await response.text()}` };
    }

    const deployment = await response.json();

    // Map Vercel states to our states
    const statusMap: Record<string, "pending" | "building" | "deploying" | "success" | "failed"> = {
      INITIALIZING: "pending",
      QUEUED: "pending",
      BUILDING: "building",
      DEPLOYING: "deploying",
      READY: "success",
      ERROR: "failed",
      CANCELED: "failed",
    };

    return {
      status: statusMap[deployment.readyState] || "pending",
      url: deployment.url ? `https://${deployment.url}` : undefined,
    };
  } catch (error) {
    return {
      status: "failed",
      logs: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get deployment logs from Vercel
 */
export async function getVercelDeploymentLogs(
  deploymentId: string,
  vercelToken: string
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.vercel.com/v2/deployments/${deploymentId}/events`,
      {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      }
    );

    if (!response.ok) {
      return `Failed to fetch logs: ${await response.text()}`;
    }

    const events = await response.json();
    
    // Format events as logs
    return events
      .map((event: any) => `[${new Date(event.created).toISOString()}] ${event.text || event.type}`)
      .join("\n");
  } catch (error) {
    return error instanceof Error ? error.message : "Failed to fetch logs";
  }
}
