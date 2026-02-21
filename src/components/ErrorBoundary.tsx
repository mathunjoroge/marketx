'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                    <h3 className="text-red-400 font-bold mb-1">Something went wrong</h3>
                    <p className="text-xs text-gray-400">Unable to load this section</p>
                </div>
            );
        }

        return this.props.children;
    }
}
