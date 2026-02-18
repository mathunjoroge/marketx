import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { encrypt, decrypt, EncryptionError } from '@/lib/encryption';
import { z } from 'zod';
import logger from '@/lib/logger';

const credentialsSchema = z.object({
    alpacaKeyId: z.string().optional(),
    alpacaSecret: z.string().optional(),
    fmpApiKey: z.string().optional(),
    finnhubApiKey: z.string().optional(),
    eodhdApiKey: z.string().optional(),
    ipinfoToken: z.string().optional(),
    googleApiKey: z.string().optional(),
});

/**
 * Mask a secret key for safe display.
 * Shows only the last 4 characters, rest replaced with asterisks.
 * e.g., "PKABCDEFGH123456" → "************3456"
 */
function maskKey(key: string): string {
    if (!key || key.length <= 4) return key ? '****' : '';
    return '*'.repeat(key.length - 4) + key.slice(-4);
}

/**
 * Safely decrypt a credential field. Returns the decrypted value or null on failure.
 * Logs the error for observability without silently swallowing it.
 */
async function safeDecrypt(value: string | null | undefined, fieldName: string): Promise<string> {
    if (!value) return '';
    try {
        return await decrypt(value);
    } catch (error) {
        if (error instanceof EncryptionError) {
            logger.error(`Failed to decrypt ${fieldName}`, { error: error.message });
        } else {
            logger.error(`Unexpected error decrypting ${fieldName}`, { error });
        }
        // Return empty string but LOG the failure — callers see "no credential" but we have visibility
        return '';
    }
}

export async function GET(req: Request) {
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const credentials = await prisma.userCredentials.findUnique({
            where: { userId: session.user.id },
        });

        if (!credentials) {
            return NextResponse.json({});
        }

        // Decrypt keys in parallel for efficiency
        const [alpacaKeyId, fmpApiKey, finnhubApiKey, eodhdApiKey, ipinfoToken, googleApiKey] = await Promise.all([
            safeDecrypt(credentials.alpacaKeyId, 'alpacaKeyId'),
            safeDecrypt(credentials.fmpApiKey, 'fmpApiKey'),
            safeDecrypt(credentials.finnhubApiKey, 'finnhubApiKey'),
            safeDecrypt(credentials.eodhdApiKey, 'eodhdApiKey'),
            safeDecrypt(credentials.ipinfoToken, 'ipinfoToken'),
            safeDecrypt(credentials.googleApiKey, 'googleApiKey'),
        ]);

        // Return MASKED keys — never send full secrets over HTTP
        return NextResponse.json({
            alpacaKeyId: maskKey(alpacaKeyId),
            hasAlpacaSecret: !!credentials.alpacaSecret,
            fmpApiKey: maskKey(fmpApiKey),
            finnhubApiKey: maskKey(finnhubApiKey),
            eodhdApiKey: maskKey(eodhdApiKey),
            ipinfoToken: maskKey(ipinfoToken),
            googleApiKey: maskKey(googleApiKey),
        });
    } catch (error) {
        logger.error('Error fetching credentials', { error });
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const result = credentialsSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ message: 'Invalid input', errors: result.error.issues }, { status: 400 });
        }

        const { alpacaKeyId, alpacaSecret, fmpApiKey, finnhubApiKey, eodhdApiKey, ipinfoToken, googleApiKey } = result.data;

        // Encrypt values
        const updateData: any = {};
        if (alpacaKeyId) updateData.alpacaKeyId = await encrypt(alpacaKeyId);
        if (alpacaSecret) updateData.alpacaSecret = await encrypt(alpacaSecret);
        if (fmpApiKey) updateData.fmpApiKey = await encrypt(fmpApiKey);
        if (finnhubApiKey) updateData.finnhubApiKey = await encrypt(finnhubApiKey);
        if (eodhdApiKey) updateData.eodhdApiKey = await encrypt(eodhdApiKey);
        if (ipinfoToken) updateData.ipinfoToken = await encrypt(ipinfoToken);
        if (googleApiKey) updateData.googleApiKey = await encrypt(googleApiKey);

        const credentials = await prisma.userCredentials.upsert({
            where: { userId: session.user.id },
            update: updateData,
            create: {
                userId: session.user.id!,
                alpacaKeyId: alpacaKeyId ? await encrypt(alpacaKeyId) : '',
                alpacaSecret: alpacaSecret ? await encrypt(alpacaSecret) : '',
                fmpApiKey: fmpApiKey ? await encrypt(fmpApiKey) : null,
                finnhubApiKey: finnhubApiKey ? await encrypt(finnhubApiKey) : null,
                eodhdApiKey: eodhdApiKey ? await encrypt(eodhdApiKey) : null,
                ipinfoToken: ipinfoToken ? await encrypt(ipinfoToken) : null,
                googleApiKey: googleApiKey ? await encrypt(googleApiKey) : null,
            },
        });

        return NextResponse.json({ message: 'Credentials updated successfully' });
    } catch (error) {
        logger.error('Error updating credentials', { error });
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
