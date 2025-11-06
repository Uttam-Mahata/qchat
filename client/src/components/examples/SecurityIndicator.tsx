import { SecurityIndicator } from '../SecurityIndicator';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function SecurityIndicatorExample() {
  return (
    <TooltipProvider>
      <div className="flex gap-4">
        <SecurityIndicator verified={true} />
        <SecurityIndicator verified={false} />
      </div>
    </TooltipProvider>
  );
}
