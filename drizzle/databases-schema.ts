import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Provisioned databases for projects
 */
export const provisionedDatabases = mysqlTable("provisioned_databases", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  type: mysqlEnum("type", ["postgresql", "mysql", "mongodb", "redis"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  host: varchar("host", { length: 255 }).notNull(),
  port: int("port").notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(), // In production, encrypt this
  database: varchar("database", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["provisioning", "active", "failed", "deleted"]).default("provisioning").notNull(),
  connectionString: text("connection_string"),
  size: varchar("size", { length: 50 }).default("small"), // small, medium, large
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProvisionedDatabase = typeof provisionedDatabases.$inferSelect;
export type InsertProvisionedDatabase = typeof provisionedDatabases.$inferInsert;
