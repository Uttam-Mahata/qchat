import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SecurityIndicatorProps {
  verified?: boolean;
}

export function SecurityIndicator({ verified = true }: SecurityIndicatorProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Lock 
          className={`w-3 h-3 ${verified ? 'text-primary' : 'text-muted-foreground'}`}
          data-testid="icon-security"
        />
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          {verified ? 'Encrypted with ML-KEM' : 'Encryption pending'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
