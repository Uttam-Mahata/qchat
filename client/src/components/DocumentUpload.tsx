import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, X, Lock } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getStoredKeyPair } from "@/lib/crypto";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  roomId: string;
  recipientPublicKey: string;
  onUploadComplete?: (document: any) => void;
}

export function DocumentUpload({ roomId, recipientPublicKey, onUploadComplete }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (limit to 10MB for demo)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const keypair = getStoredKeyPair();
    if (!keypair) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = e.target?.result as string;
        const content = base64Content.split(',')[1]; // Remove data URL prefix

        const uploaderId = localStorage.getItem('userId') || '';
        
        const document = await apiClient.uploadDocument(
          file.name,
          uploaderId,
          roomId,
          content,
          recipientPublicKey,
          file.type,
          file.size.toString()
        );

        toast({
          title: "Document uploaded",
          description: "Your document has been securely encrypted and uploaded",
        });

        setFile(null);
        onUploadComplete?.(document);
      };

      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to read file",
          variant: "destructive",
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center gap-2 cursor-pointer"
          >
            <Upload className="w-12 h-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Click to upload a document</p>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum file size: 10MB
              </p>
            </div>
          </label>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <File className="w-8 h-8 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                  <Lock className="w-3 h-3" />
                  <span>Will be encrypted with ML-KEM</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? "Encrypting & Uploading..." : "Upload Document"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
