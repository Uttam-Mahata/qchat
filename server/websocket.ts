/**
 * WebSocket Server for Real-time Messaging
 * 
 * Handles real-time communication between clients with quantum-resistant encryption
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { storage } from './storage';
import type { Message } from '@shared/schema';

export interface WSMessage {
  type: 'message' | 'typing' | 'read' | 'key-exchange' | 'document' | 'call-signal' | 'authenticate';
  data: any;
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  username?: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: AuthenticatedWebSocket) {
    console.log('New WebSocket connection');

    ws.on('message', async (data: string) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          error: 'Invalid message format' 
        }));
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        this.clients.delete(ws.userId);
        console.log(`Client disconnected: ${ws.username}`);
        this.broadcastUserStatus(ws.userId, 'offline');
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WSMessage) {
    switch (message.type) {
      case 'authenticate':
        this.handleAuthenticate(ws, message.data);
        break;
      
      case 'message':
        await this.handleChatMessage(ws, message.data);
        break;
      
      case 'typing':
        this.handleTypingIndicator(ws, message.data);
        break;
      
      case 'read':
        await this.handleReadReceipt(ws, message.data);
        break;
      
      case 'key-exchange':
        this.handleKeyExchange(ws, message.data);
        break;
      
      case 'document':
        await this.handleDocument(ws, message.data);
        break;
      
      case 'call-signal':
        this.handleCallSignal(ws, message.data);
        break;
      
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          error: 'Unknown message type' 
        }));
    }
  }

  private handleAuthenticate(ws: AuthenticatedWebSocket, data: any) {
    const { userId, username } = data;
    
    if (!userId || !username) {
      ws.send(JSON.stringify({ type: 'error', error: 'userId and username required for authentication' }));
      return;
    }
    
    // Register the client
    this.registerClient(userId, username, ws);
    console.log(`WebSocket authenticated: ${username} (${userId})`);
  }

  private async handleChatMessage(ws: AuthenticatedWebSocket, data: any) {
    if (!ws.userId) {
      ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated' }));
      return;
    }

    try {
      // Store encrypted message
      const message = await storage.createMessage({
        senderId: ws.userId,
        recipientId: data.recipientId || null,
        roomId: data.roomId || null,
        encryptedContent: data.encryptedContent,
        encapsulatedKey: data.encapsulatedKey,
        nonce: data.nonce,
      });

      // Broadcast to recipient(s)
      if (data.recipientId) {
        this.sendToUser(data.recipientId, {
          type: 'message',
          data: {
            ...message,
            senderUsername: ws.username,
          }
        });
      } else if (data.roomId) {
        const members = await storage.getRoomMembers(data.roomId);
        members.forEach(member => {
          if (member.userId !== ws.userId) {
            this.sendToUser(member.userId, {
              type: 'message',
              data: {
                ...message,
                senderUsername: ws.username,
              }
            });
          }
        });
      }

      // Confirm to sender
      ws.send(JSON.stringify({
        type: 'message-sent',
        data: message,
      }));
    } catch (error) {
      console.error('Error handling chat message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        error: 'Failed to send message' 
      }));
    }
  }

  private handleTypingIndicator(ws: AuthenticatedWebSocket, data: any) {
    if (!ws.userId) return;

    const targetId = data.recipientId || data.roomId;
    if (!targetId) return;

    if (data.recipientId) {
      this.sendToUser(data.recipientId, {
        type: 'typing',
        data: {
          userId: ws.userId,
          username: ws.username,
          isTyping: data.isTyping,
        }
      });
    } else if (data.roomId) {
      // Broadcast to room members
      storage.getRoomMembers(data.roomId).then(members => {
        members.forEach(member => {
          if (member.userId !== ws.userId) {
            this.sendToUser(member.userId, {
              type: 'typing',
              data: {
                userId: ws.userId,
                username: ws.username,
                isTyping: data.isTyping,
                roomId: data.roomId,
              }
            });
          }
        });
      });
    }
  }

  private async handleReadReceipt(ws: AuthenticatedWebSocket, data: any) {
    if (!ws.userId) return;

    try {
      await storage.markMessageAsRead(data.messageId);
      
      // Notify sender
      const message = await this.getMessageSender(data.messageId);
      if (message?.senderId) {
        this.sendToUser(message.senderId, {
          type: 'read',
          data: {
            messageId: data.messageId,
            readBy: ws.userId,
          }
        });
      }
    } catch (error) {
      console.error('Error handling read receipt:', error);
    }
  }

  private handleKeyExchange(ws: AuthenticatedWebSocket, data: any) {
    if (!ws.userId) return;

    // Forward key exchange to recipient
    if (data.recipientId) {
      this.sendToUser(data.recipientId, {
        type: 'key-exchange',
        data: {
          from: ws.userId,
          username: ws.username,
          publicKey: data.publicKey,
        }
      });
    }
  }

  private async handleDocument(ws: AuthenticatedWebSocket, data: any) {
    if (!ws.userId) return;

    try {
      const document = await storage.createDocument({
        name: data.name,
        uploaderId: ws.userId,
        roomId: data.roomId || null,
        encryptedContent: data.encryptedContent,
        encapsulatedKey: data.encapsulatedKey,
        nonce: data.nonce,
        mimeType: data.mimeType || null,
        size: data.size || null,
      });

      // Notify room members
      if (data.roomId) {
        const members = await storage.getRoomMembers(data.roomId);
        members.forEach(member => {
          if (member.userId !== ws.userId) {
            this.sendToUser(member.userId, {
              type: 'document',
              data: {
                ...document,
                uploaderUsername: ws.username,
              }
            });
          }
        });
      }

      ws.send(JSON.stringify({
        type: 'document-uploaded',
        data: document,
      }));
    } catch (error) {
      console.error('Error handling document:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        error: 'Failed to upload document' 
      }));
    }
  }

  private handleCallSignal(ws: AuthenticatedWebSocket, data: any) {
    if (!ws.userId || !data.recipientId) return;

    // Forward call signaling to recipient
    this.sendToUser(data.recipientId, {
      type: 'call-signal',
      data: {
        from: ws.userId,
        username: ws.username,
        signal: data.signal,
        callType: data.callType, // 'voice' or 'video'
      }
    });
  }

  private sendToUser(userId: string, message: WSMessage) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  private broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    const message = {
      type: 'user-status',
      data: { userId, status }
    };

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private async getMessageSender(messageId: string): Promise<Message | null> {
    // Query storage to find the message
    try {
      // Since we're using in-memory storage, we need to access it
      // In production, this would be a database query
      const messages = (storage as any).messages as Map<string, Message>;
      if (!messages) return null;
      
      const allMessages = Array.from(messages.values());
      const message = allMessages.find(msg => msg.id === messageId);
      return message || null;
    } catch (error) {
      console.error('Error getting message:', error);
      return null;
    }
  }

  /**
   * Register an authenticated user connection
   */
  public registerClient(userId: string, username: string, ws: AuthenticatedWebSocket) {
    ws.userId = userId;
    ws.username = username;
    this.clients.set(userId, ws);
    
    console.log(`Client registered: ${username} (${userId})`);
    this.broadcastUserStatus(userId, 'online');
    
    ws.send(JSON.stringify({
      type: 'authenticated',
      data: { userId, username }
    }));
  }
}
