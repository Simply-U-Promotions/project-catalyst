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
    modifyCode: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getProjectById, getProjectFiles } = await import("./db");
        
        // Get project and files
        const project = await getProjectById(input.projectId);
        if (!project || !project.githubRepoUrl) {
          throw new Error("Project not found or not linked to GitHub");
        }
        
        const files = await getProjectFiles(input.projectId);
        
        // Analyze and generate modifications
        const result = await analyzeAndModifyCode({
          description: input.description,
          files: files.map(f => ({
            path: f.filePath,
            content: f.content,
            language: f.language || undefined,
          })),
          repoName: project.name,
        });
        
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

  // Admin-only endpoints for cost monitoring
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
