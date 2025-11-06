import { UserAvatar } from '../UserAvatar';

export default function UserAvatarExample() {
  return (
    <div className="flex gap-4 items-center">
      <UserAvatar name="Alice Chen" size="sm" status="online" />
      <UserAvatar name="Bob Smith" size="md" status="away" />
      <UserAvatar name="Charlie Davis" size="lg" status="offline" />
    </div>
  );
}
