/**
 * Quantum-Resistant Cryptography Module
 * 
 * Implements post-quantum cryptographic primitives using FIPS 203 (ML-KEM)
 * for key encapsulation and hybrid encryption for document protection.
 */

import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes } from 'crypto';

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface EncryptedData {
  ciphertext: Uint8Array;
  encapsulatedKey: Uint8Array;
  nonce: Uint8Array;
}

/**
 * Generate a new ML-KEM-768 keypair for quantum-resistant key exchange
 */
export function generateKeyPair(): KeyPair {
  const seed = randomBytes(64);
  const keypair = ml_kem768.keygen(seed);
  
  return {
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
  };
}

/**
 * Encapsulate a shared secret using the recipient's public key
 * Returns the shared secret and the encapsulated key (ciphertext)
 */
export function encapsulate(publicKey: Uint8Array): { sharedSecret: Uint8Array; ciphertext: Uint8Array } {
  const seed = randomBytes(32);
  const result = ml_kem768.encapsulate(publicKey, seed);
  
  return {
    sharedSecret: result.sharedSecret,
    ciphertext: result.cipherText,
  };
}

/**
 * Decapsulate the shared secret using the secret key and ciphertext
 */
export function decapsulate(ciphertext: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return ml_kem768.decapsulate(ciphertext, secretKey);
}

/**
 * Simple XOR cipher for demonstration - SECURITY WARNING: NOT CRYPTOGRAPHICALLY SECURE
 * 
 * ⚠️ This is a placeholder implementation for demonstration purposes only.
 * In a production environment, this MUST be replaced with a proper AEAD cipher
 * such as AES-256-GCM. The XOR cipher provides no security guarantees and
 * should never be used for real data encryption.
 * 
 * TODO: Replace with AES-GCM or ChaCha20-Poly1305 for production use
 */
function xorEncrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
}

/**
 * Encrypt data using quantum-resistant hybrid encryption
 * 1. Generate ephemeral shared secret using ML-KEM
 * 2. Derive encryption key from shared secret
 * 3. Encrypt data with symmetric cipher
 */
export function encryptData(data: Uint8Array, recipientPublicKey: Uint8Array): EncryptedData {
  // Encapsulate shared secret
  const { sharedSecret, ciphertext: encapsulatedKey } = encapsulate(recipientPublicKey);
  
  // Derive encryption key from shared secret
  const encryptionKey = sha256(sharedSecret);
  
  // Generate nonce for additional security
  const nonce = randomBytes(12);
  
  // Encrypt data (in production, use AES-GCM with the nonce)
  const ciphertext = xorEncrypt(data, encryptionKey);
  
  return {
    ciphertext,
    encapsulatedKey,
    nonce,
  };
}

/**
 * Decrypt data using quantum-resistant hybrid encryption
 */
export function decryptData(encrypted: EncryptedData, secretKey: Uint8Array): Uint8Array {
  // Decapsulate shared secret
  const sharedSecret = decapsulate(encrypted.encapsulatedKey, secretKey);
  
  // Derive encryption key
  const encryptionKey = sha256(sharedSecret);
  
  // Decrypt data
  return xorEncrypt(encrypted.ciphertext, encryptionKey);
}

/**
 * Verify key fingerprint for user verification
 */
export function getKeyFingerprint(publicKey: Uint8Array): string {
  const hash = sha256(publicKey);
  const hashArray = Array.from(hash.slice(0, 16));
  const hex = hashArray
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Format as groups of 4 for readability
  return hex.match(/.{1,4}/g)?.join(' ') || '';
}

/**
 * Encode binary data to base64 for transmission
 */
export function encodeBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

/**
 * Decode base64 string to binary data
 */
export function decodeBase64(data: string): Uint8Array {
  return new Uint8Array(Buffer.from(data, 'base64'));
}
