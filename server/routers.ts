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
        userMessage: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { addConversationMessage, updateProject } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");

        // Save user message
        await addConversationMessage({
          projectId: input.projectId,
          role: "user",
          content: input.userMessage,
        });

        // Update project status
        await updateProject(input.projectId, { status: "generating" });

        // Call AI to generate response
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert full-stack developer. Help users build web applications by generating clean, production-ready code.",
            },
            {
              role: "user",
              content: input.userMessage,
            },
          ],
        });

        const assistantMessage = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content);

        // Save assistant response
        await addConversationMessage({
          projectId: input.projectId,
          role: "assistant",
          content: assistantMessage,
        });

        return { message: assistantMessage };
      }),
  }),
});

export type AppRouter = typeof appRouter;
