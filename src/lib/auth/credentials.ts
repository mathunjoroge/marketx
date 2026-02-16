import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { decrypt, EncryptionError } from '@/lib/encryption';
import { AlpacaBrokerService, alpacaBroker as systemAlpaca } from '@/lib/brokers/alpaca';
import { MarketDataAggregator, marketData as systemMarketData } from '@/lib/providers/aggregator';
import logger from '@/lib/logger';

export interface UserServices {
    alpaca: AlpacaBrokerService;
    marketData: MarketDataAggregator;
    ipinfoToken?: string;
}

/**
 * Safely decrypt a credential field.
 * Returns empty string on failure and logs the error for observability.
 */
async function safeDecrypt(value: string | null | undefined, fieldName: string): Promise<string> {
    if (!value) return '';
    try {
        return await decrypt(value);
    } catch (error) {
        logger.error(`Failed to decrypt credential: ${fieldName}`, {
            error: error instanceof EncryptionError ? error.message : String(error),
        });
        return '';
    }
}

/**
 * Retrieves instantiated services configured with the current user's credentials.
 * Falls back to system-wide default services (using .env) if no user credentials found.
 */
export async function getUserServices(): Promise<UserServices> {
    const session = await auth();

    // Default return system services
    const result: UserServices = {
        alpaca: systemAlpaca,
        marketData: systemMarketData,
    };

    if (!session || !session.user?.id) {
        return result;
    }

    return getUserServicesById(session.user.id);
}

/**
 * Retrieves instantiated services for a specific user ID.
 * Used by background services (e.g., OrderMonitorService) that don't have a session context.
 * Falls back to system-wide services if credentials are missing or invalid.
 */
export async function getUserServicesById(userId: string): Promise<UserServices> {
    const result: UserServices = {
        alpaca: systemAlpaca,
        marketData: systemMarketData,
    };

    try {
        const credentials = await prisma.userCredentials.findUnique({
            where: { userId },
        });

        if (!credentials) {
            return result;
        }

        // Decrypt keys in parallel
        const [
            alpacaKeyId,
            alpacaSecret,
            fmpKey,
            finnhubKey,
            eodhdKey,
            ipinfoToken
        ] = await Promise.all([
            safeDecrypt(credentials.alpacaKeyId, 'alpacaKeyId'),
            safeDecrypt(credentials.alpacaSecret, 'alpacaSecret'),
            safeDecrypt(credentials.fmpApiKey, 'fmpApiKey'),
            safeDecrypt(credentials.finnhubApiKey, 'finnhubApiKey'),
            safeDecrypt(credentials.eodhdApiKey, 'eodhdApiKey'),
            safeDecrypt(credentials.ipinfoToken, 'ipinfoToken'),
        ]);

        // Instantiate User-Specific Alpaca Broker
        if (alpacaKeyId && alpacaSecret) {
            result.alpaca = new AlpacaBrokerService({
                keyId: alpacaKeyId,
                secretKey: alpacaSecret,
                paper: credentials.alpacaPaper
            });
        }

        // Only create a new MarketDataAggregator if the user has custom keys.
        // Otherwise we'd create identical instances to the system default.
        if (fmpKey || finnhubKey || eodhdKey) {
            result.marketData = new MarketDataAggregator({
                fmp: fmpKey || undefined,
                finnhub: finnhubKey || undefined,
                eodhd: eodhdKey || undefined,
            });
        }

        if (ipinfoToken) {
            result.ipinfoToken = ipinfoToken;
        }

        return result;
    } catch (error) {
        logger.error('Error fetching user services', { userId, error });
        return result; // Fallback to system defaults on error
    }
}
