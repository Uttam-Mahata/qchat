import { MessageInput } from '../MessageInput';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function MessageInputExample() {
  const handleSend = (message: string) => {
    console.log('Message sent:', message);
  };

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden">
        <MessageInput onSend={handleSend} />
      </div>
    </TooltipProvider>
  );
}
