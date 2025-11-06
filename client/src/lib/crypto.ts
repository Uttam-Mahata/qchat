/**
 * Client-side Quantum Cryptography Utilities
 * 
 * Provides encryption/decryption functionality in the browser
 */

// Re-export types for client use
export interface KeyPair {
  publicKey: string; // base64 encoded
  secretKey: string; // base64 encoded
  fingerprint: string;
}

export interface EncryptedMessage {
  encryptedContent: string;
  encapsulatedKey: string;
  nonce: string;
}

/**
 * Generate a new quantum-resistant keypair
 * This calls the server API since crypto operations require the library
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const response = await fetch('/api/crypto/generate-keypair', {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate keypair');
  }
  
  return response.json();
}

/**
 * Store keypair in local storage
 */
export function storeKeyPair(keypair: KeyPair): void {
  localStorage.setItem('qchat_keypair', JSON.stringify(keypair));
}

/**
 * Retrieve keypair from local storage
 */
export function getStoredKeyPair(): KeyPair | null {
  const stored = localStorage.getItem('qchat_keypair');
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Clear stored keypair
 */
export function clearKeyPair(): void {
  localStorage.removeItem('qchat_keypair');
}

/**
 * Encrypt text message for sending
 * Note: Actual encryption happens on server or requires implementing
 * ML-KEM in WebAssembly for client-side encryption
 */
export function prepareMessage(content: string, recipientPublicKey: string): {
  content: string;
  recipientPublicKey: string;
} {
  // In a production implementation, this would encrypt the message
  // For now, we'll prepare it for server-side encryption
  return {
    content,
    recipientPublicKey,
  };
}

/**
 * Format key fingerprint for display
 */
export function formatFingerprint(fingerprint: string): string {
  return fingerprint.toUpperCase();
}
