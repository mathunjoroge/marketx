/**
 * API Key Encryption Utilities
 * 
 * Re-exports from the unified encryption module.
 * This file exists for backward compatibility with existing imports.
 */

export {
    encrypt as encryptApiKey,
    decrypt as decryptApiKey,
    generateEncryptionKey,
    isValidEncryptionKey as validateEncryptionKey,
    EncryptionError,
} from '@/lib/encryption';
