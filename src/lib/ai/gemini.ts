import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '@/lib/logger';

const globalApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.AI_API_KEY || process.env.GOOGLE_API_KEY;

if (!globalApiKey) {
    logger.warn('AI_API_KEY or GOOGLE_API_KEY is not defined. AI features missing global fallback.');
}

const globalGenAI = globalApiKey ? new GoogleGenerativeAI(globalApiKey) : null;

export interface AISuggestion {
    symbol: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    reason: string;
    confidence: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    allocationPercent: number;
}

export interface AIAdvice {
    summary: string;
    recommendations: string[];
    tradingSuggestions: AISuggestion[];
}

export async function generateFinancialAdvice(
    prompt: string,
    systemPrompt: string = "You are a professional financial advisor.",
    userApiKey?: string | null
): Promise<string> {
    const genAI = userApiKey ? new GoogleGenerativeAI(userApiKey) : globalGenAI;
    if (!genAI) {
        throw new Error('AI service is not configured and no user API key provided.');
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const fullPrompt = `${systemPrompt}\n\n${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Gemini API Error: ${errorMessage}`);
        throw new Error('Failed to generate AI advice.');
    }
}

export interface AffiliateProduct {
    id: string;
    name: string;
    description: string;
    category: string;
    provider: string;
    affiliateUrl: string;
}

export interface AIAdvice {
    summary: string;
    recommendations: string[];
    tradingSuggestions: AISuggestion[];
    productSuggestions?: (AffiliateProduct & { reason: string })[];
}

interface FinancialContext {
    financials?: {
        recentTransactions?: {
            description: string;
            [key: string]: unknown;
        }[];
    };
    [key: string]: unknown;
}

/**
 * Sanitizes financial context by masking potentially sensitive PII.
 * Focuses on transaction descriptions which often contain names or personal info.
 */
function maskPII(context: FinancialContext): FinancialContext {
    if (!context) return context;

    const maskedContext: FinancialContext = JSON.parse(JSON.stringify(context));

    if (maskedContext.financials && maskedContext.financials.recentTransactions) {
        maskedContext.financials.recentTransactions = maskedContext.financials.recentTransactions.map(t => ({
            ...t,
            // Mask description but keep enough for categorization (e.g. "Transfer from John Doe" -> "Transfer from ****")
            description: t.description ? t.description.replace(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g, '****') : t.description
        }));
    }

    return maskedContext;
}

export async function generateStructuredAdvice(
    context: FinancialContext, // Financial context
    availableProducts: AffiliateProduct[] = [],
    userApiKey?: string | null
): Promise<AIAdvice> {
    const maskedContext = maskPII(context);

    const genAI = userApiKey ? new GoogleGenerativeAI(userApiKey) : globalGenAI;
    if (!genAI) {
        // Return mock data if no key, for dev/test
        logger.warn('Returning mock AI advice due to missing API key.');
        return {
            summary: "AI services are currently unavailable. This is a placeholder summary.",
            recommendations: ["Ensure you have an emergency fund.", "Review your monthly subscriptions."],
            tradingSuggestions: [
                { symbol: "SPY", action: "BUY", reason: "Diversified S&P 500 exposure (Mock)", confidence: 0.8, riskLevel: "MEDIUM", allocationPercent: 10 },
                { symbol: "BND", action: "HOLD", reason: "Stability in bonds (Mock)", confidence: 0.9, riskLevel: "LOW", allocationPercent: 5 }
            ],
            productSuggestions: availableProducts.slice(0, 2).map(p => ({
                ...p,
                reason: "Matches your financial profile (Mock Recommendation)"
            }))
        };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });

    const prompt = `
        Analyze the following user financial context and provide trading advice.
        
        Context:
        ${JSON.stringify(maskedContext, null, 2)}

        Available Affiliate Products:
        ${JSON.stringify(availableProducts, null, 2)}
        
        Task:
        1. Summarize their financial health (1 sentence).
        2. Give 3 actionable personal finance tips.
        3. Suggest 3 specific trading assets (Stocks, ETFs, Crypto) based on their risk profile (implied or explicit).
        4. Recommend up to 2 specific products from the "Available Affiliate Products" list that would benefit the user based on their context. Only recommend if relevant.
        
        Return JSON with this schema:
        {
          "summary": "string",
          "recommendations": ["string", "string", "string"],
          "tradingSuggestions": [
            { "symbol": "string (valid ticker)", "action": "BUY | SELL | HOLD", "reason": "string", "confidence": number (0-1), "riskLevel": "LOW | MEDIUM | HIGH", "allocationPercent": number (0-100) }
          ],
          "productSuggestions": [
            { "id": "string (must match one of the available product IDs)", "reason": "why this product is good for them" }
          ]
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        // Map derived product suggestions back to full product objects
        const enrichedProducts = parsed.productSuggestions?.map((s: { id: string; reason: string }) => {
            const product = availableProducts.find(p => p.id === s.id);
            return product ? { ...product, reason: s.reason } : null;
        }).filter((p: unknown): p is (AffiliateProduct & { reason: string }) => p !== null) || [];

        return {
            ...parsed,
            productSuggestions: enrichedProducts
        } as AIAdvice;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('DEBUG - Gemini Error:', error);
        logger.error(`Gemini Structured API Error: ${errorMessage}`, { error, stack: error instanceof Error ? error.stack : undefined });
        return {
            summary: "Error generating advice.",
            recommendations: [],
            tradingSuggestions: []
        };
    }
}
