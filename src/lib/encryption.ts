/**
 * Unified Encryption Module (AES-256-GCM)
 * 
 * Single source of truth for all encryption/decryption in the application.
 * Uses Node.js crypto with explicit auth-tag handling for maximum security.
 * 
 * Format: iv:ciphertext:authTag (all hex-encoded)
 */

import crypto from 'crypto';
import logger from './logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

// ── Custom error class for encryption failures ──────────────────────────
export class EncryptionError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = 'EncryptionError';
    }
}

// ── Startup validation — fail fast if key is missing or malformed ────────
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY || '';

function validateEncryptionKey(key: string): Buffer {
    if (!key) {
        throw new EncryptionError(
            'ENCRYPTION_KEY environment variable is not set. ' +
            'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
    }
    try {
        const buffer = Buffer.from(key, 'hex');
        if (buffer.length !== KEY_LENGTH) {
            throw new EncryptionError(
                `ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes), ` +
                `got ${key.length} characters (${buffer.length} bytes)`
            );
        }
        return buffer;
    } catch (error) {
        if (error instanceof EncryptionError) throw error;
        throw new EncryptionError('ENCRYPTION_KEY contains invalid hex characters', error);
    }
}

let _keyBuffer: Buffer | null = null;

function getKeyBuffer(): Buffer {
    if (!_keyBuffer) {
        _keyBuffer = validateEncryptionKey(ENCRYPTION_KEY_HEX);
    }
    return _keyBuffer;
}

// ── Encrypt ──────────────────────────────────────────────────────────────
/**
 * Encrypt a plaintext string using AES-256-GCM.
 * @returns Hex-encoded string in format `iv:ciphertext:authTag`
 * @throws {EncryptionError} if encryption fails
 */
export async function encrypt(plaintext: string): Promise<string> {
    if (!plaintext) return '';

    try {
        const key = getKeyBuffer();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
    } catch (error) {
        if (error instanceof EncryptionError) throw error;
        logger.error('Encryption failed', { error });
        throw new EncryptionError('Failed to encrypt data', error);
    }
}

// ── Decrypt ──────────────────────────────────────────────────────────────
/**
 * Decrypt a ciphertext string encrypted with `encrypt()`.
 * @param ciphertext Hex-encoded string in format `iv:ciphertext:authTag`
 * @returns Decrypted plaintext
 * @throws {EncryptionError} if decryption fails (NEVER silently returns empty)
 */
export async function decrypt(ciphertext: string): Promise<string> {
    if (!ciphertext) return '';

    try {
        const key = getKeyBuffer();
        const parts = ciphertext.split(':');

        if (parts.length !== 3) {
            throw new EncryptionError(
                `Invalid encrypted format: expected 3 parts (iv:data:tag), got ${parts.length}`
            );
        }

        const [ivHex, encryptedHex, authTagHex] = parts;

        const iv = Buffer.from(ivHex, 'hex');
        const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedBuffer);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    } catch (error) {
        if (error instanceof EncryptionError) throw error;
        logger.error('Decryption failed', { error });
        throw new EncryptionError('Failed to decrypt data', error);
    }
}

// ── Legacy aliases (used by auth/encryption.ts consumers) ────────────────
export const encryptApiKey = encrypt;
export const decryptApiKey = decrypt;

// ── Utility ──────────────────────────────────────────────────────────────
/**
 * Generate a random encryption key (for initial setup).
 * @returns 64-character hex string (32 bytes)
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Validate that a given hex string is a valid encryption key.
 */
export function isValidEncryptionKey(key: string): boolean {
    try {
        validateEncryptionKey(key);
        return true;
    } catch {
        return false;
    }
}
