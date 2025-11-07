/**
 * API Client for REST endpoints
 */

export interface User {
  id: string;
  username: string;
  publicKey: string | null;
  fingerprint: string | null;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  isGroup: boolean;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string | null;
  roomId: string | null;
  encryptedContent: string;
  encapsulatedKey: string;
  nonce: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Document {
  id: string;
  name: string;
  uploaderId: string;
  roomId: string | null;
  encryptedContent: string;
  encapsulatedKey: string;
  nonce: string;
  mimeType: string | null;
  size: string | null;
  uploadedAt: Date;
}

class APIClient {
  private baseUrl = '/api';

  // Auth endpoints
  async register(username: string, password: string): Promise<{
    user: User;
    secretKey: string;
  }> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  }

  async login(username: string, password: string): Promise<{ user: User }> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  }

  // User endpoints
  async getUser(userId: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  }

  // Room endpoints
  async createRoom(name: string, isGroup: boolean, members?: Array<{ userId: string; publicKey?: string }>): Promise<Room> {
    const response = await fetch(`${this.baseUrl}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, isGroup, members }),
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    return response.json();
  }

  async getRoomByCode(code: string): Promise<Room> {
    const response = await fetch(`${this.baseUrl}/rooms/code/${code}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch room');
    }

    return response.json();
  }

  async joinRoomWithCode(code: string, userId: string, publicKey?: string): Promise<{ room: Room; member: any }> {
    const response = await fetch(`${this.baseUrl}/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId, publicKey }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join room');
    }

    return response.json();
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/rooms`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }

    return response.json();
  }

  // Message endpoints
  async getRoomMessages(roomId: string, limit: number = 100): Promise<Message[]> {
    const response = await fetch(`${this.baseUrl}/rooms/${roomId}/messages?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  }

  async getDirectMessages(userId1: string, userId2: string, limit: number = 100): Promise<Message[]> {
    const response = await fetch(`${this.baseUrl}/users/${userId1}/messages/${userId2}?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  }

  async sendMessage(
    senderId: string,
    content: string,
    recipientId?: string,
    roomId?: string,
    recipientPublicKey?: string
  ): Promise<Message> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId,
        content,
        recipientId,
        roomId,
        recipientPublicKey,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
  }

  async decryptMessage(messageId: string, secretKey: string): Promise<{
    id: string;
    content: string;
    timestamp: Date;
    senderId: string;
  }> {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretKey }),
    });

    if (!response.ok) {
      throw new Error('Failed to decrypt message');
    }

    return response.json();
  }

  // Document endpoints
  async uploadDocument(
    name: string,
    uploaderId: string,
    roomId: string | null,
    content: string,
    recipientPublicKey: string,
    mimeType?: string,
    size?: string
  ): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        uploaderId,
        roomId,
        content,
        recipientPublicKey,
        mimeType,
        size,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload document');
    }

    return response.json();
  }

  async getDocument(documentId: string): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/documents/${documentId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }

    return response.json();
  }

  async getRoomDocuments(roomId: string): Promise<Document[]> {
    const response = await fetch(`${this.baseUrl}/rooms/${roomId}/documents`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  }

  async decryptDocument(documentId: string, secretKey: string): Promise<{
    name: string;
    mimeType: string | null;
    content: string;
  }> {
    const response = await fetch(`${this.baseUrl}/documents/${documentId}/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretKey }),
    });

    if (!response.ok) {
      throw new Error('Failed to decrypt document');
    }

    return response.json();
  }

  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  }
}

export const apiClient = new APIClient();
