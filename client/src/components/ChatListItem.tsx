import { UserAvatar } from "./UserAvatar";
import { Badge } from "@/components/ui/badge";

interface ChatListItemProps {
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isActive?: boolean;
  status?: "online" | "away" | "busy" | "offline";
  onClick?: () => void;
}

export function ChatListItem({
  name,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isActive = false,
  status,
  onClick,
}: ChatListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-start gap-3 hover-elevate active-elevate-2 transition-colors ${
        isActive ? 'bg-sidebar-accent' : ''
      }`}
      data-testid={`chat-item-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <UserAvatar name={name} status={status} />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3 className="font-medium text-base truncate">{name}</h3>
          <span className="text-xs text-muted-foreground shrink-0">{timestamp}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
          {unreadCount > 0 && (
            <Badge 
              className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs shrink-0"
              data-testid={`unread-count-${unreadCount}`}
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
