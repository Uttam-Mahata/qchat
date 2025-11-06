import { useState } from "react";
import { Shield, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatFingerprint } from "@/lib/crypto";
import { useToast } from "@/hooks/use-toast";

interface KeyVerificationPanelProps {
  localPublicKey: string;
  localFingerprint: string;
  remotePublicKey?: string;
  remoteFingerprint?: string;
  remoteUsername?: string;
}

export function KeyVerificationPanel({
  localPublicKey,
  localFingerprint,
  remotePublicKey,
  remoteFingerprint,
  remoteUsername,
}: KeyVerificationPanelProps) {
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [copiedRemote, setCopiedRemote] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, isLocal: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isLocal) {
        setCopiedLocal(true);
        setTimeout(() => setCopiedLocal(false), 2000);
      } else {
        setCopiedRemote(true);
        setTimeout(() => setCopiedRemote(false), 2000);
      }
      toast({
        title: "Copied to clipboard",
        description: "Key fingerprint has been copied",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>Your Quantum-Safe Key</CardTitle>
          </div>
          <CardDescription>
            ML-KEM-768 (FIPS 203) post-quantum key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Key Fingerprint
            </label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-3 rounded bg-muted font-mono text-sm break-all">
                {formatFingerprint(localFingerprint)}
              </code>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(localFingerprint, true)}
                  >
                    {copiedLocal ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy fingerprint</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Share this fingerprint with others to verify your identity.
              They can compare it through a separate secure channel.
            </p>
          </div>
        </CardContent>
      </Card>

      {remotePublicKey && remoteFingerprint && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>
                {remoteUsername ? `${remoteUsername}'s Key` : "Contact's Key"}
              </CardTitle>
            </div>
            <CardDescription>
              Verify this fingerprint matches through a secure channel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Key Fingerprint
              </label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-3 rounded bg-muted font-mono text-sm break-all">
                  {formatFingerprint(remoteFingerprint)}
                </code>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(remoteFingerprint, false)}
                    >
                      {copiedRemote ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy fingerprint</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                ⚠️ Important: Compare this fingerprint with {remoteUsername || "your contact"} 
                through a separate communication channel (phone call, in person, etc.) 
                to ensure you're talking to the right person.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Security Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p>
              <strong>Post-Quantum Secure:</strong> Uses ML-KEM-768 (Kyber), 
              standardized as FIPS 203, resistant to quantum computer attacks.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p>
              <strong>End-to-End Encrypted:</strong> Messages are encrypted on 
              your device and can only be decrypted by the recipient.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p>
              <strong>Forward Secrecy:</strong> Each message uses ephemeral keys 
              to ensure past communications remain secure.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
