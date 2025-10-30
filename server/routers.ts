import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

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
          };
        } catch (error) {
          await updateProject(input.projectId, { status: "failed" });
          throw error;
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
