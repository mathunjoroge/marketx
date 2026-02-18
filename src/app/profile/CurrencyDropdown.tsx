import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { CURRENCIES } from '@/lib/currencies';

interface CurrencyDropdownProps {
    value: string;
    onChange: (val: string) => void;
}

export default function CurrencyDropdown({ value, onChange }: CurrencyDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredCurrencies = CURRENCIES.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.country.toLowerCase().includes(search.toLowerCase())
    );

    const selectedCurrency = CURRENCIES.find(c => c.code === value) || CURRENCIES[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    backgroundColor: '#0d1117',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: isOpen ? 'rgba(59,130,246,0.7)' : 'rgba(55,65,81,0.6)',
                    borderRadius: '0.75rem',
                    padding: '0.875rem',
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: '#9ca3af',
                        width: '1.5rem'
                    }}>$</div>
                    <span style={{ fontFamily: 'ui-monospace, monospace' }}>{selectedCurrency.code}</span>
                    <span style={{ color: '#6b7280' }}>- {selectedCurrency.name}</span>
                </div>
                <ChevronDown size={18} style={{
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    color: '#4b5563'
                }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    backgroundColor: '#161b22',
                    border: '1px solid rgba(55,65,81,0.6)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    zIndex: 50,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid rgba(55,65,81,0.4)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#0d1117',
                            border: '1px solid rgba(55,65,81,0.4)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem'
                        }}>
                            <Search size={14} style={{ color: '#6b7280' }} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search currency or country..."
                                autoFocus
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    width: '100%'
                                }}
                            />
                        </div>
                    </div>
                    <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#4b5563 #161b22'
                    }}>
                        {filteredCurrencies.length > 0 ? (
                            filteredCurrencies.map((c) => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                        onChange(c.code);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '0.75rem 1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        borderLeft: value === c.code ? '2px solid #3b82f6' : '2px solid transparent',
                                        ...(value === c.code ? { backgroundColor: 'rgba(59,130,246,0.1)' } : {})
                                    }}
                                    onMouseEnter={(e) => {
                                        if (value !== c.code) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (value !== c.code) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 'bold' }}>{c.code}</span>
                                        <span style={{ color: '#9ca3af' }}>{c.name}</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{c.country}</span>
                                </button>
                            ))
                        ) : (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
