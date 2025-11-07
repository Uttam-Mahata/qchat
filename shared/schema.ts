import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  publicKey: text("public_key"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").references(() => users.id),
  roomId: varchar("room_id"),
  encryptedContent: text("encrypted_content").notNull(),
  encapsulatedKey: text("encapsulated_key").notNull(),
  nonce: text("nonce").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  isGroup: boolean("is_group").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomMembers = pgTable("room_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  publicKey: text("public_key"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  uploaderId: varchar("uploader_id").notNull().references(() => users.id),
  roomId: varchar("room_id").references(() => rooms.id),
  encryptedContent: text("encrypted_content").notNull(),
  encapsulatedKey: text("encapsulated_key").notNull(),
  nonce: text("nonce").notNull(),
  mimeType: text("mime_type"),
  size: text("size"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
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
