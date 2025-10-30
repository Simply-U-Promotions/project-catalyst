import { GeneratedFile } from "../../drizzle/schema";

interface RailwayDeploymentOptions {
  projectName: string;
  files: GeneratedFile[];
  githubRepoUrl?: string;
  railwayToken: string;
}

interface RailwayDeploymentResult {
  success: boolean;
  deploymentId?: string;
  deploymentUrl?: string;
  error?: string;
}

/**
 * Deploy a project to Railway using their GraphQL API
 * Documentation: https://docs.railway.app/reference/public-api
 */
export async function deployToRailway(
  options: RailwayDeploymentOptions
): Promise<RailwayDeploymentResult> {
  const { projectName, githubRepoUrl, railwayToken } = options;

  try {
    if (!githubRepoUrl) {
      throw new Error("Railway requires a GitHub repository URL");
    }

    // Extract owner and repo from GitHub URL
    const match = githubRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error("Invalid GitHub URL format");
    }

    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, "");

    // Step 1: Create Railway project
    const projectId = await createRailwayProject(projectName, railwayToken);

    // Step 2: Connect GitHub repository
    await connectGitHubRepo(projectId, `${owner}/${repoName}`, railwayToken);

    // Step 3: Create service and trigger deployment
    const { serviceId, deploymentId, deploymentUrl } = await createServiceAndDeploy(
      projectId,
      projectName,
      railwayToken
    );

    return {
      success: true,
      deploymentId: `${projectId}:${serviceId}:${deploymentId}`,
      deploymentUrl,
    };
  } catch (error) {
    console.error("[Railway] Deployment failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a new Railway project
 */
async function createRailwayProject(
  projectName: string,
  railwayToken: string
): Promise<string> {
  const query = `
    mutation ProjectCreate($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        id
        name
      }
    }
  `;

  const response = await fetch("https://backboard.railway.app/graphql/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${railwayToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        input: {
          name: projectName,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create project: ${await response.text()}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
  }

  return result.data.projectCreate.id;
}

/**
 * Connect GitHub repository to Railway project
 */
async function connectGitHubRepo(
  projectId: string,
  repoFullName: string,
  railwayToken: string
): Promise<void> {
  const query = `
    mutation ProjectTokenCreate($projectId: String!) {
      projectTokenCreate(projectId: $projectId) {
        token
      }
    }
  `;

  const response = await fetch("https://backboard.railway.app/graphql/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${railwayToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        projectId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to connect GitHub repo: ${await response.text()}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
  }
}

/**
 * Create service and trigger deployment
 */
async function createServiceAndDeploy(
  projectId: string,
  serviceName: string,
  railwayToken: string
): Promise<{ serviceId: string; deploymentId: string; deploymentUrl: string }> {
  const query = `
    mutation ServiceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `;

  const response = await fetch("https://backboard.railway.app/graphql/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${railwayToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        input: {
          projectId,
          name: serviceName,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create service: ${await response.text()}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
  }

  const serviceId = result.data.serviceCreate.id;

  // Trigger deployment
  const deployQuery = `
    mutation DeploymentTrigger($serviceId: String!) {
      deploymentTrigger(serviceId: $serviceId) {
        id
        url
      }
    }
  `;

  const deployResponse = await fetch("https://backboard.railway.app/graphql/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${railwayToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: deployQuery,
      variables: {
        serviceId,
      },
    }),
  });

  if (!deployResponse.ok) {
    throw new Error(`Failed to trigger deployment: ${await deployResponse.text()}`);
  }

  const deployResult = await deployResponse.json();
  
  if (deployResult.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(deployResult.errors)}`);
  }

  return {
    serviceId,
    deploymentId: deployResult.data.deploymentTrigger.id,
    deploymentUrl: deployResult.data.deploymentTrigger.url || `https://${serviceName}.up.railway.app`,
  };
}

/**
 * Get deployment status from Railway
 */
export async function getRailwayDeploymentStatus(
  deploymentId: string,
  railwayToken: string
): Promise<{
  status: "pending" | "building" | "deploying" | "success" | "failed";
  logs?: string;
  url?: string;
}> {
  try {
    // Parse composite deployment ID
    const [projectId, serviceId, actualDeploymentId] = deploymentId.split(":");

    const query = `
      query Deployment($id: String!) {
        deployment(id: $id) {
          id
          status
          url
        }
      }
    `;

    const response = await fetch("https://backboard.railway.app/graphql/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${railwayToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          id: actualDeploymentId,
        },
      }),
    });

    if (!response.ok) {
      return { status: "failed", logs: `Failed to fetch status: ${await response.text()}` };
    }

    const result = await response.json();
    
    if (result.errors) {
      return { status: "failed", logs: `GraphQL error: ${JSON.stringify(result.errors)}` };
    }

    const deployment = result.data.deployment;

    // Map Railway states to our states
    const statusMap: Record<string, "pending" | "building" | "deploying" | "success" | "failed"> = {
      INITIALIZING: "pending",
      BUILDING: "building",
      DEPLOYING: "deploying",
      SUCCESS: "success",
      FAILED: "failed",
      CRASHED: "failed",
      REMOVED: "failed",
    };

    return {
      status: statusMap[deployment.status] || "pending",
      url: deployment.url,
    };
  } catch (error) {
    return {
      status: "failed",
      logs: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get deployment logs from Railway
 */
export async function getRailwayDeploymentLogs(
  deploymentId: string,
  railwayToken: string
): Promise<string> {
  try {
    // Parse composite deployment ID
    const [projectId, serviceId, actualDeploymentId] = deploymentId.split(":");

    const query = `
      query DeploymentLogs($deploymentId: String!) {
        deploymentLogs(deploymentId: $deploymentId) {
          logs
        }
      }
    `;

    const response = await fetch("https://backboard.railway.app/graphql/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${railwayToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          deploymentId: actualDeploymentId,
        },
      }),
    });

    if (!response.ok) {
      return `Failed to fetch logs: ${await response.text()}`;
    }

    const result = await response.json();
    
    if (result.errors) {
      return `GraphQL error: ${JSON.stringify(result.errors)}`;
    }

    return result.data.deploymentLogs.logs || "No logs available";
  } catch (error) {
    return error instanceof Error ? error.message : "Failed to fetch logs";
  }
}
