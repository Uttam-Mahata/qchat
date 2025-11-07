import { 
  type User, 
  type InsertUser, 
  type Message, 
  type InsertMessage, 
  type Room, 
  type InsertRoom,
  type RoomMember,
  type Document,
  type InsertDocument
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
