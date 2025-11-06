import { MessageBubble } from '../MessageBubble';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function MessageBubbleExample() {
  return (
    <TooltipProvider>
      <div className="space-y-4 p-4 bg-background">
        <MessageBubble
          content="Hey! Just wanted to let you know the quantum encryption is working perfectly."
          timestamp="10:32 AM"
          isSent={false}
          senderName="Alice"
        />
        <MessageBubble
          content="That's great! The ML-KEM handshake completed successfully."
          timestamp="10:33 AM"
          isSent={true}
        />
        <MessageBubble
          content="Perfect. All our messages are now quantum-resistant 🔒"
          timestamp="10:34 AM"
          isSent={false}
          senderName="Alice"
        />
      </div>
    </TooltipProvider>
  );
}
