import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
}

interface ChatViewProps {
  chatName: string;
  status?: "online" | "away" | "busy" | "offline";
  initialMessages?: Message[];
}

export function ChatView({ chatName, status, initialMessages = [] }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSent: true,
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader name={chatName} status={status} />
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              content={message.content}
              timestamp={message.timestamp}
              isSent={message.isSent}
              senderName={message.senderName}
            />
          ))}
        </div>
      </ScrollArea>
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
}
