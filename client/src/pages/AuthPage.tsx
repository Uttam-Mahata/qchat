import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Lock } from "lucide-react";
import { apiClient } from "@/lib/api";
import { storeKeyPair, getStoredKeyPair, generateKeyPair } from "@/lib/crypto";
import { useToast } from "@/hooks/use-toast";

interface AuthPageProps {
  onAuthSuccess: (userId: string, username: string) => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { user } = await apiClient.login(username, password);
        
        // Store user info
        localStorage.setItem('userId', user.id);
        localStorage.setItem('username', user.username);
        
        // Check if user has a stored keypair locally
        let storedKeypair = getStoredKeyPair();
        
        // If no keypair is stored locally, generate a new one
        if (!storedKeypair) {
          toast({
            title: "Generating encryption keys",
            description: "Setting up quantum-safe encryption for your account...",
          });
          
          const newKeypair = await generateKeyPair();
          
          // Update user's public key on the server
          try {
            const response = await fetch(`/api/users/${user.id}/public-key`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicKey: newKeypair.publicKey }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to update public key');
            }
            
            // Store the new keypair locally
            storeKeyPair(newKeypair);
            storedKeypair = newKeypair;
          } catch (error) {
            console.error('Error updating public key:', error);
            toast({
              title: "Key update failed",
              description: "Could not update encryption keys. Please try again.",
              variant: "destructive",
            });
            return;
          }
        }
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.username}!`,
        });
        
        onAuthSuccess(user.id, user.username);
      } else {
        // Register
        const { user, secretKey } = await apiClient.register(username, password);
        
        // Store user info and keypair
        localStorage.setItem('userId', user.id);
        localStorage.setItem('username', user.username);
        
        storeKeyPair({
          publicKey: user.publicKey || '',
          secretKey,
          fingerprint: user.fingerprint || '',
        });
        
        toast({
          title: "Registration successful",
          description: "Your quantum-safe encryption keys have been generated",
        });
        
        onAuthSuccess(user.id, user.username);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: isLogin ? "Login failed" : "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">QChat</CardTitle>
            <CardDescription>
              Quantum-resistant secure messaging
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {!isLogin && (
              <div className="p-3 bg-primary/10 rounded-lg text-sm space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  <Lock className="w-4 h-4" />
                  <span>Quantum-Safe Encryption</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  A post-quantum cryptographic keypair will be generated for you using ML-KEM-768 (FIPS 203).
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
