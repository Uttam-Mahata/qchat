import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CreateGroupChatProps {
  onGroupCreated?: (group: any) => void;
}

export function CreateGroupChat({ onGroupCreated }: CreateGroupChatProps) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for the group",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('Not authenticated');
      }

      const room = await apiClient.createRoom(groupName, true, [
        { userId }
      ]);

      toast({
        title: "Group created",
        description: `${groupName} has been created successfully`,
      });

      setGroupName("");
      setOpen(false);
      onGroupCreated?.(room);
    } catch (error) {
      console.error('Create group error:', error);
      toast({
        title: "Failed to create group",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Create Group Chat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create Group Chat
          </DialogTitle>
          <DialogDescription>
            Create an encrypted group chat with quantum-resistant security
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            💡 All messages in this group will be encrypted with quantum-resistant algorithms (ML-KEM-768)
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
