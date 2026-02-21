'use client';

import { useAdvisor, TradingSuggestion } from '@/hooks/useAdvisor';
import { useChat, ChatMessage } from '@/hooks/useChat';
import styles from './advisor.module.css';
import AuthGuard from '@/components/auth/AuthGuard';
import UpgradeBanner from '@/components/UpgradeBanner';
import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, MessageCircle, BarChart3 } from 'lucide-react';

type Tab = 'advisor' | 'chat';

export default function AdvisorPage() {
    const { advice, loading, error, getAdvice } = useAdvisor();
    const chat = useChat();
    const [tab, setTab] = useState<Tab>('advisor');
    const [chatInput, setChatInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat.messages, chat.loading]);

    const handleSend = () => {
        if (!chatInput.trim() || chat.loading) return;
        chat.sendMessage(chatInput);
        setChatInput('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'LOW': return '#3fb950';
            case 'MEDIUM': return '#d29922';
            case 'HIGH': return '#f85149';
            default: return 'var(--text-muted)';
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'BUY': return '#3fb950';
            case 'SELL': return '#f85149';
            case 'HOLD': return '#d29922';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <AuthGuard>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>
                            <span className={styles.sparkle}>✦</span> AI Financial Advisor
                        </h1>
                        <p className={styles.subtitle}>Personalized analysis & interactive Q&A powered by AI</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'advisor' ? styles.tabActive : ''}`}
                        onClick={() => setTab('advisor')}
                    >
                        <BarChart3 size={16} />
                        Portfolio Analysis
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'chat' ? styles.tabActive : ''}`}
                        onClick={() => setTab('chat')}
                    >
                        <MessageCircle size={16} />
                        Ask a Question
                    </button>
                </div>

                {/* ── ADVISOR TAB ── */}
                {tab === 'advisor' && (
                    <>
                        <div className={styles.actionBar}>
                            <button
                                className={styles.analyzeBtn}
                                onClick={getAdvice}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className={styles.spinner} />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 3v3m6.366.634l-2.122 2.122M21 12h-3m-.634 6.366l-2.122-2.122M12 21v-3m-6.366-.634l2.122-2.122M3 12h3m.634-6.366l2.122 2.122" />
                                        </svg>
                                        Get AI Advice
                                    </>
                                )}
                            </button>
                        </div>

                        {error && (
                            <div className={styles.errorBanner}>
                                <span>⚠</span> {error}
                            </div>
                        )}

                        {!advice && !loading && (
                            <div className={`card ${styles.emptyState}`}>
                                <div className={styles.emptyIcon}>🧠</div>
                                <h2>Your AI Financial Advisor</h2>
                                <p>Click &ldquo;Get AI Advice&rdquo; to analyze your budgets, transactions, and portfolio for personalized trading suggestions.</p>
                                <div className={styles.featureList}>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>📊</span>
                                        <span>Budget Analysis</span>
                                    </div>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>💡</span>
                                        <span>Smart Recommendations</span>
                                    </div>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>📈</span>
                                        <span>Trading Suggestions</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className={styles.loadingState}>
                                <div className={styles.loadingDots}>
                                    <span /><span /><span />
                                </div>
                                <p>Analyzing your financial data...</p>
                            </div>
                        )}

                        {advice && !loading && (
                            <div className={styles.results}>
                                {/* Summary */}
                                <div className={`card ${styles.summaryCard}`}>
                                    <div className={styles.summaryHeader}>
                                        <span className={styles.sectionIcon}>📋</span>
                                        <h2>Financial Summary</h2>
                                    </div>
                                    <p className={styles.summaryText}>{advice.summary}</p>
                                </div>

                                {/* Recommendations */}
                                <div className={`card ${styles.recsCard}`}>
                                    <div className={styles.summaryHeader}>
                                        <span className={styles.sectionIcon}>💡</span>
                                        <h2>Recommendations</h2>
                                    </div>
                                    <ul className={styles.recsList}>
                                        {advice.recommendations.map((rec, i) => (
                                            <li key={i}>
                                                <span className={styles.recNumber}>{i + 1}</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Trading Suggestions */}
                                <div className={styles.suggestionsSection}>
                                    <div className={styles.summaryHeader}>
                                        <span className={styles.sectionIcon}>📈</span>
                                        <h2>Trading Suggestions</h2>
                                    </div>
                                    <div className={styles.suggestionsGrid}>
                                        {advice.tradingSuggestions.map((s: TradingSuggestion, i: number) => (
                                            <div key={i} className={`card ${styles.suggestionCard}`}>
                                                <div className={styles.suggestionHeader}>
                                                    <span className={styles.symbol}>{s.symbol}</span>
                                                    <span className={styles.actionBadge} style={{
                                                        background: `${getActionColor(s.action)}22`,
                                                        color: getActionColor(s.action),
                                                        borderColor: `${getActionColor(s.action)}44`,
                                                    }}>
                                                        {s.action}
                                                    </span>
                                                </div>
                                                <p className={styles.reason}>{s.reason}</p>
                                                <div className={styles.suggestionMeta}>
                                                    <div className={styles.metaItem}>
                                                        <span className={styles.metaLabel}>Confidence</span>
                                                        <div className={styles.confidenceTrack}>
                                                            <div className={styles.confidenceBar} style={{ width: `${s.confidence * 100}%` }} />
                                                        </div>
                                                        <span className={styles.metaValue}>{Math.round(s.confidence * 100)}%</span>
                                                    </div>
                                                    <div className={styles.metaItem}>
                                                        <span className={styles.metaLabel}>Risk</span>
                                                        <span className={styles.riskBadge} style={{ color: getRiskColor(s.riskLevel) }}>
                                                            {s.riskLevel}
                                                        </span>
                                                    </div>
                                                    <div className={styles.metaItem}>
                                                        <span className={styles.metaLabel}>Allocation</span>
                                                        <span className={styles.metaValue}>{s.allocationPercent}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Product Suggestions */}
                        {advice?.productSuggestions && advice.productSuggestions.length > 0 && (
                            <div className={styles.productsSection}>
                                <div className={styles.summaryHeader}>
                                    <span className={styles.sectionIcon}>🎁</span>
                                    <h2>Recommended Products</h2>
                                </div>
                                <div className={styles.suggestionsGrid}>
                                    {advice.productSuggestions.map((product) => (
                                        <div key={product.id} className={`card ${styles.productCard}`}>
                                            <div className={styles.productHeader}>
                                                <div className={styles.providerInfo}>
                                                    <span className={styles.providerName}>{product.provider}</span>
                                                    <span className={styles.productCategory}>{product.category.replace(/_/g, ' ')}</span>
                                                </div>
                                                <h3 className={styles.productName}>{product.name}</h3>
                                            </div>
                                            <p className={styles.productDesc}>{product.description}</p>
                                            {product.reason && (
                                                <div className={styles.aiReason}>
                                                    <span className={styles.sparkle}>✦</span> {product.reason}
                                                </div>
                                            )}
                                            <a
                                                href={product.affiliateUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.applyBtn}
                                            >
                                                View Offer
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                </svg>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <UpgradeBanner
                            feature="AI advisor calls"
                            message="Upgrade to Premium for 20 daily AI calls and advanced analytics."
                        />
                    </>
                )}

                {/* ── CHAT TAB ── */}
                {tab === 'chat' && (
                    <div className={styles.chatContainer}>
                        <div className={styles.chatHeader}>
                            <div className={styles.chatHeaderLeft}>
                                <MessageCircle size={18} />
                                <span>Ask anything about finance</span>
                            </div>
                            <div className={styles.chatHeaderRight}>
                                {chat.remaining !== null && (
                                    <span className={styles.remainingBadge}>
                                        {chat.remaining} calls left today
                                    </span>
                                )}
                                {chat.messages.length > 0 && (
                                    <button
                                        className={styles.clearBtn}
                                        onClick={chat.clearChat}
                                        title="Clear conversation"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={styles.chatMessages}>
                            {chat.messages.length === 0 && !chat.loading && (
                                <div className={styles.chatEmpty}>
                                    <div className={styles.chatEmptyIcon}>💬</div>
                                    <h3>Ask a Financial Question</h3>
                                    <p>Get instant answers about investing, budgeting, crypto, forex, and more.</p>
                                    <div className={styles.chatSuggestions}>
                                        {[
                                            'What is dollar-cost averaging?',
                                            'How do I start investing with $500?',
                                            'Explain P/E ratio simply',
                                            'Best strategies for beginners?',
                                        ].map((q) => (
                                            <button
                                                key={q}
                                                className={styles.chatSuggestionBtn}
                                                onClick={() => {
                                                    setChatInput(q);
                                                    inputRef.current?.focus();
                                                }}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {chat.messages.map((msg: ChatMessage) => (
                                <div
                                    key={msg.id}
                                    className={`${styles.chatBubble} ${msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAi
                                        }`}
                                >
                                    <div className={styles.chatBubbleContent}>
                                        {msg.role === 'assistant' && (
                                            <span className={styles.chatAiLabel}>✦ MarketX AI</span>
                                        )}
                                        <p className={styles.chatBubbleText}>{msg.content}</p>
                                    </div>
                                </div>
                            ))}

                            {chat.loading && (
                                <div className={`${styles.chatBubble} ${styles.chatBubbleAi}`}>
                                    <div className={styles.chatBubbleContent}>
                                        <span className={styles.chatAiLabel}>✦ MarketX AI</span>
                                        <div className={styles.typingIndicator}>
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {chat.error && (
                                <div className={styles.chatError}>
                                    ⚠ {chat.error}
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        <div className={styles.chatInputArea}>
                            <input
                                ref={inputRef}
                                className={styles.chatInput}
                                placeholder="Ask about investing, budgeting, markets..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={chat.loading}
                                maxLength={2000}
                            />
                            <button
                                className={styles.chatSendBtn}
                                onClick={handleSend}
                                disabled={chat.loading || !chatInput.trim()}
                            >
                                <Send size={18} />
                            </button>
                        </div>

                        <UpgradeBanner
                            feature="AI chat"
                            message="Upgrade for more daily AI conversations and priority responses."
                        />
                    </div>
                )}
            </div>
        </AuthGuard>
    );
}
