/**
 * WebSocket Client for Real-time Messaging
 * 
 * Handles real-time communication with the server
 */

export interface WSMessage {
  type: 'message' | 'typing' | 'read' | 'key-exchange' | 'document' | 'call-signal' | 
        'authenticated' | 'message-sent' | 'user-status' | 'error' | 'document-uploaded';
  data?: any;
  error?: string;
}

export type MessageHandler = (message: WSMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private userId?: string;
  private username?: string;

  constructor() {
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Re-authenticate if we have user info
      if (this.userId && this.username) {
        this.authenticate(this.userId, this.username);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.notifyHandlers(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms...`);
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private notifyHandlers(message: WSMessage) {
    this.handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  public authenticate(userId: string, username: string) {
    this.userId = userId;
    this.username = username;
    // Authentication happens via the connection - server validates session
  }

  public onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.handlers.delete(handler);
    };
  }

  public sendMessage(recipientId: string | null, roomId: string | null, content: string, encryptedData: any) {
    this.send({
      type: 'message',
      data: {
        recipientId,
        roomId,
        encryptedContent: encryptedData.encryptedContent || content,
        encapsulatedKey: encryptedData.encapsulatedKey || '',
        nonce: encryptedData.nonce || '',
      }
    });
  }

  public sendTypingIndicator(recipientId: string | null, roomId: string | null, isTyping: boolean) {
    this.send({
      type: 'typing',
      data: {
        recipientId,
        roomId,
        isTyping,
      }
    });
  }

  public sendReadReceipt(messageId: string) {
    this.send({
      type: 'read',
      data: { messageId }
    });
  }

  public sendKeyExchange(recipientId: string, publicKey: string) {
    this.send({
      type: 'key-exchange',
      data: {
        recipientId,
        publicKey,
      }
    });
  }

  public uploadDocument(roomId: string, document: any) {
    this.send({
      type: 'document',
      data: {
        roomId,
        ...document,
      }
    });
  }

  public sendCallSignal(recipientId: string, signal: any, callType: 'voice' | 'video') {
    this.send({
      type: 'call-signal',
      data: {
        recipientId,
        signal,
        callType,
      }
    });
  }

  private send(message: WSMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
}

export function disconnectWebSocket() {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}
