import {
  type User,
  type InsertUser,
  type Message,
  type InsertMessage,
  type Room,
  type InsertRoom,
  type RoomMember,
  type Document,
  type InsertDocument,
  users,
  messages,
  rooms,
  roomMembers,
  documents,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, or, desc, inArray } from "drizzle-orm";

// Generate a unique 8-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUsers(ids: string[]): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPublicKey(id: string, publicKey: string): Promise<void>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  createMessages(messages: InsertMessage[]): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByRoom(roomId: string, limit?: number, userId?: string): Promise<Message[]>;
  getMessagesBetweenUsers(userId1: string, userId2: string, limit?: number): Promise<Message[]>;
  markMessageAsRead(messageId: string): Promise<void>;
  
  // Room methods
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(id: string): Promise<Room | undefined>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  getRoomsByUser(userId: string): Promise<Room[]>;
  addRoomMember(roomId: string, userId: string, publicKey?: string): Promise<RoomMember>;
  getRoomMembers(roomId: string): Promise<RoomMember[]>;
  
  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByRoom(roomId: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<string, Message>;
  private rooms: Map<string, Room>;
  private roomMembers: Map<string, RoomMember>;
  private documents: Map<string, Document>;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.rooms = new Map();
    this.roomMembers = new Map();
    this.documents = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(ids: string[]): Promise<User[]> {
    const users: User[] = [];
    for (const id of ids) {
      const user = this.users.get(id);
      if (user) {
        users.push(user);
      }
    }
    return users;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      publicKey: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPublicKey(id: string, publicKey: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.publicKey = publicKey;
      this.users.set(id, user);
    }
  }

  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      recipientId: insertMessage.recipientId || null,
      roomId: insertMessage.roomId || null,
      timestamp: new Date(),
      isRead: false,
    };
    this.messages.set(id, message);
    return message;
  }

  async createMessages(insertMessages: InsertMessage[]): Promise<Message[]> {
    const messages: Message[] = [];
    const baseTimestamp = new Date();
    
    for (let i = 0; i < insertMessages.length; i++) {
      const insertMessage = insertMessages[i];
      const id = randomUUID();
      // Use the same base timestamp with microsecond offsets to maintain order
      const timestamp = new Date(baseTimestamp.getTime() + i);
      
      const message: Message = {
        ...insertMessage,
        id,
        recipientId: insertMessage.recipientId || null,
        roomId: insertMessage.roomId || null,
        timestamp,
        isRead: false,
      };
      this.messages.set(id, message);
      messages.push(message);
    }
    return messages;
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByRoom(roomId: string, limit: number = 100, userId?: string): Promise<Message[]> {
    const allMessages = Array.from(this.messages.values())
      .filter(msg => msg.roomId === roomId)
      .sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      });

    // If userId is provided, filter to only include messages encrypted for that user
    if (userId) {
      const userMessages = allMessages.filter(msg => 
        // Include messages sent by the user (their own encrypted version)
        (msg.senderId === userId && (msg.recipientId === null || msg.recipientId === userId)) ||
        // Include messages sent to the user (encrypted for them)
        (msg.senderId !== userId && msg.recipientId === userId)
      );
      
      // Deduplicate by timestamp and sender to avoid showing multiple versions of the same message
      const seen = new Set<string>();
      const deduplicated = userMessages.filter(msg => {
        const key = `${msg.senderId}-${msg.timestamp?.getTime()}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      
      return deduplicated.slice(0, limit);
    }

    return allMessages.slice(0, limit);
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string, limit: number = 100): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === userId1 && msg.recipientId === userId2) ||
        (msg.senderId === userId2 && msg.recipientId === userId1)
      )
      .sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, limit);
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.isRead = true;
      this.messages.set(messageId, message);
    }
  }

  // Room methods
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    let code = generateRoomCode();
    
    // Ensure code is unique (with retry limit to prevent infinite loops)
    let retries = 0;
    const maxRetries = 10;
    while (Array.from(this.rooms.values()).some(room => room.code === code) && retries < maxRetries) {
      code = generateRoomCode();
      retries++;
    }
    
    if (retries >= maxRetries) {
      throw new Error('Failed to generate unique room code after maximum retries');
    }
    
    const room: Room = {
      ...insertRoom,
      id,
      code,
      isGroup: insertRoom.isGroup || false,
      createdAt: new Date(),
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(
      (room) => room.code === code,
    );
  }

  async getRoomsByUser(userId: string): Promise<Room[]> {
    const userRoomIds = Array.from(this.roomMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.roomId);
    
    return Array.from(this.rooms.values())
      .filter(room => userRoomIds.includes(room.id));
  }

  async addRoomMember(roomId: string, userId: string, publicKey?: string): Promise<RoomMember> {
    const id = randomUUID();
    const member: RoomMember = {
      id,
      roomId,
      userId,
      publicKey: publicKey || null,
      joinedAt: new Date(),
    };
    this.roomMembers.set(id, member);
    return member;
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    return Array.from(this.roomMembers.values())
      .filter(member => member.roomId === roomId);
  }

  // Document methods
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      roomId: insertDocument.roomId || null,
      mimeType: insertDocument.mimeType || null,
      size: insertDocument.size || null,
      uploadedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByRoom(roomId: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.roomId === roomId)
      .sort((a, b) => (b.uploadedAt?.getTime() || 0) - (a.uploadedAt?.getTime() || 0));
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
  }
}

// Database-backed storage using Drizzle ORM
export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUsers(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const result = await db.select().from(users).where(inArray(users.id, ids));
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      publicKey: null,
      createdAt: new Date(),
    };
    await db.insert(users).values(user);
    return user;
  }

  async updateUserPublicKey(id: string, publicKey: string): Promise<void> {
    await db.update(users).set({ publicKey }).where(eq(users.id, id));
  }

  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      recipientId: insertMessage.recipientId || null,
      roomId: insertMessage.roomId || null,
      timestamp: new Date(),
      isRead: false,
    };
    await db.insert(messages).values(message);
    return message;
  }

  async createMessages(insertMessages: InsertMessage[]): Promise<Message[]> {
    const messagesToInsert: Message[] = [];
    const baseTimestamp = new Date();

    for (let i = 0; i < insertMessages.length; i++) {
      const insertMessage = insertMessages[i];
      const id = randomUUID();
      const timestamp = new Date(baseTimestamp.getTime() + i);

      const message: Message = {
        ...insertMessage,
        id,
        recipientId: insertMessage.recipientId || null,
        roomId: insertMessage.roomId || null,
        timestamp,
        isRead: false,
      };
      messagesToInsert.push(message);
    }

    await db.insert(messages).values(messagesToInsert);
    return messagesToInsert;
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return result[0];
  }

  async getMessagesByRoom(roomId: string, limit: number = 100, userId?: string): Promise<Message[]> {
    let query = db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.timestamp));

    const allMessages = await query;

    // If userId is provided, filter to only include messages encrypted for that user
    if (userId) {
      const userMessages = allMessages.filter(msg =>
        // Include messages sent by the user (their own encrypted version)
        (msg.senderId === userId && (msg.recipientId === null || msg.recipientId === userId)) ||
        // Include messages sent to the user (encrypted for them)
        (msg.senderId !== userId && msg.recipientId === userId)
      );

      // Deduplicate by timestamp and sender to avoid showing multiple versions of the same message
      const seen = new Set<string>();
      const deduplicated = userMessages.filter(msg => {
        const key = `${msg.senderId}-${msg.timestamp?.getTime()}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

      return deduplicated.slice(0, limit);
    }

    return allMessages.slice(0, limit);
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string, limit: number = 100): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
        )
      )
      .orderBy(desc(messages.timestamp))
      .limit(limit);

    return result;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, messageId));
  }

  // Room methods
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    let code = generateRoomCode();

    // Ensure code is unique (with retry limit to prevent infinite loops)
    let retries = 0;
    const maxRetries = 10;
    while (retries < maxRetries) {
      const existing = await this.getRoomByCode(code);
      if (!existing) break;
      code = generateRoomCode();
      retries++;
    }

    if (retries >= maxRetries) {
      throw new Error('Failed to generate unique room code after maximum retries');
    }

    const room: Room = {
      ...insertRoom,
      id,
      code,
      isGroup: insertRoom.isGroup || false,
      createdAt: new Date(),
    };
    await db.insert(rooms).values(room);
    return room;
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return result[0];
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const result = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    return result[0];
  }

  async getRoomsByUser(userId: string): Promise<Room[]> {
    const userRoomMembers = await db
      .select()
      .from(roomMembers)
      .where(eq(roomMembers.userId, userId));

    if (userRoomMembers.length === 0) return [];

    const roomIds = userRoomMembers.map(member => member.roomId);
    const result = await db.select().from(rooms).where(inArray(rooms.id, roomIds));
    return result;
  }

  async addRoomMember(roomId: string, userId: string, publicKey?: string): Promise<RoomMember> {
    const id = randomUUID();
    const member: RoomMember = {
      id,
      roomId,
      userId,
      publicKey: publicKey || null,
      joinedAt: new Date(),
    };
    await db.insert(roomMembers).values(member);
    return member;
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    const result = await db.select().from(roomMembers).where(eq(roomMembers.roomId, roomId));
    return result;
  }

  // Document methods
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      roomId: insertDocument.roomId || null,
      mimeType: insertDocument.mimeType || null,
      size: insertDocument.size || null,
      uploadedAt: new Date(),
    };
    await db.insert(documents).values(document);
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return result[0];
  }

  async getDocumentsByRoom(roomId: string): Promise<Document[]> {
    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.roomId, roomId))
      .orderBy(desc(documents.uploadedAt));
    return result;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }
}

export const storage = new DbStorage();
