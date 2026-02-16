'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', toggleTheme: () => { } });

export function useTheme() {
    return useContext(ThemeContext);
}

const lightVars: Record<string, string> = {
    '--background': '#ffffff',
    '--foreground': '#0f172a',
    '--card-bg': '#f8fafc',
    '--border': '#e2e8f0',
    '--text-muted': '#64748b',
    // Maintaining compatibility
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--bg-card': '#ffffff',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--border-primary': '#e2e8f0',
    '--border-secondary': '#f1f5f9',
};

const darkVars: Record<string, string> = {
    '--background': '#0a0e14',
    '--foreground': '#ffffff',
    '--card-bg': '#161b22',
    '--border': '#30363d',
    '--text-muted': '#8b949e',
    // Maintaining compatibility
    '--bg-primary': '#0a0e14',
    '--bg-secondary': '#161b22',
    '--bg-card': '#161b22',
    '--text-primary': '#ffffff',
    '--text-secondary': '#8b949e',
    '--border-primary': '#30363d',
    '--border-secondary': '#30363d',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        const saved = localStorage.getItem('theme') as Theme | null;
        if (saved) setTheme(saved);
    }, []);

    useEffect(() => {
        const vars = theme === 'light' ? lightVars : darkVars;
        Object.entries(vars).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        // Persist to backend settings if logged in
        if (session?.user) {
            fetch('/api/user/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: newTheme }),
            }).catch(() => { });
        }
    }, [theme, session?.user]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
