import { useState, useEffect, useCallback } from 'react';

export interface Position {
    symbol: string;
    qty: number;
    avg_entry_price: string;
    market_value: string;
    cost_basis: string;
    unrealized_pl: string;
    unrealized_plpc: string;
    unrealized_intraday_pl: string;
    unrealized_intraday_plpc: string;
    current_price: string;
    lastday_price: string;
    change_today: string;
}

export interface Account {
    id: string;
    account_number: string;
    status: string;
    currency: string;
    buying_power: string;
    regt_buying_power: string;
    daytrade_count: number;
    last_equity: string;
    equity: string;
    portfolio_value: string;
    cash: string;
    accrued_fees: string;
    pending_transfer_in: string;
    pending_transfer_out: string;
    shorting_enabled: boolean;
    multiplier: string;
    initial_margin: string;
    maintenance_margin: string;
    sma: string;
    daytrade_buying_power: string;
}

interface UseAccountOptions {
    pollInterval?: number;
    symbol?: string; // If provided, fetches specific position
    fetchPositions?: boolean; // If true, fetches all positions (unless symbol is provided)
}

export function useAccount({ pollInterval = 0, symbol, fetchPositions = false }: UseAccountOptions = {}) {
    const [account, setAccount] = useState<Account | null>(null);
    const [position, setPosition] = useState<Position | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const promises: Promise<Response>[] = [fetch('/api/trading/account')];

            // Fetch specific position or all positions
            if (symbol) {
                promises.push(fetch(`/api/trading/positions/${symbol}`));
            } else if (fetchPositions) {
                promises.push(fetch('/api/trading/positions'));
            }

            const responses = await Promise.all(promises);
            const accountRes = responses[0];

            const accountData = await accountRes.json();
            if (accountData.success) {
                setAccount(accountData.data.account);
            }

            // Handle positions response
            if (responses[1]) {
                const posRes = responses[1];
                const posData = await posRes.json();

                if (posData.success) {
                    if (symbol) {
                        // Single position
                        setPosition(posData.data.position || null);
                    } else if (fetchPositions) {
                        // All positions
                        setPositions(posData.data.positions || []);
                    }
                } else {
                    // Error or no data
                    if (symbol) setPosition(null);
                    if (fetchPositions) setPositions([]);
                }
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error fetching account data';
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [symbol, fetchPositions]);

    useEffect(() => {
        fetchData();

        if (pollInterval > 0) {
            const intervalId = setInterval(fetchData, pollInterval);
            return () => clearInterval(intervalId);
        }
    }, [fetchData, pollInterval]);

    return { account, position, positions, loading, error, refetch: fetchData };
}
