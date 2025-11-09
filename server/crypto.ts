/**
 * Quantum-Resistant Cryptography Module
 * 
 * Implements post-quantum cryptographic primitives using FIPS 203 (ML-KEM)
 * for key encapsulation and hybrid encryption for document protection.
 */

import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes } from 'crypto';
import { gcm } from '@noble/ciphers/aes';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

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
 * AES-256-GCM encryption with authentication
 *
 * Uses AES-256 in Galois/Counter Mode (GCM) providing authenticated encryption.
 * GCM is an AEAD (Authenticated Encryption with Associated Data) mode that
 * provides both confidentiality and authenticity guarantees.
 *
 * Security properties:
 * - 256-bit key size for quantum resistance parity
 * - 96-bit nonce (recommended size for GCM)
 * - 128-bit authentication tag
 * - Constant-time implementation via @noble/ciphers
 */
function aesGcmEncrypt(
  data: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array
): Uint8Array {
  // Validate inputs
  const MAX_DATA_SIZE = 10 * 1024 * 1024; // 10MB limit
  if (data.length > MAX_DATA_SIZE) {
    throw new Error(`Data size exceeds maximum allowed size of ${MAX_DATA_SIZE} bytes`);
  }
  if (key.length !== 32) {
    throw new Error('AES-256-GCM requires a 32-byte key');
  }
  if (nonce.length !== 12) {
    throw new Error('GCM nonce must be 12 bytes');
  }

  // Create AES-GCM cipher instance
  const cipher = gcm(key, nonce);

  // Encrypt and authenticate
  const ciphertext = cipher.encrypt(data);

  return ciphertext;
}

/**
 * AES-256-GCM decryption with authentication verification
 */
function aesGcmDecrypt(
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array
): Uint8Array {
  // Validate inputs
  if (key.length !== 32) {
    throw new Error('AES-256-GCM requires a 32-byte key');
  }
  if (nonce.length !== 12) {
    throw new Error('GCM nonce must be 12 bytes');
  }

  // Create AES-GCM cipher instance
  const cipher = gcm(key, nonce);

  // Decrypt and verify authentication tag
  // Will throw if authentication fails (tampered data)
  try {
    const plaintext = cipher.decrypt(ciphertext);
    return plaintext;
  } catch (error) {
    throw new Error('Decryption failed: Authentication tag verification failed. Data may have been tampered with.');
  }
}

/**
 * Encrypt data using quantum-resistant hybrid encryption
 *
 * Security architecture:
 * 1. Generate ephemeral shared secret using ML-KEM-768 (post-quantum KEM)
 * 2. Derive 256-bit AES key from shared secret using SHA-256
 * 3. Encrypt data with AES-256-GCM (authenticated encryption)
 *
 * This provides:
 * - Quantum resistance via ML-KEM-768
 * - Confidentiality via AES-256
 * - Authenticity via GCM authentication tag
 * - Forward secrecy via ephemeral key encapsulation
 */
export function encryptData(data: Uint8Array, recipientPublicKey: Uint8Array): EncryptedData {
  // Encapsulate shared secret using post-quantum KEM
  const { sharedSecret, ciphertext: encapsulatedKey } = encapsulate(recipientPublicKey);

  // Derive 256-bit encryption key from shared secret
  // SHA-256 provides uniform distribution and collision resistance
  const encryptionKey = sha256(sharedSecret);

  // Generate cryptographically secure random nonce (96 bits for GCM)
  const nonce = randomBytes(12);

  // Encrypt data with AES-256-GCM
  const ciphertext = aesGcmEncrypt(data, encryptionKey, nonce);

  return {
    ciphertext,
    encapsulatedKey,
    nonce,
  };
}

/**
 * Decrypt data using quantum-resistant hybrid encryption
 *
 * Decryption process:
 * 1. Decapsulate shared secret using ML-KEM-768 secret key
 * 2. Derive 256-bit AES key from shared secret using SHA-256
 * 3. Decrypt and authenticate data with AES-256-GCM
 *
 * Security guarantees:
 * - Throws error if authentication tag verification fails (tampered data)
 * - Constant-time operations prevent timing attacks
 * - Post-quantum secure key agreement
 */
export function decryptData(encrypted: EncryptedData, secretKey: Uint8Array): Uint8Array {
  // Decapsulate shared secret using post-quantum KEM
  const sharedSecret = decapsulate(encrypted.encapsulatedKey, secretKey);

  // Derive encryption key (same process as encryption)
  const encryptionKey = sha256(sharedSecret);

  // Decrypt and verify authentication tag
  return aesGcmDecrypt(encrypted.ciphertext, encryptionKey, encrypted.nonce);
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
