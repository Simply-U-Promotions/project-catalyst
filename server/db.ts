import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

import { conversations, deployments, generatedFiles, InsertConversation, InsertDeployment, InsertGeneratedFile, InsertProject, InsertTemplate, projects, templates } from "../drizzle/schema";
import { desc } from "drizzle-orm";

// Project queries
export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(project);
  return result[0].insertId;
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result[0];
}

export async function updateProject(projectId: number, updates: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(updates).where(eq(projects.id, projectId));
}

// Conversation queries
export async function addConversationMessage(message: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(conversations).values(message);
}

export async function getProjectConversations(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(conversations).where(eq(conversations.projectId, projectId)).orderBy(conversations.createdAt);
}

// Generated files queries
export async function saveGeneratedFile(file: InsertGeneratedFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(generatedFiles).values(file);
}

export async function getProjectFiles(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(generatedFiles).where(eq(generatedFiles.projectId, projectId));
}

// Deployment queries
export async function createDeployment(deployment: InsertDeployment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deployments).values(deployment);
  return result[0].insertId;
}

export async function getProjectDeployments(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deployments).where(eq(deployments.projectId, projectId)).orderBy(desc(deployments.createdAt));
}

export async function getDeploymentById(deploymentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deployments).where(eq(deployments.id, deploymentId)).limit(1);
  return result[0];
}

export async function updateDeployment(deploymentId: number, updates: Partial<InsertDeployment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deployments).set(updates).where(eq(deployments.id, deploymentId));
}

// Template queries
export async function getActiveTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(templates).where(eq(templates.isActive, 1));
}

export async function createTemplate(template: InsertTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(templates).values(template);
  return result[0].insertId;
}
