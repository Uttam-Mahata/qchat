import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip } from "lucide-react";
import { SecurityIndicator } from "./SecurityIndicator";

interface MessageInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
}

export function MessageInput({ onSend, placeholder = "Message (End-to-end encrypted)" }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="mb-1"
          data-testid="button-attach"
          onClick={() => console.log('Attach file clicked')}
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="resize-none min-h-12 max-h-32 pr-10"
            data-testid="input-message"
          />
          <div className="absolute right-3 bottom-3">
            <SecurityIndicator />
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          size="icon"
          className="rounded-full mb-1"
          data-testid="button-send"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
