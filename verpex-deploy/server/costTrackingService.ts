import { getDb } from "./db";
import { llmApiCalls, userCostSummary, type InsertLlmApiCall } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

/**
 * LLM pricing per 1M tokens (in cents)
 * Based on current market rates as of October 2025
 */
const MODEL_PRICING = {
  "gpt-4": {
    prompt: 3000, // $30 per 1M tokens
    completion: 6000, // $60 per 1M tokens
  },
  "gpt-4-turbo": {
    prompt: 1000, // $10 per 1M tokens
    completion: 3000, // $30 per 1M tokens
  },
  "gpt-3.5-turbo": {
    prompt: 50, // $0.50 per 1M tokens
    completion: 150, // $1.50 per 1M tokens
  },
  "claude-3-5-sonnet": {
    prompt: 300, // $3 per 1M tokens
    completion: 1500, // $15 per 1M tokens
  },
  "claude-3-opus": {
    prompt: 1500, // $15 per 1M tokens
    completion: 7500, // $75 per 1M tokens
  },
} as const;

type ModelName = keyof typeof MODEL_PRICING;

/**
 * Calculate cost in cents for LLM API call
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const modelKey = model as ModelName;
  const pricing = MODEL_PRICING[modelKey] || MODEL_PRICING["gpt-4-turbo"];

  const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * pricing.completion;

  return Math.ceil(promptCost + completionCost);
}

/**
 * Log an LLM API call and update user cost summary
 */
export async function logLlmApiCall(params: {
  userId: number;
  projectId?: number;
  feature: "code_generation" | "codebase_analysis" | "code_modification" | "chat";
  model: string;
  promptTokens: number;
  completionTokens: number;
  responseTime?: number;
  success?: boolean;
  errorMessage?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[CostTracking] Cannot log API call: database not available");
    return;
  }

  const totalTokens = params.promptTokens + params.completionTokens;
  const estimatedCost = calculateCost(params.model, params.promptTokens, params.completionTokens);

  try {
    // Insert API call record
    const callData: InsertLlmApiCall = {
      userId: params.userId,
      projectId: params.projectId,
      feature: params.feature,
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens,
      estimatedCost,
      responseTime: params.responseTime,
      success: params.success !== false ? 1 : 0,
      errorMessage: params.errorMessage,
    };

    await db.insert(llmApiCalls).values(callData);

    // Update user cost summary
    await updateUserCostSummary(params.userId, totalTokens, estimatedCost);
  } catch (error) {
    console.error("[CostTracking] Failed to log API call:", error);
  }
}

/**
 * Update user cost summary (atomic operation)
 */
async function updateUserCostSummary(
  userId: number,
  tokens: number,
  cost: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Try to insert or update
    await db
      .insert(userCostSummary)
      .values({
        userId,
        totalCalls: 1,
        totalTokens: tokens,
        totalCost: cost,
        monthlyCallsCount: 1,
        monthlyCost: cost,
        lastCallAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          totalCalls: sql`totalCalls + 1`,
          totalTokens: sql`totalTokens + ${tokens}`,
          totalCost: sql`totalCost + ${cost}`,
          monthlyCallsCount: sql`monthlyCallsCount + 1`,
          monthlyCost: sql`monthlyCost + ${cost}`,
          lastCallAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[CostTracking] Failed to update user cost summary:", error);
  }
}

/**
 * Get user cost summary
 */
export async function getUserCostSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userCostSummary)
    .where(eq(userCostSummary.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get all users' cost summaries (for admin dashboard)
 */
export async function getAllUserCostSummaries() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      userId: userCostSummary.userId,
      totalCalls: userCostSummary.totalCalls,
      totalTokens: userCostSummary.totalTokens,
      totalCost: userCostSummary.totalCost,
      monthlyCallsCount: userCostSummary.monthlyCallsCount,
      monthlyCost: userCostSummary.monthlyCost,
      lastCallAt: userCostSummary.lastCallAt,
    })
    .from(userCostSummary)
    .orderBy(sql`monthlyCost DESC`);

  return result;
}

/**
 * Get detailed API call history for a user
 */
export async function getUserApiCallHistory(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(llmApiCalls)
    .where(eq(llmApiCalls.userId, userId))
    .orderBy(sql`createdAt DESC`)
    .limit(limit);

  return result;
}

/**
 * Reset monthly costs (should be run on 1st of each month)
 */
export async function resetMonthlyCosts(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(userCostSummary)
      .set({
        monthlyCallsCount: 0,
        monthlyCost: 0,
      });

    console.log("[CostTracking] Monthly costs reset successfully");
  } catch (error) {
    console.error("[CostTracking] Failed to reset monthly costs:", error);
  }
}

/**
 * Get cost statistics for admin dashboard
 */
export async function getCostStatistics() {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select({
        totalUsers: sql<number>`COUNT(DISTINCT userId)`,
        totalCalls: sql<number>`SUM(totalCalls)`,
        totalCost: sql<number>`SUM(totalCost)`,
        monthlyTotalCost: sql<number>`SUM(monthlyCost)`,
      })
      .from(userCostSummary);

    return result[0] || null;
  } catch (error) {
    console.error("[CostTracking] Failed to get cost statistics:", error);
    return null;
  }
}
