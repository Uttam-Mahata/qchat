import { ChatListItem } from '../ChatListItem';

export default function ChatListItemExample() {
  return (
    <div className="w-80 bg-sidebar border rounded-lg overflow-hidden">
      <ChatListItem
        name="Alice Chen"
        lastMessage="The quantum encryption is working perfectly!"
        timestamp="10:34 AM"
        unreadCount={3}
        status="online"
        onClick={() => console.log('Alice chat clicked')}
      />
      <ChatListItem
        name="Bob Smith"
        lastMessage="Thanks for the update on the ML-KEM implementation"
        timestamp="Yesterday"
        isActive={true}
        status="away"
        onClick={() => console.log('Bob chat clicked')}
      />
      <ChatListItem
        name="Charlie Davis"
        lastMessage="See you tomorrow!"
        timestamp="2 days ago"
        status="offline"
        onClick={() => console.log('Charlie chat clicked')}
      />
    </div>
  );
}
