import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { ChatListItem } from "./ChatListItem";
import { RoomCodeDialog } from "./RoomCodeDialog";
import { useState } from "react";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  status?: "online" | "away" | "busy" | "offline";
}

interface ChatPanelProps {
  chats: Chat[];
  activeChat?: string;
  onChatSelect: (chatId: string) => void;
  onRoomUpdate?: () => void;
}

export function ChatPanel({ chats, activeChat, onChatSelect, onRoomUpdate }: ChatPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showRoomDialog, setShowRoomDialog] = useState(false);

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoomJoinedOrCreated = () => {
    // Refresh the room list
    onRoomUpdate?.();
  };

  return (
    <div className="hidden md:flex md:w-80 lg:w-96 bg-sidebar border-r border-sidebar-border flex-col h-full">
      <div className="p-4 border-b border-sidebar-border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search conversations"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-chats"
          />
        </div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowRoomDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create or Join Room
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              name={chat.name}
              lastMessage={chat.lastMessage}
              timestamp={chat.timestamp}
              unreadCount={chat.unreadCount}
              status={chat.status}
              isActive={activeChat === chat.id}
              onClick={() => onChatSelect(chat.id)}
            />
          ))
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations found
          </div>
        )}
      </div>
      
      <RoomCodeDialog
        open={showRoomDialog}
        onOpenChange={setShowRoomDialog}
        onRoomJoined={handleRoomJoinedOrCreated}
        onRoomCreated={handleRoomJoinedOrCreated}
      />
    </div>
  );
}
