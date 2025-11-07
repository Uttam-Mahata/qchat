import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStoredKeyPair, formatFingerprint } from "@/lib/crypto";
import { Shield, Key, Calendar } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const username = localStorage.getItem('username') || 'User';
  const userId = localStorage.getItem('userId') || '';
  const keypair = getStoredKeyPair();

  useEffect(() => {
    // Fetch user profile from API
    const fetchProfile = async () => {
      try {
        const { apiClient } = await import('@/lib/api');
        const userData = await apiClient.getUser(userId);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
              {/* Profile Header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-2xl">
                        {getInitials(username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold">{username}</h1>
                      <p className="text-muted-foreground mt-1">
                        User ID: <span className="font-mono text-sm">{userId}</span>
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Quantum-Protected
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Key className="h-3 w-3" />
                          ML-KEM Encrypted
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Information</CardTitle>
                  <CardDescription>
                    Your quantum-resistant encryption details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {keypair ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Public Key Fingerprint</span>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <code className="text-xs font-mono">
                            {formatFingerprint(keypair.fingerprint)}
                          </code>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Encryption Algorithm</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ML-KEM-768 (FIPS 203) - Post-Quantum Cryptography
                        </p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Key Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                          <span className="text-sm text-muted-foreground">Active and Valid</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No encryption key found. Please re-login to generate a new keypair.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>
                    Information about your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Account Created</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Information not available'}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <span className="font-medium">Username</span>
                    <p className="text-sm text-muted-foreground">{username}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <span className="font-medium">Security Level</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">High</Badge>
                      <span className="text-sm text-muted-foreground">
                        All communications are quantum-resistant encrypted
                      </span>
                    </div>
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
