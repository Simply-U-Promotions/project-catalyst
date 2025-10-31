/**
 * Docker Container Management Service
 * 
 * Handles building, deploying, and managing Docker containers
 * for user applications on Project Catalyst's infrastructure.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

export interface BuildOptions {
  projectId: number;
  projectName: string;
  sourceCode: { path: string; content: string }[];
  subdomain: string;
}

export interface DeploymentResult {
  containerId: string;
  port: number;
  deploymentUrl: string;
  buildLogs: string;
}

/**
 * Build a Docker image from source code using Nixpacks
 * Nixpacks automatically detects the language/framework and creates appropriate Dockerfile
 */
export async function buildImage(options: BuildOptions): Promise<{
  imageName: string;
  buildLogs: string;
}> {
  const { projectId, projectName, sourceCode, subdomain } = options;
  
  // Create temporary build directory
  const buildDir = `/tmp/builds/${subdomain}-${Date.now()}`;
  await mkdir(buildDir, { recursive: true });
  
  try {
    // Write source files to build directory
    for (const file of sourceCode) {
      const filePath = join(buildDir, file.path);
      const fileDir = join(filePath, "..");
      await mkdir(fileDir, { recursive: true });
      await writeFile(filePath, file.content);
    }
    
    // Use Nixpacks to build the image
    // Nixpacks detects language and creates optimized Docker image
    const imageName = `catalyst-${subdomain}:latest`;
    
    console.log(`[Docker] Building image ${imageName} from ${buildDir}`);
    
    // In production, this would use nixpacks CLI
    // For now, we'll simulate with a simple Docker build
    const { stdout, stderr } = await execAsync(
      `cd ${buildDir} && docker build -t ${imageName} . 2>&1`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for logs
    );
    
    const buildLogs = stdout + stderr;
    
    console.log(`[Docker] Image ${imageName} built successfully`);
    
    return {
      imageName,
      buildLogs,
    };
  } catch (error) {
    console.error(`[Docker] Build failed:`, error);
    throw new Error(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deploy a Docker container from built image
 */
export async function deployContainer(options: {
  imageName: string;
  subdomain: string;
  cpuLimit?: number; // millicores
  memoryLimit?: number; // MB
}): Promise<DeploymentResult> {
  const { imageName, subdomain, cpuLimit = 1000, memoryLimit = 512 } = options;
  
  try {
    // Find available port
    const port = await findAvailablePort();
    
    // Run container with resource limits
    const containerName = `catalyst-${subdomain}`;
    
    const dockerCmd = [
      `docker run -d`,
      `--name ${containerName}`,
      `--cpus=${cpuLimit / 1000}`, // Convert millicores to CPUs
      `--memory=${memoryLimit}m`,
      `-p ${port}:${port}`, // Map internal port to host
      `--restart unless-stopped`,
      `--label catalyst.subdomain=${subdomain}`,
      imageName,
    ].join(" ");
    
    console.log(`[Docker] Deploying container: ${dockerCmd}`);
    
    const { stdout } = await execAsync(dockerCmd);
    const containerId = stdout.trim();
    
    console.log(`[Docker] Container ${containerId} deployed on port ${port}`);
    
    // Generate deployment URL
    const deploymentUrl = `https://${subdomain}.catalyst.app`;
    
    return {
      containerId,
      port,
      deploymentUrl,
      buildLogs: `Container deployed successfully with ID: ${containerId}`,
    };
  } catch (error) {
    console.error(`[Docker] Deployment failed:`, error);
    throw new Error(`Deployment failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Stop a running container
 */
export async function stopContainer(containerId: string): Promise<void> {
  try {
    await execAsync(`docker stop ${containerId}`);
    console.log(`[Docker] Container ${containerId} stopped`);
  } catch (error) {
    console.error(`[Docker] Failed to stop container:`, error);
    throw error;
  }
}

/**
 * Restart a container
 */
export async function restartContainer(containerId: string): Promise<void> {
  try {
    await execAsync(`docker restart ${containerId}`);
    console.log(`[Docker] Container ${containerId} restarted`);
  } catch (error) {
    console.error(`[Docker] Failed to restart container:`, error);
    throw error;
  }
}

/**
 * Get container logs
 */
export async function getContainerLogs(containerId: string, tail: number = 100): Promise<string> {
  try {
    const { stdout } = await execAsync(`docker logs --tail ${tail} ${containerId} 2>&1`);
    return stdout;
  } catch (error) {
    console.error(`[Docker] Failed to get logs:`, error);
    return `Error fetching logs: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Check container health
 */
export async function checkContainerHealth(containerId: string): Promise<{
  status: "healthy" | "unhealthy" | "unknown";
  uptime: number; // seconds
}> {
  try {
    const { stdout } = await execAsync(
      `docker inspect --format='{{.State.Status}}|{{.State.StartedAt}}' ${containerId}`
    );
    
    const [status, startedAt] = stdout.trim().split("|");
    const startTime = new Date(startedAt).getTime();
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    return {
      status: status === "running" ? "healthy" : "unhealthy",
      uptime,
    };
  } catch (error) {
    console.error(`[Docker] Health check failed:`, error);
    return {
      status: "unknown",
      uptime: 0,
    };
  }
}

/**
 * Remove a stopped container
 */
export async function removeContainer(containerId: string): Promise<void> {
  try {
    await execAsync(`docker rm ${containerId}`);
    console.log(`[Docker] Container ${containerId} removed`);
  } catch (error) {
    console.error(`[Docker] Failed to remove container:`, error);
    throw error;
  }
}

/**
 * Find an available port for deployment
 */
async function findAvailablePort(): Promise<number> {
  // In production, this would check for available ports
  // For now, generate a random port in the range 3000-9000
  const basePort = 3000;
  const maxPort = 9000;
  return Math.floor(Math.random() * (maxPort - basePort)) + basePort;
}

/**
 * Generate unique subdomain for deployment
 */
export function generateSubdomain(projectName: string, userId: number): string {
  // Sanitize project name (remove special chars, lowercase)
  const sanitized = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  
  // Add random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).substring(2, 8);
  
  return `${sanitized}-${suffix}`;
}

/**
 * Simulate Nixpacks buildpack detection
 * In production, this would call the actual nixpacks CLI
 */
export async function detectBuildpack(sourceCode: { path: string; content: string }[]): Promise<{
  framework: string;
  buildCommand?: string;
  startCommand?: string;
}> {
  // Check for package.json (Node.js)
  const packageJson = sourceCode.find(f => f.path === "package.json");
  if (packageJson) {
    return {
      framework: "node",
      buildCommand: "npm install && npm run build",
      startCommand: "npm start",
    };
  }
  
  // Check for requirements.txt (Python)
  const requirementsTxt = sourceCode.find(f => f.path === "requirements.txt");
  if (requirementsTxt) {
    return {
      framework: "python",
      buildCommand: "pip install -r requirements.txt",
      startCommand: "python app.py",
    };
  }
  
  // Check for go.mod (Go)
  const goMod = sourceCode.find(f => f.path === "go.mod");
  if (goMod) {
    return {
      framework: "go",
      buildCommand: "go build",
      startCommand: "./main",
    };
  }
  
  // Default: static site
  return {
    framework: "static",
    startCommand: "npx serve -s .",
  };
}
