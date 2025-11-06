import { ChatPanel } from '../ChatPanel';
import { useState } from 'react';

const mockChats = [
  {
    id: '1',
    name: 'Alice Chen',
    lastMessage: 'The quantum encryption is working perfectly!',
    timestamp: '10:34 AM',
    unreadCount: 3,
    status: 'online' as const,
  },
  {
    id: '2',
    name: 'Bob Smith',
    lastMessage: 'Thanks for the update on the ML-KEM implementation',
    timestamp: 'Yesterday',
    status: 'away' as const,
  },
  {
    id: '3',
    name: 'Charlie Davis',
    lastMessage: 'See you tomorrow!',
    timestamp: '2 days ago',
    status: 'offline' as const,
  },
];

export default function ChatPanelExample() {
  const [activeChat, setActiveChat] = useState('1');

  return (
    <div className="h-[600px] border rounded-lg overflow-hidden">
      <ChatPanel 
        chats={mockChats} 
        activeChat={activeChat}
        onChatSelect={setActiveChat}
      />
    </div>
  );
}
