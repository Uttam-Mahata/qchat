import { ChatHeader } from '../ChatHeader';

export default function ChatHeaderExample() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <ChatHeader name="Alice Chen" status="online" />
    </div>
  );
}
