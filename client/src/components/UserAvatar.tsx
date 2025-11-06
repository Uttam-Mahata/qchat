import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "away" | "busy" | "offline";
}

export function UserAvatar({ name, imageUrl, size = "md", status }: UserAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-24 h-24",
  };

  const statusSizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-5 h-5",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative inline-block" data-testid={`avatar-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <Avatar className={sizeClasses[size]}>
        {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} rounded-full border-2 border-background bg-status-${status}`}
          data-testid={`status-${status}`}
        />
      )}
    </div>
  );
}
