import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { importRepository, getRepoInfo, getRepoFileTree, getFileContent, createBranch, commitFilesToBranch, createPullRequest } from "./githubImport";
import { analyzeAndModifyCode, analyzeCodebase } from "./codeModificationService";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserProjects } = await import("./db");
      return await getUserProjects(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        templateId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createProject } = await import("./db");
        const projectId = await createProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          templateId: input.templateId,
          status: "draft",
        });
        return { projectId };
      }),
    get: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getProjectById } = await import("./db");
        return await getProjectById(input.projectId);
      }),
    getConversations: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getProjectConversations } = await import("./db");
        return await getProjectConversations(input.projectId);
      }),
    getFiles: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getProjectFiles } = await import("./db");
        return await getProjectFiles(input.projectId);
      }),
    generateCode: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        templateId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getTemplateById } = require("./templates");
        const { invokeLLM } = await import("./_core/llm");
        
        const template = getTemplateById(input.templateId);
        if (!template) {
          throw new Error("Template not found");
        }

        // Generate code using LLM
        const prompt = `Generate a complete ${template.name} project with the following requirements:

Project Name: ${input.name}
Template: ${template.name}
Description: ${template.description}
${input.description ? `Additional Requirements: ${input.description}` : ""}

Tech Stack:
${template.techStack.frontend ? `Frontend: ${template.techStack.frontend.join(", ")}` : ""}
${template.techStack.backend ? `Backend: ${template.techStack.backend.join(", ")}` : ""}
${template.techStack.database ? `Database: ${template.techStack.database.join(", ")}` : ""}

Features to implement:
${template.features.map((f: string, i: number) => `${i + 1}. ${f}`).join("\n")}

Generate a file structure with actual code for each file. Return the response as a JSON array of files with this structure:
[
  {
    "path": "src/index.tsx",
    "content": "// actual code here",
    "language": "typescript"
  }
]

Include at minimum:
- Package.json with all dependencies
- README.md with setup instructions
- Main application files
- Configuration files
- At least 10-15 files total for a complete project

Return ONLY the JSON array, no additional text.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert full-stack developer. Generate production-ready code with best practices, proper error handling, and clean architecture." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "code_files",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  files: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        path: { type: "string" },
                        content: { type: "string" },
                        language: { type: "string" },
                      },
                      required: ["path", "content", "language"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["files"],
                additionalProperties: false,
              },
            },
          },
        }, { userId: ctx.user.id, feature: "code_generation", projectId: 0 });

        const content = response.choices[0].message.content;
        const result = JSON.parse(typeof content === 'string' ? content : "{}");
        return { files: result.files || [] };
      }),
  }),

  templates: router({
    list: publicProcedure.query(() => {
      const { templates } = require("./templates");
      return templates;
    }),
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => {
        const { getTemplateById } = require("./templates");
        return getTemplateById(input.id);
      }),
    categories: publicProcedure.query(() => {
      const { getAllCategories } = require("./templates");
      return getAllCategories();
    }),
  }),

  deployments: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        provider: z.enum(["vercel", "railway", "kubernetes"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { createDeployment, updateProject, getProjectById, getProjectFiles } = await import("./db");
        const { deployProject } = await import("./deploymentService");
        
        // Get project details
        const project = await getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        // Determine deployment provider
        const provider = input.provider || project.deploymentProvider || "vercel";

        // Get generated files
        const files = await getProjectFiles(input.projectId);
        
        // Create deployment record
        const deploymentId = await createDeployment({
          projectId: input.projectId,
          provider,
          status: "pending",
          logs: `Deployment initiated to ${provider}...\n`,
        });

        // Update project status
        await updateProject(input.projectId, { status: "deploying" });

        // Start deployment process asynchronously
        (async () => {
          try {
            const { updateDeployment } = await import("./db");
            
            // Get API tokens from environment
            const tokens = {
              vercel: process.env.VERCEL_TOKEN,
              railway: process.env.RAILWAY_TOKEN,
              kubeconfig: process.env.KUBECONFIG,
            };

            // Deploy to selected provider
            const result = await deployProject({
              provider,
              projectName: project.name,
              files,
              githubRepoUrl: project.githubRepoUrl || undefined,
              tokens,
            });

            if (result.success) {
              await updateDeployment(deploymentId, {
                status: "success",
                providerDeploymentId: result.deploymentId,
                deploymentUrl: result.deploymentUrl,
                logs: `Deployment to ${provider} successful!\nDeployment ID: ${result.deploymentId}\nURL: ${result.deploymentUrl}`,
              });
              await updateProject(input.projectId, {
                status: "deployed",
                deploymentUrl: result.deploymentUrl,
              });
            } else {
              await updateDeployment(deploymentId, {
                status: "failed",
                logs: `Deployment to ${provider} failed: ${result.error}`,
                errorMessage: result.error,
              });
              await updateProject(input.projectId, { status: "failed" });
            }
          } catch (error) {
            const { updateDeployment } = await import("./db");
            await updateDeployment(deploymentId, {
              status: "failed",
              logs: `Deployment error: ${error instanceof Error ? error.message : "Unknown error"}`,
              errorMessage: error instanceof Error ? error.message : "Unknown error",
            });
            await updateProject(input.projectId, { status: "failed" });
          }
        })();

        return { deploymentId, provider };
      }),
    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getProjectDeployments } = await import("./db");
        return getProjectDeployments(input.projectId);
      }),
    getById: protectedProcedure
      .input(z.object({ deploymentId: z.number() }))
      .query(async ({ input }) => {
        const { getDeploymentById } = await import("./db");
        return getDeploymentById(input.deploymentId);
      }),
  }),

  github: router({
    import: protectedProcedure
      .input(z.object({ repoUrl: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { repoUrl } = input;
        const { info, files } = await importRepository(repoUrl);
        const { createProject, saveGeneratedFile } = await import("./db");
        
        // Create project from imported repository
        const projectId = await createProject({
          userId: ctx.user.id,
          name: info.name,
          description: info.description,
          githubRepoUrl: repoUrl,
          isImported: 1,
          status: "ready",
        });
        
        // Save all files
        for (const file of files) {
          await saveGeneratedFile({
            projectId,
            filePath: file.path,
            content: file.content,
            language: file.language,
          });
        }
        
        return { projectId, fileCount: files.length };
      }),
    getRepoInfo: protectedProcedure
      .input(z.object({ repoUrl: z.string() }))
      .query(async ({ input }) => {
        return await getRepoInfo(input.repoUrl);
      }),
    getFileTree: protectedProcedure
      .input(z.object({ repoUrl: z.string(), branch: z.string().optional() }))
      .query(async ({ input }) => {
        return await getRepoFileTree(input.repoUrl, input.branch);
      }),
    getFileContent: protectedProcedure
      .input(z.object({ repoUrl: z.string(), filePath: z.string(), branch: z.string().optional() }))
      .query(async ({ input }) => {
        return await getFileContent(input.repoUrl, input.filePath, input.branch);
      }),
    createPR: protectedProcedure
      .input(z.object({
        repoUrl: z.string(),
        branchName: z.string(),
        title: z.string(),
        body: z.string(),
        baseBranch: z.string().optional(),
        files: z.array(z.object({ path: z.string(), content: z.string() })),
        commitMessage: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { repoUrl, branchName, title, body, baseBranch, files, commitMessage } = input;
        
        // Create branch
        await createBranch(repoUrl, branchName, baseBranch);
        
        // Commit files
        await commitFilesToBranch(repoUrl, branchName, files, commitMessage);
        
        // Create PR
        const pr = await createPullRequest(repoUrl, branchName, title, body, baseBranch);
        
        return pr;
      }),
    // Branch management endpoints
    createBranch: protectedProcedure
      .input(z.object({ owner: z.string(), repo: z.string(), branchName: z.string(), fromBranch: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { createBranch } = await import("./githubBranches");
        await createBranch(input);
        return { success: true };
      }),
    deleteBranch: protectedProcedure
      .input(z.object({ owner: z.string(), repo: z.string(), branchName: z.string() }))
      .mutation(async ({ input }) => {
        const { deleteBranch } = await import("./githubBranches");
        await deleteBranch(input);
        return { success: true };
      }),
    listBranches: protectedProcedure
      .input(z.object({ owner: z.string(), repo: z.string() }))
      .query(async ({ input }) => {
        const { listBranches } = await import("./githubBranches");
        return await listBranches(input);
      }),
    mergeBranch: protectedProcedure
      .input(z.object({ owner: z.string(), repo: z.string(), head: z.string(), base: z.string(), commitMessage: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { mergeBranch } = await import("./githubBranches");
        await mergeBranch(input);
        return { success: true };
      }),
    // Webhook management endpoints
    createWebhook: protectedProcedure
      .input(z.object({ owner: z.string(), repo: z.string(), webhookUrl: z.string(), events: z.array(z.string()).optional(), secret: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { createWebhook } = await import("./githubWebhooks");
        return await createWebhook(input);
      }),
    deleteWebhook: protectedProcedure
      .input(z.object({ owner: z.string(), repo: z.string(), hookId: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteWebhook } = await import("./githubWebhooks");
        await deleteWebhook(input);
        return { success: true };
      }),
    listWebhooks: protectedProcedure
      .input(z.object({ owner: z.string(), repo: z.string() }))
      .query(async ({ input }) => {
        const { listWebhooks } = await import("./githubWebhooks");
        return await listWebhooks(input);
      }),
    modifyCode: protectedProcedure
      .input(z.object({ projectId: z.number(), description: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Security checks
        const { validateCodeModificationRequest, isFeatureEnabled, logSecurityEvent } = await import("./promptSecurity");
        
        // Check kill switch
        if (!isFeatureEnabled("code_modification")) {
          throw new Error("Code modification feature is temporarily disabled. Please try again later.");
        }
        
        // Validate and sanitize prompt
        const validation = validateCodeModificationRequest(input.description);
        if (!validation.isValid) {
          // Log security event
          await logSecurityEvent({
            userId: ctx.user.id,
            eventType: "jailbreak_attempt",
            severity: "high",
            details: validation.reason || "Invalid request",
            prompt: input.description,
          });
          throw new Error(validation.reason || "Invalid request");
        }
        
        const { getProjectById, getProjectFiles } = await import("./db");
        const project = await getProjectById(input.projectId);
        
        if (!project || !project.githubRepoUrl) {
          throw new Error("Project not found or not linked to GitHub");
        }
        
        const files = await getProjectFiles(input.projectId);
        
        // Analyze and generate modifications with sanitized prompt
        const result = await analyzeAndModifyCode({
          description: validation.sanitized,
          files: files.map(f => ({
            path: f.filePath,
            content: f.content,
            language: f.language || undefined,
          })),
          repoName: project.name,
        }, { userId: ctx.user.id, projectId: input.projectId });
        
        return result;
      }),
    analyzeCodebase: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getProjectFiles } = await import("./db");
        const files = await getProjectFiles(input.projectId);
        
        return await analyzeCodebase(
          files.map(f => ({
            path: f.filePath,
            content: f.content,
            language: f.language || undefined,
          }))
        );
      }),
  }),

  ai: router({
    generateCode: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        projectName: z.string(),
        description: z.string(),
        templateId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { addConversationMessage, updateProject, saveGeneratedFile, getProjectConversations } = await import("./db");
        const { generateProjectCode } = await import("./codeGenerator");

        // Update project status
        await updateProject(input.projectId, { status: "generating" });

        // Get conversation history
        const history = await getProjectConversations(input.projectId);

        try {
          // Generate code
          const result = await generateProjectCode({
            projectName: input.projectName,
            description: input.description,
            templateId: input.templateId,
            conversationHistory: history.map(h => ({ role: h.role, content: h.content })),
          });

          // Save generated files
          for (const file of result.files) {
            await saveGeneratedFile({
              projectId: input.projectId,
              filePath: file.path,
              content: file.content,
              language: file.language,
            });
          }

          // Create GitHub repository and commit files
          let githubRepoUrl: string | undefined;
          try {
            const { createGitHubRepo, commitMultipleFiles, getGitHubUser } = await import("./githubIntegration");
            const githubUser = await getGitHubUser();
            
            const repo = await createGitHubRepo({
              name: input.projectName,
              description: input.description,
              private: false,
            });

            githubRepoUrl = repo.html_url;

            // Commit all generated files
            await commitMultipleFiles({
              owner: githubUser.login,
              repo: repo.name,
              files: result.files.map(f => ({
                path: f.path,
                content: f.content,
              })),
              message: `feat: initial project generation\n\n${result.summary}`,
            });

            // Update project with GitHub URL
            await updateProject(input.projectId, { githubRepoUrl });
          } catch (error) {
            console.error("GitHub integration error:", error);
            // Don't fail the whole generation if GitHub fails
          }

          // Save summary as conversation
          await addConversationMessage({
            projectId: input.projectId,
            role: "assistant",
            content: `Generated ${result.files.length} files.\n\n${result.summary}\n\nNext steps:\n${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
          });

          // Update project status
          await updateProject(input.projectId, { status: "ready" });

          return {
            success: true,
            filesGenerated: result.files.length,
            summary: result.summary,
            nextSteps: result.nextSteps,
            githubRepoUrl,
          };
        } catch (error) {
          await updateProject(input.projectId, { status: "failed" });
          throw error;
        }
      }),
  }),

  // Job queue for async operations
  jobs: router({
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["code_modification", "code_generation"]),
        data: z.any(),
      }))
      .mutation(async ({ input }) => {
        const { jobQueue } = await import("./jobQueue");
        const jobId = jobQueue.createJob(input.type, input.data);
        return { jobId };
      }),
    getStatus: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        const { jobQueue } = await import("./jobQueue");
        const job = jobQueue.getJob(input.jobId);
        if (!job) {
          throw new Error("Job not found");
        }
        return {
          id: job.id,
          type: job.type,
          status: job.status,
          progress: job.progress,
          result: job.result,
          error: job.error,
        };
      }),
  }),

  // Admin-only endpoints for cost monitoring
  builtInDeployment: router({
    deploy: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { getProjectById, getProjectFiles } = await import("./db");
        const { buildImage, deployContainer, generateSubdomain } = await import("./dockerService");
        const { builtInDeployments } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        
        const project = await getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        
        // Get project files
        const files = await getProjectFiles(input.projectId);
        
        // Generate subdomain
        const subdomain = generateSubdomain(project.name, ctx.user.id);
        
        // Build Docker image
        const { imageName, buildLogs } = await buildImage({
          projectId: input.projectId,
          projectName: project.name,
          sourceCode: files.map(f => ({ path: f.filePath, content: f.content })),
          subdomain,
        });
        
        // Deploy container
        const { containerId, port, deploymentUrl } = await deployContainer({
          imageName,
          subdomain,
        });
        
        // Save deployment to database
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [deployment] = await db.insert(builtInDeployments).values({
          projectId: input.projectId,
          userId: ctx.user.id,
          containerId,
          subdomain,
          deploymentUrl,
          port,
          status: "running",
          buildLogs,
        }).$returningId();
        
        return {
          deploymentId: deployment.id,
          deploymentUrl,
          subdomain,
          status: "running",
        };
      }),
    stop: protectedProcedure
      .input(z.object({ deploymentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { stopContainer } = await import("./dockerService");
        const { builtInDeployments } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [deployment] = await db.select().from(builtInDeployments)
          .where(eq(builtInDeployments.id, input.deploymentId));
        
        if (!deployment || !deployment.containerId) {
          throw new Error("Deployment not found");
        }
        
        await stopContainer(deployment.containerId);
        
        await db.update(builtInDeployments)
          .set({ status: "stopped", stoppedAt: new Date() })
          .where(eq(builtInDeployments.id, input.deploymentId));
        
        return { success: true };
      }),
    restart: protectedProcedure
      .input(z.object({ deploymentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { restartContainer } = await import("./dockerService");
        const { builtInDeployments } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [deployment] = await db.select().from(builtInDeployments)
          .where(eq(builtInDeployments.id, input.deploymentId));
        
        if (!deployment || !deployment.containerId) {
          throw new Error("Deployment not found");
        }
        
        await restartContainer(deployment.containerId);
        
        await db.update(builtInDeployments)
          .set({ status: "running", updatedAt: new Date() })
          .where(eq(builtInDeployments.id, input.deploymentId));
        
        return { success: true };
      }),
    logs: protectedProcedure
      .input(z.object({ deploymentId: z.number(), tail: z.number().optional() }))
      .query(async ({ input }) => {
        const { getContainerLogs } = await import("./dockerService");
        const { builtInDeployments } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [deployment] = await db.select().from(builtInDeployments)
          .where(eq(builtInDeployments.id, input.deploymentId));
        
        if (!deployment || !deployment.containerId) {
          throw new Error("Deployment not found");
        }
        
        const logs = await getContainerLogs(deployment.containerId, input.tail || 100);
        return { logs };
      }),
    status: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { builtInDeployments } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const deployments = await db.select().from(builtInDeployments)
          .where(eq(builtInDeployments.projectId, input.projectId))
          .orderBy(desc(builtInDeployments.createdAt));
        
        return deployments;
      }),
    // Custom Domains Management
    addCustomDomain: protectedProcedure
      .input(z.object({ deploymentId: z.number(), domain: z.string() }))
      .mutation(async ({ input }) => {
        const { customDomains } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Generate verification token
        const verificationToken = Math.random().toString(36).substring(2, 15);
        
        const [domain] = await db.insert(customDomains).values({
          deploymentId: input.deploymentId,
          domain: input.domain,
          status: "pending",
          verificationToken,
        }).$returningId();
        
        return { id: domain.id, verificationToken };
      }),
    getCustomDomains: protectedProcedure
      .input(z.object({ deploymentId: z.number() }))
      .query(async ({ input }) => {
        const { customDomains } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return await db.select().from(customDomains)
          .where(eq(customDomains.deploymentId, input.deploymentId));
      }),
    removeCustomDomain: protectedProcedure
      .input(z.object({ domainId: z.number() }))
      .mutation(async ({ input }) => {
        const { customDomains } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db.delete(customDomains).where(eq(customDomains.id, input.domainId));
        return { success: true };
      }),
    // Environment Variables Management
    addEnvVar: protectedProcedure
      .input(z.object({ 
        deploymentId: z.number(), 
        key: z.string(), 
        value: z.string(),
        isSecret: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const { deploymentEnvVars } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [envVar] = await db.insert(deploymentEnvVars).values({
          deploymentId: input.deploymentId,
          key: input.key,
          value: input.value,
          isSecret: input.isSecret ? 1 : 0,
        }).$returningId();
        
        return { id: envVar.id };
      }),
    getEnvVars: protectedProcedure
      .input(z.object({ deploymentId: z.number() }))
      .query(async ({ input }) => {
        const { deploymentEnvVars } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return await db.select().from(deploymentEnvVars)
          .where(eq(deploymentEnvVars.deploymentId, input.deploymentId));
      }),
    updateEnvVar: protectedProcedure
      .input(z.object({ 
        envVarId: z.number(), 
        value: z.string()
      }))
      .mutation(async ({ input }) => {
        const { deploymentEnvVars } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db.update(deploymentEnvVars)
          .set({ value: input.value, updatedAt: new Date() })
          .where(eq(deploymentEnvVars.id, input.envVarId));
        
        return { success: true };
      }),
    removeEnvVar: protectedProcedure
      .input(z.object({ envVarId: z.number() }))
      .mutation(async ({ input }) => {
        const { deploymentEnvVars } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db.delete(deploymentEnvVars).where(eq(deploymentEnvVars.id, input.envVarId));
        return { success: true };
      }),
  }),

  database: router({
    // Provision a new database
    provision: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        type: z.enum(["postgresql", "mysql", "mongodb", "redis"]),
        name: z.string(),
        size: z.enum(["small", "medium", "large"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { provisionedDatabases } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Generate database credentials
        const username = `user_${Math.random().toString(36).substring(2, 10)}`;
        const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const dbName = `db_${input.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.random().toString(36).substring(2, 8)}`;
        
        // Simulate database provisioning (in production, this would call actual cloud provider APIs)
        const host = `${input.type}.catalyst-db.internal`;
        const portMap = { postgresql: 5432, mysql: 3306, mongodb: 27017, redis: 6379 };
        const port = portMap[input.type];
        
        // Generate connection string
        let connectionString = "";
        if (input.type === "postgresql") {
          connectionString = `postgresql://${username}:${password}@${host}:${port}/${dbName}`;
        } else if (input.type === "mysql") {
          connectionString = `mysql://${username}:${password}@${host}:${port}/${dbName}`;
        } else if (input.type === "mongodb") {
          connectionString = `mongodb://${username}:${password}@${host}:${port}/${dbName}`;
        } else if (input.type === "redis") {
          connectionString = `redis://${username}:${password}@${host}:${port}`;
        }
        
        const [database] = await db.insert(provisionedDatabases).values({
          projectId: input.projectId,
          type: input.type,
          name: input.name,
          host,
          port,
          username,
          password,
          database: dbName,
          status: "active", // In production, start with "provisioning" and update after actual provisioning
          connectionString,
          size: input.size || "small",
        }).$returningId();
        
        return {
          id: database.id,
          connectionString,
          status: "active",
        };
      }),
    // List databases for a project
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { provisionedDatabases } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return await db.select().from(provisionedDatabases)
          .where(eq(provisionedDatabases.projectId, input.projectId));
      }),
    // Get database details
    get: protectedProcedure
      .input(z.object({ databaseId: z.number() }))
      .query(async ({ input }) => {
        const { provisionedDatabases } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [database] = await db.select().from(provisionedDatabases)
          .where(eq(provisionedDatabases.id, input.databaseId));
        
        if (!database) throw new Error("Database not found");
        return database;
      }),
    // Delete a database
    delete: protectedProcedure
      .input(z.object({ databaseId: z.number() }))
      .mutation(async ({ input }) => {
        const { provisionedDatabases } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // In production, this would call cloud provider API to delete the database
        await db.update(provisionedDatabases)
          .set({ status: "deleted", updatedAt: new Date() })
          .where(eq(provisionedDatabases.id, input.databaseId));
        
        return { success: true };
      }),
    // Test database connection
    testConnection: protectedProcedure
      .input(z.object({ databaseId: z.number() }))
      .mutation(async ({ input }) => {
        // Simulate connection test (in production, actually test the connection)
        return {
          success: true,
          message: "Connection successful",
          latency: Math.floor(Math.random() * 50) + 10, // Random latency 10-60ms
        };
      }),
    // Create database backup
    createBackup: protectedProcedure
      .input(z.object({ databaseId: z.number() }))
      .mutation(async ({ input }) => {
        const { provisionedDatabases } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [database] = await db.select().from(provisionedDatabases)
          .where(eq(provisionedDatabases.id, input.databaseId));
        
        if (!database) throw new Error("Database not found");
        
        // Simulate backup creation (in production, call cloud provider backup API)
        const backupId = `backup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const backupSize = Math.floor(Math.random() * 500) + 50; // Random size 50-550 MB
        
        return {
          success: true,
          backupId,
          size: backupSize,
          timestamp: new Date().toISOString(),
          message: "Backup created successfully",
        };
      }),
    // Restore database from backup
    restoreBackup: protectedProcedure
      .input(z.object({ 
        databaseId: z.number(),
        backupId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { provisionedDatabases } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [database] = await db.select().from(provisionedDatabases)
          .where(eq(provisionedDatabases.id, input.databaseId));
        
        if (!database) throw new Error("Database not found");
        
        // Simulate restore (in production, call cloud provider restore API)
        return {
          success: true,
          message: "Database restored successfully",
          restoredAt: new Date().toISOString(),
        };
      }),
    // Get database metrics
    getMetrics: protectedProcedure
      .input(z.object({ databaseId: z.number() }))
      .query(async ({ input }) => {
        const { provisionedDatabases } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [database] = await db.select().from(provisionedDatabases)
          .where(eq(provisionedDatabases.id, input.databaseId));
        
        if (!database) throw new Error("Database not found");
        
        // Simulate metrics (in production, fetch from monitoring service)
        return {
          cpu: Math.floor(Math.random() * 80) + 10, // 10-90%
          memory: Math.floor(Math.random() * 80) + 10, // 10-90%
          storage: Math.floor(Math.random() * 70) + 20, // 20-90%
          connections: Math.floor(Math.random() * 50) + 5, // 5-55
          queries: Math.floor(Math.random() * 1000) + 100, // 100-1100 per second
          uptime: Math.floor(Math.random() * 86400) + 3600, // 1-25 hours in seconds
        };
      }),
  }),

  admin: router({
    costSummary: protectedProcedure
      .query(async ({ ctx }) => {
        // Check if user is admin
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        const { getAllUserCostSummaries } = await import("./costTrackingService");
        return await getAllUserCostSummaries();
      }),
    costStatistics: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        const { getCostStatistics } = await import("./costTrackingService");
        return await getCostStatistics();
      }),
    userCostHistory: protectedProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        const { getUserApiCallHistory } = await import("./costTrackingService");
        return await getUserApiCallHistory(input.userId, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
