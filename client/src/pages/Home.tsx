import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { ChatView } from "@/components/ChatView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getWebSocketClient } from "@/lib/websocket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function Home() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);

  const fetchUserRooms = () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetch(`/api/users/${userId}/rooms`)
        .then(res => res.json())
        .then(rooms => {
          // Transform rooms into chat format
          const chatList = rooms.map((room: any) => ({
            id: room.id,
            name: room.name,
            lastMessage: '',
            timestamp: new Date(room.createdAt).toLocaleDateString(),
            status: 'offline' as const,
          }));
          setChats(chatList);
          
          // Set first chat as active if available and no active chat
          if (chatList.length > 0 && !activeChat) {
            setActiveChat(chatList[0].id);
          }
        })
        .catch(error => {
          console.error('Failed to fetch rooms:', error);
        });
    }
  };

  useEffect(() => {
    // Authenticate WebSocket connection
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    if (userId && username) {
      const wsClient = getWebSocketClient();
      wsClient.authenticate(userId, username);

      // Fetch user's rooms/chats from the API
      fetchUserRooms();
    }
  }, []);

  const activeChatData = chats.find(chat => chat.id === activeChat);

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <div className="hidden lg:block">
          <AppSidebar />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <ChatPanel
            chats={chats}
            activeChat={activeChat || undefined}
            onChatSelect={setActiveChat}
            onRoomUpdate={fetchUserRooms}
          />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-2 sm:p-3 border-b border-border bg-background">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="lg:hidden" />
              <div className="hidden lg:block" />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-hidden">
              {activeChatData ? (
                <ChatView
                  chatName={activeChatData.name}
                  chatId={activeChatData.id}
                  roomId={activeChatData.id}
                  status={activeChatData.status}
                  initialMessages={[]}
                />
              ) : (
                <div className="flex items-center justify-center h-full p-4">
                  <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl">No Conversations Yet</CardTitle>
                      <CardDescription className="text-sm">
                        Create a new room or wait for someone to start a conversation with you.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-xs sm:text-sm text-muted-foreground">
                      All your messages will be encrypted with quantum-resistant cryptography.
                    </CardContent>
                  </Card>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
