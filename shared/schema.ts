import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { pgTable, text as pgText, timestamp, serial, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Dual schema support: PostgreSQL for production, SQLite for development
const isPostgreSQL = !!process.env.DATABASE_URL;

// Users table
export const users = isPostgreSQL
  ? pgTable("users", {
      id: serial("id").primaryKey(),
      username: varchar("username", { length: 255 }).notNull().unique(),
      password: varchar("password", { length: 255 }).notNull(),
      publicKey: pgText("public_key"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
    })
  : sqliteTable("users", {
      id: text("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      publicKey: text("public_key"),
      createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
    });

// Messages table
export const messages = isPostgreSQL
  ? pgTable("messages", {
      id: serial("id").primaryKey(),
      senderId: varchar("sender_id", { length: 255 }).notNull().references(() => users.id as any),
      recipientId: varchar("recipient_id", { length: 255 }).references(() => users.id as any),
      roomId: varchar("room_id", { length: 255 }),
      encryptedContent: pgText("encrypted_content").notNull(),
      encapsulatedKey: pgText("encapsulated_key").notNull(),
      nonce: varchar("nonce", { length: 255 }).notNull(),
      attachmentId: varchar("attachment_id", { length: 255 }).references(() => documents.id as any),
      timestamp: timestamp("timestamp").defaultNow().notNull(),
      isRead: boolean("is_read").default(false),
    })
  : sqliteTable("messages", {
      id: text("id").primaryKey(),
      senderId: text("sender_id").notNull().references(() => users.id),
      recipientId: text("recipient_id").references(() => users.id),
      roomId: text("room_id"),
      encryptedContent: text("encrypted_content").notNull(),
      encapsulatedKey: text("encapsulated_key").notNull(),
      nonce: text("nonce").notNull(),
      attachmentId: text("attachment_id").references(() => documents.id),
      timestamp: integer("timestamp", { mode: 'timestamp' }).$defaultFn(() => new Date()),
      isRead: integer("is_read", { mode: 'boolean' }).default(false),
    });

// Rooms table
export const rooms = isPostgreSQL
  ? pgTable("rooms", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      code: varchar("code", { length: 8 }).notNull().unique(),
      isGroup: boolean("is_group").default(false),
      ownerId: varchar("owner_id", { length: 255 }).references(() => users.id as any),
      createdAt: timestamp("created_at").defaultNow().notNull(),
    })
  : sqliteTable("rooms", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
      code: text("code").notNull().unique(),
      isGroup: integer("is_group", { mode: 'boolean' }).default(false),
      ownerId: text("owner_id").references(() => users.id),
      createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
    });

// Room members table
export const roomMembers = isPostgreSQL
  ? pgTable("room_members", {
      id: serial("id").primaryKey(),
      roomId: varchar("room_id", { length: 255 }).notNull().references(() => rooms.id as any),
      userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id as any),
      publicKey: pgText("public_key"),
      joinedAt: timestamp("joined_at").defaultNow().notNull(),
    })
  : sqliteTable("room_members", {
      id: text("id").primaryKey(),
      roomId: text("room_id").notNull().references(() => rooms.id),
      userId: text("user_id").notNull().references(() => users.id),
      publicKey: text("public_key"),
      joinedAt: integer("joined_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
    });

// Documents table
export const documents = isPostgreSQL
  ? pgTable("documents", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      uploaderId: varchar("uploader_id", { length: 255 }).notNull().references(() => users.id as any),
      roomId: varchar("room_id", { length: 255 }).references(() => rooms.id as any),
      encryptedContent: pgText("encrypted_content").notNull(),
      encapsulatedKey: pgText("encapsulated_key").notNull(),
      nonce: varchar("nonce", { length: 255 }).notNull(),
      mimeType: varchar("mime_type", { length: 100 }),
      size: varchar("size", { length: 50 }),
      uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    })
  : sqliteTable("documents", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
      uploaderId: text("uploader_id").notNull().references(() => users.id),
      roomId: text("room_id").references(() => rooms.id),
      encryptedContent: text("encrypted_content").notNull(),
      encapsulatedKey: text("encapsulated_key").notNull(),
      nonce: text("nonce").notNull(),
      mimeType: text("mime_type"),
      size: text("size"),
      uploadedAt: integer("uploaded_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
    });

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  recipientId: true,
  roomId: true,
  encryptedContent: true,
  encapsulatedKey: true,
  nonce: true,
  attachmentId: true,
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  name: true,
  isGroup: true,
  ownerId: true,
  // Note: 'code' field is intentionally excluded as it is auto-generated server-side
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  name: true,
  uploaderId: true,
  roomId: true,
  encryptedContent: true,
  encapsulatedKey: true,
  nonce: true,
  mimeType: true,
  size: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type RoomMember = typeof roomMembers.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
