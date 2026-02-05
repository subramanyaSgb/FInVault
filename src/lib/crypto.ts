// ============================================
// FinVault Crypto Utility Module
// ============================================
// Implements AES-256-GCM encryption with PBKDF2 key derivation
// Production-ready with proper error handling and TypeScript types
// ============================================

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

export const CRYPTO_CONSTANTS = {
  ALGORITHM: 'AES-256-GCM' as const,
  KEY_LENGTH: 32, // 256 bits
  IV_LENGTH: 12, // 96 bits for GCM
  AUTH_TAG_LENGTH: 16, // 128 bits
  SALT_LENGTH: 32, // 256 bits
  ITERATIONS: 100000,
  HASH_ALGORITHM: 'SHA-256' as const,
  ENCRYPTION_VERSION: 1,
  KEY_ID_PREFIX: 'finvault_key_',
  MASTER_KEY_ALGORITHM: { name: 'AES-GCM', length: 256 } as AesKeyGenParams,
  PBKDF2_ALGORITHM: { name: 'PBKDF2' } as AlgorithmIdentifier,
  PBKDF2_DERIVE_PARAMS: (salt: Uint8Array): Pbkdf2Params => ({
    name: 'PBKDF2',
    salt: salt as unknown as ArrayBuffer,
    iterations: 100000,
    hash: 'SHA-256',
  }),
} as const;

// ============================================
// ERROR HANDLING
// ============================================

export class CryptoError extends Error {
  public readonly code: CryptoErrorCode;
  public override readonly cause: Error | undefined;

  constructor(message: string, code: CryptoErrorCode, cause?: Error) {
    super(message, { cause });
    this.name = 'CryptoError';
    this.code = code;
    this.cause = cause ?? undefined;
  }
}

export type CryptoErrorCode =
  | 'KEY_GENERATION_FAILED'
  | 'ENCRYPTION_FAILED'
  | 'DECRYPTION_FAILED'
  | 'INVALID_PASSWORD'
  | 'CORRUPT_DATA'
  | 'INVALID_VERSION'
  | 'AUTHENTICATION_FAILED'
  | 'KEY_NOT_FOUND'
  | 'STORAGE_ERROR'
  | 'INVALID_BLOB'
  | 'EXPORT_FAILED'
  | 'IMPORT_FAILED'
  | 'WRONG_PIN'
  | 'MAX_ATTEMPTS_EXCEEDED';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface EncryptedData {
  encrypted: string; // Base64 encoded
  iv: string; // Base64 encoded
  authTag: string; // Base64 encoded
  salt: string; // Base64 encoded
  algorithm: 'AES-256-GCM';
  version: number;
  timestamp: number;
}

export interface EncryptedField {
  encryptedData: string;
  iv: string;
  authTag: string;
  algorithm: 'AES-256-GCM';
  version: number;
}

export interface EncryptedBlob {
  encrypted: ArrayBuffer;
  iv: Uint8Array;
  authTag: Uint8Array;
  salt: Uint8Array;
  originalType: string;
  originalName: string;
  size: number;
  algorithm: 'AES-256-GCM';
  version: number;
  timestamp: number;
}

export interface MasterKeyData {
  key: CryptoKey;
  salt: Uint8Array;
  iterations: number;
  version: number;
}

export interface KeyMetadata {
  id: string;
  createdAt: Date;
  expiresAt?: Date;
  purpose: 'master' | 'session' | 'backup';
  version: number;
}

export interface EncryptedExport {
  version: number;
  exportDate: string;
  encryptedData: EncryptedData;
  metadata: {
    profileId: string;
    recordCounts: Record<string, number>;
    checksum: string;
  };
}

export interface EncryptionOptions {
  includeSalt?: boolean;
  version?: number;
  purpose?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

/**
 * String to ArrayBuffer (for text processing)
 */
export function stringToBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer as ArrayBuffer;
}

/**
 * ArrayBuffer to string
 */
export function bufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * Generate a unique key ID
 */
export function generateKeyId(): string {
  return `${CRYPTO_CONSTANTS.KEY_ID_PREFIX}${Date.now()}_${generateRandomBytes(4).join('')}`;
}

