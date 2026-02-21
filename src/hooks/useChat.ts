'use client';

import { useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function useChat() {
    const { status } = useSession();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [remaining, setRemaining] = useState<number | null>(null);
    const sessionIdRef = useRef<string | null>(null);

    const sendMessage = useCallback(async (content: string) => {
        if (status !== 'authenticated' || !content.trim()) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content.trim(),
                    sessionId: sessionIdRef.current,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to get response');
            }

            const data = await res.json();

            sessionIdRef.current = data.sessionId;
            if (data.remaining !== undefined) {
                setRemaining(data.remaining);
            }

            const aiMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, [status]);

    const clearChat = useCallback(() => {
        setMessages([]);
        sessionIdRef.current = null;
        setError(null);
    }, []);

    return {
        messages,
        loading,
        error,
        remaining,
        sendMessage,
        clearChat,
    };
}
