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
 * 
 * ⚠️ SECURITY WARNING: Storing secret keys in localStorage is not secure
 * for production use. Secret keys should be:
 * 1. Stored in secure, encrypted storage (e.g., IndexedDB with encryption)
 * 2. Never transmitted to the server
 * 3. Protected with additional encryption (e.g., password-derived key)
 * 
 * This demo implementation uses localStorage for simplicity only.
 * In production, use the Web Crypto API with non-extractable keys or
 * a hardware security module (HSM).
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
