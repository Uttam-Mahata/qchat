import { useState } from "react";
import { UserAvatar } from "./UserAvatar";
import { EncryptionBadge } from "./EncryptionBadge";
import { CallDialog } from "./CallDialog";
import { MoreVertical, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  name: string;
  chatId?: string;
  recipientId?: string;
  status?: "online" | "away" | "busy" | "offline";
}

export function ChatHeader({ name, chatId, recipientId, status }: ChatHeaderProps) {
  const [callDialog, setCallDialog] = useState<{
    open: boolean;
    type: 'voice' | 'video';
  }>({ open: false, type: 'voice' });

  const handleVoiceCall = () => {
    setCallDialog({ open: true, type: 'voice' });
  };

  const handleVideoCall = () => {
    setCallDialog({ open: true, type: 'video' });
  };

  return (
    <>
      <div className="border-b border-border bg-background p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar name={name} status={status} />
          <div className="min-w-0">
            <h2 className="font-semibold text-lg truncate" data-testid="text-chat-name">
              {name}
            </h2>
            <EncryptionBadge />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            data-testid="button-voice-call"
            onClick={handleVoiceCall}
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            data-testid="button-video-call"
            onClick={handleVideoCall}
          >
            <Video className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-chat-options">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => console.log('View profile')}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('View keys')}>
                View Encryption Keys
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Mute')}>
                Mute Notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {recipientId && (
        <CallDialog
          open={callDialog.open}
          onClose={() => setCallDialog({ ...callDialog, open: false })}
          recipientId={recipientId}
          recipientName={name}
          callType={callDialog.type}
        />
      )}
    </>
  );
}
