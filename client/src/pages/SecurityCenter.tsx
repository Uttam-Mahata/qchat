import { useState, useEffect } from "react";
import { Shield, Key, FileText, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyVerificationPanel } from "@/components/KeyVerificationPanel";
import { DocumentUpload } from "@/components/DocumentUpload";
import { getStoredKeyPair } from "@/lib/crypto";
import { apiClient } from "@/lib/api";

export function SecurityCenter() {
  const [keypair, setKeypair] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const kp = getStoredKeyPair();
    setKeypair(kp);
  }, []);

  if (!keypair) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No encryption keys found</p>
          <p className="text-sm text-muted-foreground">Please log in to view security information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Security Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your quantum-safe encryption keys and security settings
          </p>
        </div>

        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="keys">
              <Key className="w-4 h-4 mr-2" />
              Encryption Keys
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Users className="w-4 h-4 mr-2" />
              Contacts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4 mt-6">
            <KeyVerificationPanel
              localPublicKey={keypair.publicKey}
              localFingerprint={keypair.fingerprint}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Upload Encrypted Document</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Documents are encrypted with quantum-resistant algorithms before upload
                </p>
                {/* DocumentUpload would need roomId and recipientPublicKey */}
                <div className="border border-border rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select a chat room to upload documents
                  </p>
                </div>
              </div>

              {documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Your Documents</h3>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border border-border rounded-lg p-4">
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4 mt-6">
            <div className="border border-border rounded-lg p-6 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Contact management coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
