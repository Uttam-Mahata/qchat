import { AppSidebar } from '../AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AppSidebarExample() {
  return (
    <SidebarProvider>
      <div className="flex h-[400px] w-full border rounded-lg overflow-hidden">
        <AppSidebar />
        <div className="flex-1 p-8 bg-background">
          <h2 className="text-xl font-semibold">Main Content Area</h2>
          <p className="text-muted-foreground mt-2">
            The sidebar navigation is on the left
          </p>
        </div>
      </div>
    </SidebarProvider>
  );
}
