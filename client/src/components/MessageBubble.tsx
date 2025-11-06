import { SecurityIndicator } from "./SecurityIndicator";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
}

export function MessageBubble({ content, timestamp, isSent, senderName }: MessageBubbleProps) {
  return (
    <div
      className={`flex flex-col max-w-lg ${isSent ? 'ml-auto items-end' : 'mr-auto items-start'}`}
      data-testid={`message-${isSent ? 'sent' : 'received'}`}
    >
      {!isSent && senderName && (
        <span className="text-xs text-muted-foreground mb-1 px-4">{senderName}</span>
      )}
      <div
        className={`rounded-2xl px-4 py-3 ${
          isSent
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-card border border-card-border rounded-bl-md'
        }`}
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>
      </div>
      <div className="flex items-center gap-1.5 mt-1 px-2">
        <span className="text-xs text-muted-foreground">{timestamp}</span>
        <SecurityIndicator />
      </div>
    </div>
  );
}
