'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, Search, ChevronDown, Check } from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';
import { useMarket } from '@/context/MarketContext';

export default function CountrySelector() {
    const { country, setCountry } = useMarket();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredCountries = COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    const selectedCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

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
        <div className="relative" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label="Select country"
                className="flex items-center gap-2 bg-[#151b23] border border-[#30363d] px-3 py-1.5 rounded-md hover:bg-[#1c2128] focus:bg-[#1c2128] active:bg-[#1c2128] transition-colors text-sm font-medium focus:outline-none"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#151b23' }}
            >
                <Globe size={16} className="text-gray-200" />
                <span style={{ color: 'white' }}>{selectedCountry.name}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <style>{`
                        .country-dropdown {
                            position: absolute;
                            right: 0;
                            margin-top: 8px;
                            width: 300px;
                            max-width: calc(100vw - 2rem);
                            background-color: #151b23;
                            border: 1px solid #30363d;
                            border-radius: 6px;
                            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
                            z-index: 1000;
                            display: block;
                            overflow: hidden;
                        }
                        @media (max-width: 480px) {
                            .country-dropdown {
                                position: fixed;
                                right: 0.5rem;
                                left: 0.5rem;
                                top: 4rem;
                                margin-top: 0;
                                width: auto;
                                max-width: none;
                            }
                        }
                    `}</style>
                    <div className="country-dropdown">
                        <div
                            className="p-2 border-bottom border-[#30363d] flex items-center gap-2 bg-[#0d1117]"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: '#0d1117', borderBottom: '1px solid #30363d' }}
                        >
                            <Search size={14} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search countries..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-[#0d1117] border-none text-sm focus:ring-0 focus:outline-none w-full text-white placeholder-gray-500"
                                style={{
                                    background: '#0d1117',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'white',
                                    width: '100%',
                                    fontSize: '14px'
                                }}
                                autoFocus
                            />
                        </div>
                        <div
                            className="max-h-80 overflow-y-auto"
                            style={{
                                maxHeight: '320px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#30363d #151b23'
                            }}
                        >
                            {filteredCountries.length > 0 ? (
                                filteredCountries.map(c => (
                                    <button
                                        key={c.code}
                                        onClick={() => {
                                            setCountry(c.code);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-[#1f6feb]/10 transition-colors border-l-2 ${country === c.code ? 'border-[#1f6feb] bg-[#1f6feb]/5 text-white' : 'border-transparent text-gray-400'}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            padding: '10px 16px',
                                            border: 'none',
                                            borderLeft: country === c.code ? '2px solid #1f6feb' : '2px solid transparent',
                                            backgroundColor: country === c.code ? 'rgba(31, 111, 235, 0.1)' : 'transparent',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <span className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span className="w-5 text-gray-500 font-mono text-[10px]" style={{ width: '20px', color: '#8b949e', fontFamily: 'monospace', fontSize: '10px' }}>{c.code}</span>
                                            <span className="font-medium" style={{ fontWeight: 500, color: country === c.code ? 'white' : '#c9d1d9' }}>{c.name}</span>
                                            {c.supported && <span style={{ fontSize: '10px', color: '#3fb950', fontWeight: 'bold', marginLeft: '8px' }}>SUPPORTED</span>}
                                        </span>
                                        {country === c.code && <Check size={14} style={{ color: '#1f6feb' }} />}
                                    </button>
                                ))
                            ) : (
                                <div style={{ padding: '16px', fontSize: '14px', color: '#8b949e', textAlign: 'center' }}>No countries found</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
