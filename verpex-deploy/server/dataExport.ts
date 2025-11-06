import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Export all user data in a portable JSON format (GDPR Article 20 - Right to Data Portability)
 */
export async function exportUserData(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Fetch user data
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user) {
    throw new Error("User not found");
  }

  // Collect all user-related data
  const exportData = {
    exportDate: new Date().toISOString(),
    exportVersion: "1.0.0",
    user: {
      id: user.id,
      openId: user.openId,
      name: user.name,
      email: user.email,
      loginMethod: user.loginMethod,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSignedIn: user.lastSignedIn,
    },
    projects: [],
    deployments: [],
    apiKeys: [],
    costTracking: [],
    usageAnalytics: [],
    conversations: [],
  };

  try {
    // Fetch projects
    const { projects } = await import("../drizzle/schema");
    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    exportData.projects = userProjects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      repositoryUrl: p.repositoryUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  } catch (error) {
    console.warn("Projects table not found or error fetching projects:", error);
  }

  try {
    // Fetch deployments
    const { deployments } = await import("../drizzle/schema");
    const userDeployments = await db.select().from(deployments).where(eq(deployments.userId, userId));
    exportData.deployments = userDeployments.map(d => ({
      id: d.id,
      projectId: d.projectId,
      provider: d.provider,
      status: d.status,
      url: d.url,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  } catch (error) {
    console.warn("Deployments table not found or error fetching deployments:", error);
  }

  try {
    // Fetch API keys (excluding sensitive key values)
    const { apiKeys } = await import("../drizzle/schema");
    const userApiKeys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
    exportData.apiKeys = userApiKeys.map(k => ({
      id: k.id,
      provider: k.provider,
      keyName: k.keyName,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
      // Note: Encrypted key values are NOT exported for security
    }));
  } catch (error) {
    console.warn("API keys table not found or error fetching API keys:", error);
  }

  try {
    // Fetch cost tracking data
    const { costTracking } = await import("../drizzle/schema");
    const userCosts = await db.select().from(costTracking).where(eq(costTracking.userId, userId));
    exportData.costTracking = userCosts.map(c => ({
      id: c.id,
      projectId: c.projectId,
      action: c.action,
      cost: c.cost,
      details: c.details,
      timestamp: c.timestamp,
    }));
  } catch (error) {
    console.warn("Cost tracking table not found or error fetching cost data:", error);
  }

  try {
    // Fetch usage analytics
    const { usageAnalytics } = await import("../drizzle/schema");
    const userAnalytics = await db.select().from(usageAnalytics).where(eq(usageAnalytics.userId, userId));
    exportData.usageAnalytics = userAnalytics.map(a => ({
      id: a.id,
      metric: a.metric,
      value: a.value,
      timestamp: a.timestamp,
    }));
  } catch (error) {
    console.warn("Usage analytics table not found or error fetching analytics:", error);
  }

  try {
    // Fetch AI conversations
    const { conversations } = await import("../drizzle/schema");
    const userConversations = await db.select().from(conversations).where(eq(conversations.userId, userId));
    exportData.conversations = userConversations.map(c => ({
      id: c.id,
      projectId: c.projectId,
      messages: c.messages,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  } catch (error) {
    console.warn("Conversations table not found or error fetching conversations:", error);
  }

  return {
    success: true,
    data: exportData,
    format: "application/json",
    filename: `project-catalyst-data-export-${userId}-${Date.now()}.json`,
  };
}

/**
 * Delete user account and all associated data (GDPR Article 17 - Right to Erasure)
 */
export async function deleteUserAccount(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  console.log(`[DataDeletion] Starting account deletion for user ${userId}`);

  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints

    // Delete conversations
    try {
      const { conversations } = await import("../drizzle/schema");
      await db.delete(conversations).where(eq(conversations.userId, userId));
      console.log(`[DataDeletion] Deleted conversations for user ${userId}`);
    } catch (error) {
      console.warn("Conversations table not found or error deleting:", error);
    }

    // Delete usage analytics
    try {
      const { usageAnalytics } = await import("../drizzle/schema");
      await db.delete(usageAnalytics).where(eq(usageAnalytics.userId, userId));
      console.log(`[DataDeletion] Deleted usage analytics for user ${userId}`);
    } catch (error) {
      console.warn("Usage analytics table not found or error deleting:", error);
    }

    // Delete cost tracking
    try {
      const { costTracking } = await import("../drizzle/schema");
      await db.delete(costTracking).where(eq(costTracking.userId, userId));
      console.log(`[DataDeletion] Deleted cost tracking for user ${userId}`);
    } catch (error) {
      console.warn("Cost tracking table not found or error deleting:", error);
    }

    // Delete cost alerts
    try {
      const { costAlerts } = await import("../drizzle/schema");
      await db.delete(costAlerts).where(eq(costAlerts.userId, userId));
      console.log(`[DataDeletion] Deleted cost alerts for user ${userId}`);
    } catch (error) {
      console.warn("Cost alerts table not found or error deleting:", error);
    }

    // Delete API keys
    try {
      const { apiKeys } = await import("../drizzle/schema");
      await db.delete(apiKeys).where(eq(apiKeys.userId, userId));
      console.log(`[DataDeletion] Deleted API keys for user ${userId}`);
    } catch (error) {
      console.warn("API keys table not found or error deleting:", error);
    }

    // Delete deployments
    try {
      const { deployments } = await import("../drizzle/schema");
      await db.delete(deployments).where(eq(deployments.userId, userId));
      console.log(`[DataDeletion] Deleted deployments for user ${userId}`);
    } catch (error) {
      console.warn("Deployments table not found or error deleting:", error);
    }

    // Delete code generations
    try {
      const { codeGenerations } = await import("../drizzle/schema");
      await db.delete(codeGenerations).where(eq(codeGenerations.userId, userId));
      console.log(`[DataDeletion] Deleted code generations for user ${userId}`);
    } catch (error) {
      console.warn("Code generations table not found or error deleting:", error);
    }

    // Delete commits
    try {
      const { commits } = await import("../drizzle/schema");
      await db.delete(commits).where(eq(commits.userId, userId));
      console.log(`[DataDeletion] Deleted commits for user ${userId}`);
    } catch (error) {
      console.warn("Commits table not found or error deleting:", error);
    }

    // Delete projects
    try {
      const { projects } = await import("../drizzle/schema");
      await db.delete(projects).where(eq(projects.userId, userId));
      console.log(`[DataDeletion] Deleted projects for user ${userId}`);
    } catch (error) {
      console.warn("Projects table not found or error deleting:", error);
    }

    // Finally, delete the user
    await db.delete(users).where(eq(users.id, userId));
    console.log(`[DataDeletion] Deleted user account ${userId}`);

    return {
      success: true,
      message: "Account and all associated data have been permanently deleted",
    };
  } catch (error) {
    console.error(`[DataDeletion] Error deleting user ${userId}:`, error);
    throw new Error("Failed to delete account. Please contact support.");
  }
}
