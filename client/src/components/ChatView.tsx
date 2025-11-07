import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import { getWebSocketClient, type WSMessage } from "@/lib/websocket";
import { getStoredKeyPair } from "@/lib/crypto";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
}

interface ChatViewProps {
  chatName: string;
  chatId?: string;
  recipientId?: string;
  roomId?: string;
  status?: "online" | "away" | "busy" | "offline";
  initialMessages?: Message[];
}

export function ChatView({ 
  chatName, 
  chatId,
  recipientId,
  roomId,
  status, 
  initialMessages = [] 
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const wsClient = useRef(getWebSocketClient());
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Load historical messages when room/chat changes
  useEffect(() => {
    const loadMessages = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      setIsLoadingMessages(true);
      try {
        const { apiClient } = await import('@/lib/api');
        const keypair = getStoredKeyPair();
        
        let encryptedMessages: any[] = [];
        
        if (roomId) {
          // Load room messages
          encryptedMessages = await apiClient.getRoomMessages(roomId, 50);
        } else if (recipientId) {
          // Load direct messages
          encryptedMessages = await apiClient.getDirectMessages(userId, recipientId, 50);
        }
        
        // Decrypt messages
        const decryptedMessages: Message[] = [];
        for (const msg of encryptedMessages) {
          let content = '[Encrypted]';
          try {
            if (keypair?.secretKey) {
              const decrypted = await apiClient.decryptMessage(msg.id, keypair.secretKey);
              content = decrypted.content;
            }
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            content = '[Failed to decrypt]';
          }
          
          decryptedMessages.push({
            id: msg.id,
            content,
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isSent: msg.senderId === userId,
          });
        }
        
        // Reverse to show oldest first
        setMessages(decryptedMessages.reverse());
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [roomId, recipientId]);

  useEffect(() => {
    const client = wsClient.current;

    // Handle incoming messages
    const unsubscribe = client.onMessage(async (message: WSMessage) => {
      if (message.type === 'message') {
        const { data } = message;
        // Only add message if it's for this chat
        if (
          (recipientId && data.senderId === recipientId) ||
          (roomId && data.roomId === roomId)
        ) {
          // Decrypt the message content
          let decryptedContent = '[Encrypted Message]';
          try {
            const keypair = getStoredKeyPair();
            if (keypair?.secretKey) {
              const { apiClient } = await import('@/lib/api');
              const decrypted = await apiClient.decryptMessage(data.id, keypair.secretKey);
              decryptedContent = decrypted.content;
            }
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            decryptedContent = '[Failed to decrypt]';
          }

          const newMessage: Message = {
            id: data.id,
            content: decryptedContent,
            timestamp: new Date(data.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isSent: false,
            senderName: data.senderUsername,
          };
          setMessages(prev => [...prev, newMessage]);
        }
      } else if (message.type === 'typing') {
        const { data } = message;
        if (
          (recipientId && data.userId === recipientId) ||
          (roomId && data.roomId === roomId)
        ) {
          setIsTyping(data.isTyping);
          
          // Clear typing indicator after 3 seconds
          if (data.isTyping) {
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }
        }
      } else if (message.type === 'message-sent') {
        // Message was successfully sent, update local state if needed
        console.log('Message sent:', message.data);
      }
    });

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [recipientId, roomId]);

  const handleSendMessage = async (content: string) => {
    const client = wsClient.current;
    const userId = localStorage.getItem('userId');

    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    // Add message to local state immediately (optimistic update)
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSent: true,
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Use REST API to send and encrypt the message
      // The server will handle encryption and broadcast via WebSocket
      const { apiClient } = await import('@/lib/api');
      await apiClient.sendMessage(
        userId,
        content,
        recipientId || undefined,
        roomId || undefined
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  const handleTyping = (isTyping: boolean) => {
    const client = wsClient.current;
    if (client.isConnected()) {
      client.sendTypingIndicator(recipientId || null, roomId || null, isTyping);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        name={chatName} 
        chatId={chatId}
        recipientId={recipientId}
        status={status} 
      />
      <ScrollArea className="flex-1 p-2 sm:p-4">
        <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              content={message.content}
              timestamp={message.timestamp}
              isSent={message.isSent}
              senderName={message.senderName}
            />
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
              <span>{chatName} is typing...</span>
            </div>
          )}
        </div>
      </ScrollArea>
      <MessageInput onSend={handleSendMessage} onTyping={handleTyping} roomId={roomId || undefined} />
    </div>
  );
}
