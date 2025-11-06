import { ChatView } from '../ChatView';
import { TooltipProvider } from '@/components/ui/tooltip';

const mockMessages = [
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
];

export default function ChatViewExample() {
  return (
    <TooltipProvider>
      <div className="h-[600px] border rounded-lg overflow-hidden">
        <ChatView 
          chatName="Alice Chen" 
          status="online"
          initialMessages={mockMessages}
        />
      </div>
    </TooltipProvider>
  );
}
