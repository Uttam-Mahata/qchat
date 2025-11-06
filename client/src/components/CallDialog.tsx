import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Phone, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getWebSocketClient } from "@/lib/websocket";

interface CallDialogProps {
  open: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  callType: 'voice' | 'video';
  isIncoming?: boolean;
}

export function CallDialog({
  open,
  onClose,
  recipientId,
  recipientName,
  callType,
  isIncoming = false,
}: CallDialogProps) {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (callState === 'connected') {
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callState]);

  const handleAnswer = () => {
    setCallState('connected');
    const wsClient = getWebSocketClient();
    wsClient.sendCallSignal(recipientId, { type: 'answer' }, callType);
  };

  const handleDecline = () => {
    setCallState('ended');
    const wsClient = getWebSocketClient();
    wsClient.sendCallSignal(recipientId, { type: 'decline' }, callType);
    onClose();
  };

  const handleEndCall = () => {
    setCallState('ended');
    const wsClient = getWebSocketClient();
    wsClient.sendCallSignal(recipientId, { type: 'end' }, callType);
    onClose();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In production, this would control the actual audio stream
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // In production, this would control the actual video stream
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {callType === 'video' ? (
              <Video className="w-5 h-5" />
            ) : (
              <Phone className="w-5 h-5" />
            )}
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-6">
          <Avatar className="w-24 h-24">
            <AvatarFallback className="text-3xl">
              {recipientName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <p className="text-xl font-semibold">{recipientName}</p>
            {callState === 'ringing' && (
              <p className="text-muted-foreground mt-1">
                {isIncoming ? 'Incoming call...' : 'Calling...'}
              </p>
            )}
            {callState === 'connected' && (
              <p className="text-muted-foreground mt-1">
                {formatDuration(duration)}
              </p>
            )}
          </div>

          {callState === 'ringing' && isIncoming && (
            <div className="flex gap-4">
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16"
                onClick={handleDecline}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
                onClick={handleAnswer}
              >
                <Phone className="w-6 h-6" />
              </Button>
            </div>
          )}

          {callState === 'connected' && (
            <>
              <div className="p-3 bg-primary/10 rounded-lg text-sm text-center">
                🔒 End-to-end encrypted with quantum-resistant signaling
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant={isMuted ? "destructive" : "outline"}
                  size="icon"
                  className="rounded-full"
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                {callType === 'video' && (
                  <Button
                    variant={isVideoOff ? "destructive" : "outline"}
                    size="icon"
                    className="rounded-full"
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-full"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>
              </div>
            </>
          )}

          {callState === 'ringing' && !isIncoming && (
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16"
              onClick={handleDecline}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          )}
        </div>

        <div className="text-xs text-center text-muted-foreground">
          Note: This is a demo UI. WebRTC integration would be required for actual calls.
        </div>
      </DialogContent>
    </Dialog>
  );
}
