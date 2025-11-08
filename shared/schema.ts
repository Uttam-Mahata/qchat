import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// SQLite schema - using text for IDs and integer for timestamps
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  publicKey: text("public_key"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").notNull().references(() => users.id),
  recipientId: text("recipient_id").references(() => users.id),
  roomId: text("room_id"),
  encryptedContent: text("encrypted_content").notNull(),
  encapsulatedKey: text("encapsulated_key").notNull(),
  nonce: text("nonce").notNull(),
  timestamp: integer("timestamp", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  isRead: integer("is_read", { mode: 'boolean' }).default(false),
});

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  isGroup: integer("is_group", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const roomMembers = sqliteTable("room_members", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id),
  userId: text("user_id").notNull().references(() => users.id),
  publicKey: text("public_key"),
  joinedAt: integer("joined_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const documents = sqliteTable("documents", {
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
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  name: true,
  isGroup: true,
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
