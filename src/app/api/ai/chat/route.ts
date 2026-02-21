import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generateFinancialAdvice } from '@/lib/ai/gemini';
import { rateLimit } from '@/lib/rate-limit';
import { getUserSubscriptionTier, TIER_CONFIGS } from '@/lib/subscription';
import logger from '@/lib/logger';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are MarketX AI Advisor, a helpful and knowledgeable financial assistant.
You answer general financial questions clearly and concisely. You cover topics like:
- Investment strategies (dollar-cost averaging, diversification, etc.)
- Market concepts (P/E ratio, market cap, bonds vs stocks, etc.)
- Personal finance (budgeting, emergency funds, debt management)
- Crypto and forex basics
- Risk management

Guidelines:
- Be concise but thorough. Use bullet points when listing items.
- If asked about specific stock picks or financial advice, add a disclaimer that this is for educational purposes only and not personalized financial advice.
- Format your responses in a readable way with short paragraphs.
- If the question is completely unrelated to finance, politely redirect to financial topics.`;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id!;
        const body = await req.json();
        const { message, sessionId } = body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ message: 'Message is required' }, { status: 400 });
        }

        if (message.length > 2000) {
            return NextResponse.json({ message: 'Message too long (max 2000 characters)' }, { status: 400 });
        }

        // Rate limiting (shares AI quota with advisor)
        const tier = await getUserSubscriptionTier(userId);
        const config = TIER_CONFIGS[tier];
        const limitResult = await rateLimit(`ai-advisor:${userId}`, config.aiCallLimit, 86400);

        if (!limitResult.success) {
            return NextResponse.json({
                message: `You've reached your daily AI limit on the ${tier} plan. Upgrade for more.`,
                limit: limitResult.limit,
                remaining: 0,
                reset: limitResult.reset,
            }, { status: 429 });
        }

        // Get or create session
        let chatSession;
        if (sessionId) {
            chatSession = await prisma.aICFOSession.findFirst({
                where: { id: sessionId, userId },
            });
        }

        if (!chatSession) {
            chatSession = await prisma.aICFOSession.create({
                data: {
                    userId,
                    title: message.slice(0, 80),
                },
            });
        }

        // Get user credentials for their API key
        const creds = await prisma.userCredentials.findUnique({
            where: { userId },
            select: { googleApiKey: true },
        });

        // Save user message
        await prisma.aICFOMessage.create({
            data: {
                sessionId: chatSession.id,
                role: 'user',
                content: message.trim(),
            },
        });

        // Fetch recent conversation context for continuity (last 6 messages)
        const recentMessages = await prisma.aICFOMessage.findMany({
            where: { sessionId: chatSession.id },
            orderBy: { timestamp: 'desc' },
            take: 6,
        });

        const conversationContext = recentMessages
            .reverse()
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n\n');

        const fullPrompt = `${conversationContext}\n\nUser: ${message.trim()}\n\nAssistant:`;

        // Generate AI response
        const aiResponse = await generateFinancialAdvice(
            fullPrompt,
            SYSTEM_PROMPT,
            creds?.googleApiKey
        );

        // Save AI response
        await prisma.aICFOMessage.create({
            data: {
                sessionId: chatSession.id,
                role: 'assistant',
                content: aiResponse,
            },
        });

        return NextResponse.json({
            response: aiResponse,
            sessionId: chatSession.id,
            remaining: limitResult.remaining,
            limit: limitResult.limit,
        }, {
            headers: {
                'X-RateLimit-Remaining': limitResult.remaining.toString(),
                'X-RateLimit-Limit': limitResult.limit.toString(),
                'X-RateLimit-Reset': limitResult.reset.toString(),
            },
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Chat API Error: ${message}`);
        return NextResponse.json(
            { message: 'Failed to generate response', error: message },
            { status: 500 }
        );
    }
}