/**
 * Compute SHA-256 hash of data
 */
export async function computeHash(data: string | ArrayBuffer): Promise<string> {
  const buffer = typeof data === 'string' ? stringToBuffer(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Validate encrypted data structure
 */
export function validateEncryptedData(data: unknown): data is EncryptedData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Partial<EncryptedData>;
  return (
    typeof d.encrypted === 'string' &&
    typeof d.iv === 'string' &&
    typeof d.authTag === 'string' &&
    typeof d.salt === 'string' &&
    d.algorithm === 'AES-256-GCM' &&
    typeof d.version === 'number' &&
    typeof d.timestamp === 'number'
  );
}

// ============================================
// MASTER KEY GENERATION
// ============================================

/**
 * Derive master key from password/PIN using PBKDF2
 * @param password - User's PIN or password
 * @param salt - Optional salt (generated if not provided)
 * @param iterations - Number of PBKDF2 iterations (default: 100,000)
 * @returns MasterKeyData containing the key and salt
 */
export async function deriveMasterKey(
  password: string,
  salt?: Uint8Array,
  iterations: number = CRYPTO_CONSTANTS.ITERATIONS
): Promise<MasterKeyData> {
  try {
    // Generate salt if not provided
    const keySalt = salt || generateRandomBytes(CRYPTO_CONSTANTS.SALT_LENGTH);
    
    // Encode password
    const passwordBuffer = stringToBuffer(password);
    
    // Import password as key material
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      CRYPTO_CONSTANTS.PBKDF2_ALGORITHM,
      false,
      ['deriveKey']
    );
    
    // Derive AES-256 key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      CRYPTO_CONSTANTS.PBKDF2_DERIVE_PARAMS(keySalt),
      passwordKey,
      CRYPTO_CONSTANTS.MASTER_KEY_ALGORITHM,
      true, // Extractable for session storage
      ['encrypt', 'decrypt']
    );
    
    return {
      key,
      salt: keySalt,
      iterations,
      version: CRYPTO_CONSTANTS.ENCRYPTION_VERSION,
    };
  } catch (error) {
    throw new CryptoError(
      'Failed to derive master key',
      'KEY_GENERATION_FAILED',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Derive master key with explicit parameters
 * Use this when you have all parameters for reproducibility
 */
export async function deriveMasterKeyWithParams(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<MasterKeyData> {
  return deriveMasterKey(password, salt, iterations);
}

// ============================================
// AES-256-GCM ENCRYPTION
// ============================================

/**
 * Encrypt data using AES-256-GCM
 * @param data - Data to encrypt (string or ArrayBuffer)
 * @param masterKey - Master encryption key
 * @returns EncryptedData object
 */
export async function encryptData(
  data: string | ArrayBuffer,
  masterKey: MasterKeyData,
  options?: EncryptionOptions
): Promise<EncryptedData> {
  try {
    const version = options?.version || CRYPTO_CONSTANTS.ENCRYPTION_VERSION;
    
    // Generate random IV
    const iv = generateRandomBytes(CRYPTO_CONSTANTS.IV_LENGTH);
    
    // Convert data to buffer
    const dataBuffer = typeof data === 'string' ? stringToBuffer(data) : data;
    
    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as ArrayBuffer,
        tagLength: CRYPTO_CONSTANTS.AUTH_TAG_LENGTH * 8, // in bits
      },
      masterKey.key,
      dataBuffer
    );
    
    // Extract ciphertext and auth tag
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedBytes.slice(0, -CRYPTO_CONSTANTS.AUTH_TAG_LENGTH);
    const authTag = encryptedBytes.slice(-CRYPTO_CONSTANTS.AUTH_TAG_LENGTH);
    
    // Build result
    const result: EncryptedData = {
      encrypted: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
      authTag: arrayBufferToBase64(authTag),
      salt: options?.includeSalt !== false ? arrayBufferToBase64(masterKey.salt) : '',
      algorithm: 'AES-256-GCM',
      version,
      timestamp: Date.now(),
    };
    
    return result;
  } catch (error) {
    throw new CryptoError(
      'Encryption failed',
      'ENCRYPTION_FAILED',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData - EncryptedData object
 * @param masterKey - Master encryption key (must match encryption key)
 * @returns Decrypted string
 */
export async function decryptData(
  encryptedData: EncryptedData,
  masterKey: MasterKeyData
): Promise<string> {
  try {
    // Validate encrypted data
    if (!validateEncryptedData(encryptedData)) {
      throw new CryptoError(
        'Invalid encrypted data format',
        'CORRUPT_DATA'
      );
    }
    
    // Check version compatibility
    if (encryptedData.version > CRYPTO_CONSTANTS.ENCRYPTION_VERSION) {
      throw new CryptoError(
        `Unsupported encryption version: ${encryptedData.version}`,
        'INVALID_VERSION'
      );
    }
    
    // Decode components
    const ciphertext = base64ToUint8Array(encryptedData.encrypted);
    const iv = base64ToUint8Array(encryptedData.iv);
    const authTag = base64ToUint8Array(encryptedData.authTag);
    
    // Combine ciphertext and auth tag
    const encryptedBytes = new Uint8Array(ciphertext.length + authTag.length);
    encryptedBytes.set(ciphertext, 0);
    encryptedBytes.set(authTag, ciphertext.length);
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as ArrayBuffer,
        tagLength: CRYPTO_CONSTANTS.AUTH_TAG_LENGTH * 8,
      },
      masterKey.key,
      encryptedBytes
    );
    
    return bufferToString(decryptedBuffer);
  } catch (error) {
    if (error instanceof CryptoError) {
      throw error;
    }
    throw new CryptoError(
      'Decryption failed - data may be corrupted or wrong key',
      'DECRYPTION_FAILED',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Decrypt with automatic key derivation from password
 * Used when you have the salt stored with the encrypted data
 */
export async function decryptWithPassword(
  encryptedData: EncryptedData,
  password: string,
  iterations?: number
): Promise<string> {
  if (!encryptedData.salt) {
    throw new CryptoError(
      'No salt provided in encrypted data',
      'CORRUPT_DATA'
    );
  }
  
  const salt = base64ToUint8Array(encryptedData.salt);
  const masterKey = await deriveMasterKey(
    password,
    salt,
    iterations || CRYPTO_CONSTANTS.ITERATIONS
  );
  
  return decryptData(encryptedData, masterKey);
}

// ============================================
// FIELD-LEVEL ENCRYPTION
// ============================================

const SENSITIVE_FIELDS = [
  'accountNumber',
  'cardNumber',
  'cardCvv',
  'ifscCode',
  'swiftCode',
  'iban',
  'routingNumber',
  'policyNumber',
  'documentNumber',
  'passwordHash',
  'biometricCredentials',
  'apiKey',
] as const;

export type SensitiveFieldName = typeof SENSITIVE_FIELDS[number];

/**
 * Check if a field should be encrypted
 */
export function isSensitiveField(fieldName: string): fieldName is SensitiveFieldName {
  return SENSITIVE_FIELDS.includes(fieldName as SensitiveFieldName);
}

/**
 * Encrypt a single field value
 */
export async function encryptField(
  value: string,
  masterKey: MasterKeyData
): Promise<EncryptedField> {
  try {
    const iv = generateRandomBytes(CRYPTO_CONSTANTS.IV_LENGTH);
    const valueBuffer = stringToBuffer(value);
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as ArrayBuffer,
        tagLength: CRYPTO_CONSTANTS.AUTH_TAG_LENGTH * 8,
      },
      masterKey.key,
      valueBuffer
    );
    
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedBytes.slice(0, -CRYPTO_CONSTANTS.AUTH_TAG_LENGTH);
    const authTag = encryptedBytes.slice(-CRYPTO_CONSTANTS.AUTH_TAG_LENGTH);
    
    return {
      encryptedData: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
      authTag: arrayBufferToBase64(authTag),
      algorithm: 'AES-256-GCM',
      version: CRYPTO_CONSTANTS.ENCRYPTION_VERSION,
    };
  } catch (error) {
    throw new CryptoError(
      'Field encryption failed',
      'ENCRYPTION_FAILED',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Decrypt a single field value
 */
export async function decryptField(
  encryptedField: EncryptedField,
  masterKey: MasterKeyData
): Promise<string> {
  try {
    const ciphertext = base64ToUint8Array(encryptedField.encryptedData);
    const iv = base64ToUint8Array(encryptedField.iv);
    const authTag = base64ToUint8Array(encryptedField.authTag);
    
    const encryptedBytes = new Uint8Array(ciphertext.length + authTag.length);
    encryptedBytes.set(ciphertext, 0);
    encryptedBytes.set(authTag, ciphertext.length);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as ArrayBuffer,
        tagLength: CRYPTO_CONSTANTS.AUTH_TAG_LENGTH * 8,
      },
      masterKey.key,
      encryptedBytes
    );
    
    return bufferToString(decryptedBuffer);
  } catch (error) {
    throw new CryptoError(
      'Field decryption failed',
      'DECRYPTION_FAILED',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Encrypt multiple sensitive fields in an object
 * Returns a new object with sensitive fields encrypted
 */
export async function encryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToEncrypt: SensitiveFieldName[],
  masterKey: MasterKeyData
): Promise<T> {
  const result = { ...obj };
  
  for (const field of fieldsToEncrypt) {
    const value = obj[field];
    if (value !== undefined && value !== null && typeof value === 'string' && value.length > 0) {
      const encrypted = await encryptField(value, masterKey);
      (result as Record<string, unknown>)[field] = encrypted as unknown;
    }
  }
  
  return result;
}

/**
 * Decrypt multiple sensitive fields in an object
 * Returns a new object with sensitive fields decrypted
 */
export async function decryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToDecrypt: SensitiveFieldName[],
  masterKey: MasterKeyData
): Promise<T> {
  const result = { ...obj };
  
  for (const field of fieldsToDecrypt) {
    const value = obj[field];
    if (value !== undefined && value !== null && typeof value === 'object') {
      const encryptedField = value as EncryptedField;
      if (encryptedField.encryptedData && encryptedField.iv && encryptedField.authTag) {
        const decrypted = await decryptField(encryptedField, masterKey);
        (result as Record<string, unknown>)[field] = decrypted as unknown;
      }
    }
  }
  
  return result;
}

/**
 * Mask a sensitive value for display (e.g., ****1234)
 */
export function maskSensitiveValue(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) {
    return '*'.repeat(value?.length || 0);
  }
  
  const masked = '*'.repeat(value.length - visibleChars);
  const visible = value.slice(-visibleChars);
  return `${masked}${visible}`;
}

// ============================================
// BLOB/DOCUMENT ENCRYPTION
// ============================================

/**
 * Encrypt a Blob/File (for documents)
 * @param blob - File or Blob to encrypt
 * @param masterKey - Master encryption key
 * @returns EncryptedBlob object
 */
export async function encryptBlob(
  blob: Blob,
  masterKey: MasterKeyData,
  options?: { originalName?: string }
): Promise<EncryptedBlob> {
  try {
    // Read blob as array buffer
    const arrayBuffer = await blob.arrayBuffer();
    
    // Generate IV
    const iv = generateRandomBytes(CRYPTO_CONSTANTS.IV_LENGTH);
    
    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as ArrayBuffer,
        tagLength: CRYPTO_CONSTANTS.AUTH_TAG_LENGTH * 8,
      },
      masterKey.key,
      arrayBuffer
    );
    
    // Extract components
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedBytes.slice(0, -CRYPTO_CONSTANTS.AUTH_TAG_LENGTH);
    const authTag = encryptedBytes.slice(-CRYPTO_CONSTANTS.AUTH_TAG_LENGTH);
    
    return {
      encrypted: ciphertext.buffer as ArrayBuffer,
      iv,
      authTag,
      salt: masterKey.salt,
      originalType: blob.type || 'application/octet-stream',
      originalName: options?.originalName || 'encrypted-file',
      size: blob.size,
      algorithm: 'AES-256-GCM',
      version: CRYPTO_CONSTANTS.ENCRYPTION_VERSION,
      timestamp: Date.now(),
    };
  } catch (error) {
    throw new CryptoError(
      'Blob encryption failed',
      'ENCRYPTION_FAILED',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Decrypt a Blob/File
 * @param encryptedBlob - EncryptedBlob object
 * @param masterKey - Master encryption key
 * @returns Decrypted Blob
 */
export async function decryptBlob(
  encryptedBlob: EncryptedBlob,
  masterKey: MasterKeyData
): Promise<Blob> {
  try {
    // Combine ciphertext and auth tag
    const encryptedBytes = new Uint8Array(
      encryptedBlob.encrypted.byteLength + encryptedBlob.authTag.length
    );
    encryptedBytes.set(new Uint8Array(encryptedBlob.encrypted), 0);
    encryptedBytes.set(encryptedBlob.authTag, encryptedBlob.encrypted.byteLength);
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: encryptedBlob.iv as unknown as ArrayBuffer,
        tagLength: CRYPTO_CONSTANTS.AUTH_TAG_LENGTH * 8,
      },
      masterKey.key,
      encryptedBytes
    );
    
    return new Blob([decryptedBuffer], { type: encryptedBlob.originalType });
  } catch (error) {
    throw new CryptoError(
      'Blob decryption failed',
      'DECRYPTION_FAILED',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Serialize encrypted blob for storage
 */
export function serializeEncryptedBlob(encryptedBlob: EncryptedBlob): string {
  const data = {
    encrypted: arrayBufferToBase64(encryptedBlob.encrypted),
    iv: arrayBufferToBase64(encryptedBlob.iv),
    authTag: arrayBufferToBase64(encryptedBlob.authTag),
    salt: arrayBufferToBase64(encryptedBlob.salt),
    originalType: encryptedBlob.originalType,
    originalName: encryptedBlob.originalName,
    size: encryptedBlob.size,
    algorithm: encryptedBlob.algorithm,
    version: encryptedBlob.version,
    timestamp: encryptedBlob.timestamp,
  };
  return JSON.stringify(data);
}

/**
 * Deserialize encrypted blob from storage
 */
export function deserializeEncryptedBlob(serialized: string): EncryptedBlob {
  try {
    const data = JSON.parse(serialized);
    return {
      encrypted: base64ToUint8Array(data.encrypted).buffer as ArrayBuffer,
      iv: base64ToUint8Array(data.iv),
      authTag: base64ToUint8Array(data.authTag),
      salt: base64ToUint8Array(data.salt),
      originalType: data.originalType,
      originalName: data.originalName,
      size: data.size,
      algorithm: data.algorithm,
      version: data.version,
      timestamp: data.timestamp,
    };
  } catch (error) {
    throw new CryptoError(
      'Failed to deserialize encrypted blob',
      'CORRUPT_DATA',
      error instanceof Error ? error : undefined
    );
  }
}

// ============================================
// KEY MANAGEMENT & SECURE STORAGE
// ============================================

const KEY_STORAGE_PREFIX = 'finvault_enc_';
const SESSION_KEY_EXPIRY = 30 * 60 * 1000; // 30 minutes

interface StoredKeyData {
  keyData: JsonWebKey;
  salt: string;
  iterations: number;
  version: number;
  createdAt: number;
  expiresAt?: number;
}

/**
 * Export a CryptoKey to JWK format for storage
 */
async function exportKeyToJWK(key: CryptoKey): Promise<JsonWebKey> {
  return await crypto.subtle.exportKey('jwk', key);
}

/**
 * Import a CryptoKey from JWK format
 */
async function importKeyFromJWK(jwk: JsonWebKey): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    CRYPTO_CONSTANTS.MASTER_KEY_ALGORITHM,
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Store master key securely (exported as JWK)
 * Note: In production, consider using a more secure storage mechanism
 */
export async function storeMasterKey(
  keyId: string,
  masterKey: MasterKeyData,
  isSession: boolean = false
): Promise<void> {
  try {
    const jwk = await exportKeyToJWK(masterKey.key);
    
    const storedData: StoredKeyData = {
      keyData: jwk,
      salt: arrayBufferToBase64(masterKey.salt),
      iterations: masterKey.iterations,
      version: masterKey.version,
      createdAt: Date.now(),
    };

    if (isSession) {
      storedData.expiresAt = Date.now() + SESSION_KEY_EXPIRY;
    }
    
    // Use sessionStorage for session keys, localStorage for persistent
    const storage = isSession ? sessionStorage : localStorage;
    storage.setItem(`${KEY_STORAGE_PREFIX}${keyId}`, JSON.stringify(storedData));
  } catch (error) {
    throw new CryptoError(
      'Failed to store master key',
      'STORAGE_ERROR',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Retrieve stored master key
 */
export async function retrieveMasterKey(keyId: string): Promise<MasterKeyData | null> {
  try {
    // Try session storage first
    let storedDataStr = sessionStorage.getItem(`${KEY_STORAGE_PREFIX}${keyId}`);
    let isSession = true;
    
    // Fall back to local storage
    if (!storedDataStr) {
      storedDataStr = localStorage.getItem(`${KEY_STORAGE_PREFIX}${keyId}`);
      isSession = false;
    }
    
    if (!storedDataStr) {
      return null;
    }
    
    const storedData: StoredKeyData = JSON.parse(storedDataStr);
    
    // Check expiry for session keys
    if (isSession && storedData.expiresAt && Date.now() > storedData.expiresAt) {
      sessionStorage.removeItem(`${KEY_STORAGE_PREFIX}${keyId}`);
      return null;
    }
    
    const key = await importKeyFromJWK(storedData.keyData);
    
    return {
      key,
      salt: base64ToUint8Array(storedData.salt),
      iterations: storedData.iterations,
      version: storedData.version,
    };
  } catch (error) {
    throw new CryptoError(
      'Failed to retrieve master key',
      'STORAGE_ERROR',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Remove stored master key
 */
export function removeMasterKey(keyId: string): void {
  sessionStorage.removeItem(`${KEY_STORAGE_PREFIX}${keyId}`);
  localStorage.removeItem(`${KEY_STORAGE_PREFIX}${keyId}`);
}

/**
 * Clear all stored keys
 */
export function clearAllKeys(): void {
  // Clear session storage
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(KEY_STORAGE_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  }
  
  // Clear local storage
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(KEY_STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Check if a key exists in storage
 */
export function hasMasterKey(keyId: string): boolean {
  return !!(
    sessionStorage.getItem(`${KEY_STORAGE_PREFIX}${keyId}`) ||
    localStorage.getItem(`${KEY_STORAGE_PREFIX}${keyId}`)
  );
}

// ============================================
// EXPORT/IMPORT FOR BACKUP
// ============================================

/**
 * Encrypt data for export (backup)
 * @param data - Data to export
 * @param password - Password for encryption
 * @param profileId - Profile identifier
 * @returns EncryptedExport object
 */
export async function encryptForExport(
  data: Record<string, unknown>,
  password: string,
  profileId: string
): Promise<EncryptedExport> {
  try {
    // Derive key from password
    const masterKey = await deriveMasterKey(password);
    
    // Serialize data
    const jsonData = JSON.stringify(data);
    
    // Encrypt
    const encryptedData = await encryptData(jsonData, masterKey, {
      includeSalt: true,
    });
    
    // Calculate checksum
    const checksum = await computeHash(jsonData);
    
    // Count records
    const recordCounts: Record<string, number> = {};
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        recordCounts[key] = value.length;
      }
    }
    
    return {
      version: CRYPTO_CONSTANTS.ENCRYPTION_VERSION,
      exportDate: new Date().toISOString(),
      encryptedData,
      metadata: {
        profileId,
        recordCounts,
        checksum,
      },
    };
  } catch (error) {
    throw new CryptoError(
      'Export encryption failed',
      'EXPORT_FAILED',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Decrypt exported data for import
 * @param encryptedExport - EncryptedExport object
 * @param password - Password for decryption
 * @returns Decrypted data
 */
export async function decryptForImport<T>(
  encryptedExport: EncryptedExport,
  password: string
): Promise<T> {
  try {
    // Check version compatibility
    if (encryptedExport.version > CRYPTO_CONSTANTS.ENCRYPTION_VERSION) {
      throw new CryptoError(
        `Unsupported export version: ${encryptedExport.version}`,
        'INVALID_VERSION'
      );
    }
    
    // Decrypt
    const decryptedJson = await decryptWithPassword(
      encryptedExport.encryptedData,
      password
    );
    
    // Verify checksum
    const currentChecksum = await computeHash(decryptedJson);
    if (currentChecksum !== encryptedExport.metadata.checksum) {
      throw new CryptoError(
        'Import data integrity check failed',
        'CORRUPT_DATA'
      );
    }
    
    return JSON.parse(decryptedJson) as T;
  } catch (error) {
    if (error instanceof CryptoError) {
      throw error;
    }
    throw new CryptoError(
      'Import decryption failed',
      'IMPORT_FAILED',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Serialize encrypted export for file download
 */
export function serializeExport(encryptedExport: EncryptedExport): string {
  return JSON.stringify(encryptedExport, null, 2);
}

/**
 * Deserialize encrypted export from file
 */
export function deserializeExport(serialized: string): EncryptedExport {
  try {
    return JSON.parse(serialized) as EncryptedExport;
  } catch (error) {
    throw new CryptoError(
      'Invalid export file format',
      'IMPORT_FAILED',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Validate export file before import
 */
export function validateExportFile(data: unknown): data is EncryptedExport {
  if (!data || typeof data !== 'object') return false;
  
  const exp = data as Partial<EncryptedExport>;
  return (
    typeof exp.version === 'number' &&
    typeof exp.exportDate === 'string' &&
    exp.encryptedData !== undefined &&
    typeof exp.metadata === 'object' &&
    typeof exp.metadata?.profileId === 'string' &&
    typeof exp.metadata?.checksum === 'string'
  );
}

// ============================================
// HIGHER-LEVEL UTILITY FUNCTIONS
// ============================================

/**
 * Initialize crypto session with PIN/password
 * @param pin - User's PIN
 * @param keyId - Optional custom key ID
 * @param isSession - Whether to store as session-only key
 * @returns Generated key ID
 */
export async function initializeCryptoSession(
  pin: string,
  keyId?: string,
  isSession: boolean = true
): Promise<string> {
  const id = keyId || generateKeyId();
  const masterKey = await deriveMasterKey(pin);
  await storeMasterKey(id, masterKey, isSession);
  return id;
}

/**
 * Verify PIN and get master key
 * @param pin - User's PIN
 * @param keyId - Key ID to retrieve
 * @param profileSalt - Optional salt from user profile (base64 encoded) for re-deriving key
 * @returns MasterKeyData if successful
 */
export async function verifyPINAndGetKey(
  pin: string,
  keyId: string,
  profileSalt?: string
): Promise<MasterKeyData> {
  // First try to get stored key
  const storedKey = await retrieveMasterKey(keyId);

  if (storedKey) {
    // We have a stored key, but we should verify the PIN works
    // Try to create a new key with the PIN and compare
    const testKey = await deriveMasterKey(pin, storedKey.salt, storedKey.iterations);

    // Export both keys and compare
    const storedJWK = await exportKeyToJWK(storedKey.key);
    const testJWK = await exportKeyToJWK(testKey.key);

    if (JSON.stringify(storedJWK) === JSON.stringify(testJWK)) {
      return storedKey;
    }
    throw new CryptoError('Invalid PIN', 'WRONG_PIN');
  }

  // No stored key - re-derive using profile salt if available
  if (profileSalt) {
    const salt = base64ToUint8Array(profileSalt);
    const derivedKey = await deriveMasterKey(pin, salt, CRYPTO_CONSTANTS.ITERATIONS);

    // Store the newly derived key for future use
    await storeMasterKey(keyId, derivedKey, true);

    return derivedKey;
  }

  throw new CryptoError('Invalid PIN', 'WRONG_PIN');
}

/**
 * Re-encrypt data with new key (for key rotation)
 */
export async function reEncryptData(
  encryptedData: EncryptedData,
  oldKey: MasterKeyData,
  newKey: MasterKeyData
): Promise<EncryptedData> {
  const decrypted = await decryptData(encryptedData, oldKey);
  return await encryptData(decrypted, newKey);
}

/**
 * Change PIN/password (re-encrypts everything)
 */
export async function changePIN(
  oldPin: string,
  newPin: string,
  keyId: string,
  profileSalt?: string
): Promise<MasterKeyData> {
  // Verify old PIN
  await verifyPINAndGetKey(oldPin, keyId, profileSalt);
  
  // Derive new key
  const newKey = await deriveMasterKey(newPin);
  
  // Store new key
  await storeMasterKey(keyId, newKey, false);
  
  return newKey;
}

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Secure random PIN generator
 */
export function generateSecurePIN(length: number = 4): string {
  const digits = '0123456789';
  let pin = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    pin += digits[(array[i] ?? 0) % 10];
  }
  
  return pin;
}

/**
 * Check if password/PIN meets minimum security requirements
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 4) {
    errors.push('PIN must be at least 4 digits');
  }
  
  if (password.length > 6 && password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (password.length >= 8) {
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain a special character');
    }
  }
  
  // Check for common sequences
  if (/^[0-9]{4}$/.test(password) && 
      (password === '0000' || 
       password === '1234' || 
       password === '1111')) {
    errors.push('PIN is too common');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Secure comparison of two values (timing-safe)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Zero out sensitive data from memory (best effort)
 */
export function zeroOutBuffer(buffer: Uint8Array): void {
  buffer.fill(0);
}

// ============================================
// INTEGRATION HELPERS
// ============================================

/**
 * Get account fields that should be encrypted
 */
export function getAccountSensitiveFields(): SensitiveFieldName[] {
  return ['accountNumber', 'ifscCode', 'swiftCode', 'iban', 'routingNumber'];
}

/**
 * Get credit card fields that should be encrypted
 */
export function getCreditCardSensitiveFields(): SensitiveFieldName[] {
  return ['cardNumber'];
}

/**
 * Get document fields that should be encrypted
 */
export function getDocumentSensitiveFields(): SensitiveFieldName[] {
  return ['documentNumber'];
}

/**
 * Get insurance fields that should be encrypted
 */
export function getInsuranceSensitiveFields(): SensitiveFieldName[] {
  return ['policyNumber'];
}

// ============================================
// DEFAULT EXPORT
// ============================================

const cryptoUtils = {
  // Constants
  CRYPTO_CONSTANTS,

  // Error handling
  CryptoError,

  // Utilities
  arrayBufferToBase64,
  base64ToUint8Array,
  generateRandomBytes,
  stringToBuffer,
  bufferToString,
  generateKeyId,
  computeHash,
  validateEncryptedData,

  // Key generation
  deriveMasterKey,
  deriveMasterKeyWithParams,

  // Encryption/Decryption
  encryptData,
  decryptData,
  decryptWithPassword,

  // Field-level encryption
  encryptField,
  decryptField,
  encryptSensitiveFields,
  decryptSensitiveFields,
  isSensitiveField,
  maskSensitiveValue,

  // Blob encryption
  encryptBlob,
  decryptBlob,
  serializeEncryptedBlob,
  deserializeEncryptedBlob,

  // Key management
  storeMasterKey,
  retrieveMasterKey,
  removeMasterKey,
  clearAllKeys,
  hasMasterKey,

  // Export/Import
  encryptForExport,
  decryptForImport,
  serializeExport,
  deserializeExport,
  validateExportFile,

  // High-level utilities
  initializeCryptoSession,
  verifyPINAndGetKey,
  reEncryptData,
  changePIN,

  // Security
  generateSecurePIN,
  validatePasswordStrength,
  secureCompare,
  zeroOutBuffer,

  // Integration helpers
  getAccountSensitiveFields,
  getCreditCardSensitiveFields,
  getDocumentSensitiveFields,
  getInsuranceSensitiveFields,
}

export default cryptoUtils
