import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { ChatView } from "@/components/ChatView";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  {
    id: '4',
    name: 'Engineering Team',
    lastMessage: 'The new security features are ready for testing',
    timestamp: '3 days ago',
    unreadCount: 1,
    status: 'online' as const,
  },
];

const mockMessages: Record<string, any[]> = {
  '1': [
    {
      id: '1',
      content: 'Hey! Just wanted to let you know the quantum encryption is working perfectly.',
      timestamp: '10:32 AM',
      isSent: false,
      senderName: 'Alice',
    },
    {
      id: '2',
      content: "That's great! The ML-KEM handshake completed successfully.",
      timestamp: '10:33 AM',
      isSent: true,
    },
    {
      id: '3',
      content: 'Perfect. All our messages are now quantum-resistant 🔒',
      timestamp: '10:34 AM',
      isSent: false,
      senderName: 'Alice',
    },
  ],
  '2': [
    {
      id: '1',
      content: 'The implementation looks solid. Great work on the cryptography layer!',
      timestamp: 'Yesterday, 2:15 PM',
      isSent: false,
      senderName: 'Bob',
    },
    {
      id: '2',
      content: 'Thanks! The Double Ratchet integration was the trickiest part.',
      timestamp: 'Yesterday, 2:17 PM',
      isSent: true,
    },
  ],
  '3': [
    {
      id: '1',
      content: 'Are we still meeting tomorrow?',
      timestamp: '2 days ago, 5:30 PM',
      isSent: false,
      senderName: 'Charlie',
    },
    {
      id: '2',
      content: 'Yes, 10 AM works for me!',
      timestamp: '2 days ago, 5:32 PM',
      isSent: true,
    },
    {
      id: '3',
      content: 'Perfect, see you then!',
      timestamp: '2 days ago, 5:33 PM',
      isSent: false,
      senderName: 'Charlie',
    },
  ],
  '4': [
    {
      id: '1',
      content: 'The security audit results are in - all tests passed!',
      timestamp: '3 days ago, 11:20 AM',
      isSent: false,
      senderName: 'Engineering Team',
    },
  ],
};

export default function Home() {
  const [activeChat, setActiveChat] = useState('1');

  const activeChatData = mockChats.find(chat => chat.id === activeChat);

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 overflow-hidden">
          <ChatPanel
            chats={mockChats}
            activeChat={activeChat}
            onChatSelect={setActiveChat}
          />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-2 border-b border-border bg-background">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-hidden">
              {activeChatData && (
                <ChatView
                  chatName={activeChatData.name}
                  status={activeChatData.status}
                  initialMessages={mockMessages[activeChat] || []}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
