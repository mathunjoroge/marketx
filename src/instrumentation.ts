/**
 * Instrumentation — Next.js Startup Hook
 * 
 * Validates required environment variables and reports configuration status.
 * This runs once when the Next.js server starts.
 */

export async function register() {
    // Only validate on the server
    if (typeof window !== 'undefined') return;

    const required = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'ENCRYPTION_KEY',
    ];

    const recommended = [
        'NEXTAUTH_URL',
        'ALPACA_API_KEY_ID',
        'ALPACA_API_SECRET',
    ];

    const missing: string[] = [];
    const missingRecommended: string[] = [];

    for (const key of required) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    for (const key of recommended) {
        if (!process.env[key]) {
            missingRecommended.push(key);
        }
    }

    if (missing.length > 0) {
        console.error(
            `\n❌ FATAL: Missing required environment variables:\n` +
            missing.map(k => `   - ${k}`).join('\n') +
            `\n\nThe application may not function correctly without these.\n`
        );
    }

    if (missingRecommended.length > 0) {
        console.warn(
            `\n⚠️  Missing recommended environment variables:\n` +
            missingRecommended.map(k => `   - ${k}`).join('\n') +
            `\n`
        );
    }

    if (missing.length === 0 && missingRecommended.length === 0) {
        console.info('✅ All environment variables configured');
    }
}
