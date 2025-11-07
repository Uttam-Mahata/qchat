import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip } from "lucide-react";
import { SecurityIndicator } from "./SecurityIndicator";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  onSend: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  roomId?: string;
}

export function MessageInput({ onSend, onTyping, placeholder = "Message (End-to-end encrypted)", roomId }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Notify typing status
    if (onTyping) {
      if (!isTypingRef.current && e.target.value.trim()) {
        isTypingRef.current = true;
        onTyping(true);
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          onTyping(false);
        }
      }, 1000);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      onSend(message);
      setMessage("");

      // Stop typing indicator
      if (onTyping && isTypingRef.current) {
        isTypingRef.current = false;
        onTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!roomId) {
      toast({
        title: "Cannot upload file",
        description: "Please select a chat room first",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "File upload",
      description: `Uploading ${file.name}...`,
    });

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = reader.result as string;
        const base64Data = base64Content.split(',')[1]; // Remove data URL prefix

        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Get room members to get recipient public key
        const roomResponse = await fetch(`/api/rooms/${roomId}/members`);
        if (!roomResponse.ok) {
          throw new Error('Failed to fetch room members');
        }
        
        const members = await roomResponse.json();
        // SECURITY NOTE: Current implementation only encrypts for one recipient
        // For group chats, files should be encrypted for all members or use a
        // different encryption strategy (e.g., symmetric key encrypted per-member)
        // TODO: Implement proper group encryption for file uploads
        const recipient = members.find((m: any) => m.userId !== userId);
        if (!recipient?.publicKey) {
          throw new Error('No recipient found with public key');
        }

        // Upload document
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            uploaderId: userId,
            roomId,
            content: base64Data,
            recipientPublicKey: recipient.publicKey,
            mimeType: file.type,
            size: file.size.toString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded successfully`,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-border bg-background p-2 sm:p-4">
      <div className="flex items-end gap-1 sm:gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />
        <Button
          variant="ghost"
          size="icon"
          className="mb-1 shrink-0"
          data-testid="button-attach"
          onClick={handleAttachClick}
        >
          <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="resize-none min-h-12 max-h-32 pr-10 text-sm sm:text-base"
            data-testid="input-message"
          />
          <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3">
            <SecurityIndicator />
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          size="icon"
          className="rounded-full mb-1 shrink-0"
          data-testid="button-send"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  );
}
