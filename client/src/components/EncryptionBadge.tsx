import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EncryptionBadge() {
  return (
    <Badge 
      variant="secondary" 
      className="gap-1.5 px-3 py-1"
      data-testid="badge-encryption"
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">Quantum-Safe E2E</span>
    </Badge>
  );
}
