import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { getStoredKeyPair, formatFingerprint } from "@/lib/crypto";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  
  const keypair = getStoredKeyPair();
  const username = localStorage.getItem('username') || 'User';
  const userId = localStorage.getItem('userId') || '';

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('qchat_keypair');
    window.location.href = '/';
  };

  const handleExportKey = () => {
    if (keypair) {
      const dataStr = JSON.stringify(keypair, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `qchat-keypair-${userId}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-2 border-b border-border bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2">
                  Manage your account settings and preferences
                </p>
              </div>

              <Separator />

              {/* Account Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>
                    Your account information and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <div className="text-sm text-muted-foreground">{username}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <div className="text-sm text-muted-foreground font-mono">{userId}</div>
                  </div>
                  {keypair && (
                    <div className="space-y-2">
                      <Label>Key Fingerprint</Label>
                      <div className="text-sm text-muted-foreground font-mono">
                        {formatFingerprint(keypair.fingerprint)}
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button variant="destructive" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>
                    Manage your encryption keys and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Encryption Status</Label>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        ✓ Quantum-Resistant Encryption Enabled
                      </span>
                    </div>
                  </div>
                  {keypair && (
                    <div className="pt-2">
                      <Button variant="outline" onClick={handleExportKey}>
                        Export Encryption Key
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⚠️ Keep your private key secure. Anyone with access to it can decrypt your messages.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notifications Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Configure how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications for new messages
                      </div>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sound</Label>
                      <div className="text-sm text-muted-foreground">
                        Play sound for incoming messages
                      </div>
                    </div>
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={setSoundEnabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* File Transfer Section */}
              <Card>
                <CardHeader>
                  <CardTitle>File Transfer</CardTitle>
                  <CardDescription>
                    Configure file sharing and download settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-download Documents</Label>
                      <div className="text-sm text-muted-foreground">
                        Automatically download shared documents
                      </div>
                    </div>
                    <Switch
                      checked={autoDownload}
                      onCheckedChange={setAutoDownload}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
