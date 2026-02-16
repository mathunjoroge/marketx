/**
 * Portfolio Analytics Utilities
 * 
 * Calculates performance metrics like Sharpe ratio, drawdown, win rate, etc.
 */

export interface Trade {
    id: string;
    symbol: string;
    side: 'LONG' | 'SHORT';
    qty: number;
    entryPrice: number;
    exitPrice?: number;
    entryTime: Date | string;
    exitTime?: Date | string;
    pnl?: number; // P&L for closed trades
    exitReason?: string;
}

export interface PerformanceMetrics {
    totalReturn: number;
    totalReturnPercent: number;
    sharpeRatio: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    equityCurve: EquityPoint[]; // Added for charting
    winRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    expectancy: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
}

export interface EquityPoint {
    date: string;
    equity: number;
}

/**
 * Calculate Sharpe Ratio
 * Measures risk-adjusted returns
 */
export function calculateSharpeRatio(
    returns: number[],
    riskFreeRate: number = 0.02 // 2% annual risk-free rate
): number {
    if (returns.length < 2) return 0;

    // Calculate average return
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Calculate standard deviation
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Annualized Sharpe ratio (assuming daily returns)
    const excessReturn = avgReturn - (riskFreeRate / 252); // Daily risk-free rate
    const sharpe = (excessReturn / stdDev) * Math.sqrt(252);

    return sharpe;
}

/**
 * Calculate Maximum Drawdown
 * Largest peak-to-trough decline
 */
export function calculateMaxDrawdown(equityCurve: EquityPoint[]): {
    maxDrawdown: number;
    maxDrawdownPercent: number;
    peakDate: string;
    troughDate: string;
} {
    if (equityCurve.length === 0) {
        return { maxDrawdown: 0, maxDrawdownPercent: 0, peakDate: '', troughDate: '' };
    }

    let peak = equityCurve[0].equity;
    let peakDate = equityCurve[0].date;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let troughDate = '';

    equityCurve.forEach(point => {
        if (point.equity > peak) {
            peak = point.equity;
            peakDate = point.date;
        }

        const drawdown = peak - point.equity;
        const drawdownPercent = (drawdown / peak) * 100;

        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
            maxDrawdownPercent = drawdownPercent;
            troughDate = point.date;
        }
    });

    return { maxDrawdown, maxDrawdownPercent, peakDate, troughDate };
}

/**
 * Calculate Win Rate and other trade statistics
 */
export function calculateTradeStats(trades: Trade[]): {
    winRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    expectancy: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
} {
    if (trades.length === 0) {
        return {
            winRate: 0,
            avgWin: 0,
            avgLoss: 0,
            profitFactor: 0,
            expectancy: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
        };
    }

    const closedTrades = trades.filter(t => t.pnl !== undefined && t.pnl !== null);
    const wins = closedTrades.filter(t => t.pnl! > 0);
    const losses = closedTrades.filter(t => t.pnl! < 0);

    const totalWins = wins.reduce((sum, t) => sum + t.pnl!, 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl!, 0));

    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;

    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    // Expectancy = (Win% * Avg Win) - (Loss% * Avg Loss)
    const lossRate = 1 - (winRate / 100);
    const expectancy = (winRate / 100) * avgWin - lossRate * avgLoss;

    return {
        winRate,
        avgWin,
        avgLoss,
        profitFactor,
        expectancy,
        totalTrades: closedTrades.length,
        winningTrades: wins.length,
        losingTrades: losses.length,
    };
}

/**
 * Build equity curve from trade history
 */
export function buildEquityCurve(
    trades: Trade[],
    initialEquity: number
): EquityPoint[] {
    const curve: EquityPoint[] = [];
    let currentEquity = initialEquity;

    // Sort trades by date (exit time)
    const sortedTrades = [...trades]
        .filter(t => t.exitTime && t.pnl !== undefined)
        .sort((a, b) =>
            new Date(a.exitTime!).getTime() - new Date(b.exitTime!).getTime()
        );

    // Add initial point
    if (sortedTrades.length > 0) {
        curve.push({
            date: new Date(new Date(sortedTrades[0].exitTime!).getTime() - 86400000).toISOString().split('T')[0], // Day before first trade
            equity: initialEquity,
        });
    }

    // Add points for each trade
    sortedTrades.forEach(trade => {
        if (trade.pnl !== undefined) {
            currentEquity += trade.pnl;
            curve.push({
                date: new Date(trade.exitTime!).toISOString().split('T')[0],
                equity: currentEquity,
            });
        }
    });

    return curve;
}

/**
 * Calculate daily returns from equity curve
 */
export function calculateReturns(equityCurve: EquityPoint[]): number[] {
    const returns: number[] = [];

    for (let i = 1; i < equityCurve.length; i++) {
        const prevEquity = equityCurve[i - 1].equity;
        const currentEquity = equityCurve[i].equity;
        const dailyReturn = (currentEquity - prevEquity) / prevEquity;
        returns.push(dailyReturn);
    }

    return returns;
}

/**
 * Calculate comprehensive performance metrics
 */
export function calculatePerformanceMetrics(
    trades: Trade[],
    initialEquity: number,
    currentEquity: number
): PerformanceMetrics {
    const tradeStats = calculateTradeStats(trades);
    const equityCurve = buildEquityCurve(trades, initialEquity);
    const returns = calculateReturns(equityCurve);
    const sharpeRatio = calculateSharpeRatio(returns);
    const drawdown = calculateMaxDrawdown(equityCurve);

    const totalReturn = currentEquity - initialEquity;
    const totalReturnPercent = ((currentEquity - initialEquity) / initialEquity) * 100;

    return {
        totalReturn,
        totalReturnPercent,
        sharpeRatio,
        maxDrawdown: drawdown.maxDrawdown,
        maxDrawdownPercent: drawdown.maxDrawdownPercent,
        equityCurve, // Added
        ...tradeStats,
    };
}
