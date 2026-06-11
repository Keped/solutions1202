import { pgTable, text, timestamp, jsonb, vector } from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Solutions table
export const solutions = pgTable("solutions", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  serviceName: text("service_name").notNull(),
  description: text("description"),
  targetAudience: text("target_audience"),
  costInfo: text("cost_info"),
  location: text("location"),
  contactInfo: text("contact_info"),
  contentText: text("content_text").notNull(),
  embedding: vector("embedding", { dimensions: 768 }),
  sourceSheet: text("source_sheet").notNull(),
  datasetVersion: text("dataset_version").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// FAQ entries table
export const faqEntries = pgTable("faq_entries", {
  id: text("id").primaryKey(),
  topic: text("topic"),
  question: text("question").notNull(),
  suggestedAnswer: text("suggested_answer").notNull(),
  embedding: vector("embedding", { dimensions: 768 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat sessions table
export const chatSessions = pgTable("chat_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  sources: jsonb("sources"), // JSON array of sources
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
