import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { File, Download, Trash2, Lock, Calendar, User } from "lucide-react";
import { getStoredKeyPair } from "@/lib/crypto";
import type { Document } from "@/lib/api";

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId') || '';
  const keypair = getStoredKeyPair();

  useEffect(() => {
    // In a real app, we would fetch documents from the API
    // For now, showing a placeholder since there's no endpoint to get all user documents
    setLoading(false);
  }, [userId]);

  const handleDownload = async (doc: Document) => {
    if (!keypair) {
      alert('No encryption key found. Cannot decrypt document.');
      return;
    }

    try {
      const { apiClient } = await import('@/lib/api');
      const decrypted = await apiClient.decryptDocument(doc.id, keypair.secretKey);
      
      // Create download link
      const blob = new Blob([atob(decrypted.content)], { type: decrypted.mimeType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = decrypted.name;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to decrypt and download document');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const { apiClient } = await import('@/lib/api');
      await apiClient.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: string | null) => {
    if (!bytes) return 'Unknown size';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Documents</h1>
                <p className="text-muted-foreground mt-2">
                  View and manage your encrypted shared files
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Documents</CardDescription>
                    <CardTitle className="text-3xl">{documents.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Encrypted Files</CardDescription>
                    <CardTitle className="text-3xl">{documents.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Security Status</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Lock className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        All Encrypted
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              {/* Documents List */}
              <Card>
                <CardHeader>
                  <CardTitle>Shared Files</CardTitle>
                  <CardDescription>
                    All files are encrypted with quantum-resistant encryption
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-muted-foreground">Loading documents...</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-12">
                      <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                      <p className="text-muted-foreground">
                        Share files in your chats to see them here
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <File className="h-6 w-6 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium truncate">{doc.name}</h4>
                                  <Badge variant="outline" className="flex-shrink-0">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Encrypted
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {doc.uploaderId}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </span>
                                  <span>{formatFileSize(doc.size)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
