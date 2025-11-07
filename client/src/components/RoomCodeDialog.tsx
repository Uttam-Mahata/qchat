import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Users, LogIn } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface RoomCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomJoined?: (room: any) => void;
  onRoomCreated?: (room: any) => void;
}

export function RoomCodeDialog({ open, onOpenChange, onRoomJoined, onRoomCreated }: RoomCodeDialogProps) {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [createdRoom, setCreatedRoom] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Room name required",
        description: "Please enter a name for the room",
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

      const room = await apiClient.createRoom(roomName, true, [
        { userId }
      ]);

      setCreatedRoom(room);
      
      toast({
        title: "Room created",
        description: `${roomName} has been created successfully`,
      });

      onRoomCreated?.(room);
    } catch (error) {
      console.error('Create room error:', error);
      toast({
        title: "Failed to create room",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a room code",
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

      const result = await apiClient.joinRoomWithCode(roomCode.toUpperCase().trim(), userId);

      toast({
        title: "Joined room",
        description: `You have successfully joined ${result.room.name}`,
      });

      setRoomCode("");
      onOpenChange(false);
      onRoomJoined?.(result.room);
    } catch (error) {
      console.error('Join room error:', error);
      toast({
        title: "Failed to join room",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdRoom?.code) {
      navigator.clipboard.writeText(createdRoom.code);
      setCopied(true);
      toast({
        title: "Code copied",
        description: "Room code has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setRoomName("");
    setRoomCode("");
    setCreatedRoom(null);
    setCopied(false);
    setActiveTab("create");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chat Room</DialogTitle>
          <DialogDescription>
            Create a new room or join an existing one with a code
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "join")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Create Room
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Join Room
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 py-4">
            {!createdRoom ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    placeholder="Enter room name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                  💡 A unique room code will be generated that others can use to join
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRoom} disabled={loading}>
                    {loading ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                    <div className="text-sm text-muted-foreground mb-2">Room Code</div>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold tracking-wider font-mono">
                        {createdRoom.code}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyCode}
                        className="ml-2"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p className="font-medium mb-1">Share this code</p>
                    <p className="text-muted-foreground">
                      Share this code with others to let them join your room. They can enter it in the "Join Room" tab.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleClose}>
                    Done
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="join" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-code">Room Code</Label>
              <Input
                id="room-code"
                placeholder="Enter 8-character room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                disabled={loading}
                maxLength={8}
                className="font-mono text-lg tracking-wider"
              />
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              💡 Enter the room code shared with you to join the conversation
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleJoinRoom} disabled={loading}>
                {loading ? "Joining..." : "Join Room"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
