import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    action: () => void;
    description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in input fields
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
        if (target.isContentEditable) return;

        for (const shortcut of shortcuts) {
            const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatch = shortcut.ctrlKey ? (e.ctrlKey || e.metaKey) : true;
            const metaMatch = shortcut.metaKey ? e.metaKey : true;
            const shiftMatch = shortcut.shiftKey ? e.shiftKey : true;

            if (keyMatch && ctrlMatch && metaMatch && shiftMatch) {
                e.preventDefault();
                shortcut.action();
                return;
            }
        }
    }, [shortcuts]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
