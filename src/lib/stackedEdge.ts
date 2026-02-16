import { HistoricalBar } from './providers/types';
import * as ind from './indicators';

export interface StackedEdgeResult {
    bullishScore: number;
    bearishScore: number;
    maxScore: number;
    netBias: 'Bullish' | 'Bearish' | 'Neutral';
    phase: 'Lead-In' | 'Confirmation' | 'Exhaustion' | 'Neutral';
    indicators: {
        name: string;
        category: string;
        side: 'Bullish' | 'Bearish' | 'Neutral';
        value: string;
        description: string;
    }[];
}

export function calculateStackedEdge(bars: HistoricalBar[]): StackedEdgeResult {
    if (bars.length < 200) {
        return {
            bullishScore: 0,
            bearishScore: 0,
            maxScore: 7,
            netBias: 'Neutral',
            phase: 'Neutral',
            indicators: [],
        };
    }

    const closes = bars.map(b => b.close);
    const lastIdx = bars.length - 1;
    const currentPrice = closes[lastIdx];
    const prevPrice = closes[lastIdx - 1];

    // 1. Long-Trend: SMA 200
    const sma200 = ind.calculateSMA(closes, 200);
    const curSMA200 = sma200[lastIdx];
    const isBullLongTrend = currentPrice > curSMA200;
    const isBearLongTrend = currentPrice < curSMA200;

    // 2. Short-Trend: EMA 20
    const ema20 = ind.calculateEMA(closes, 20);
    const curEMA20 = ema20[lastIdx];
    const isBullShortTrend = currentPrice > curEMA20;
    const isBearShortTrend = currentPrice < curEMA20;

    // 3. Momentum: RSI 14
    const rsi = ind.calculateRSI(closes, 14);
    const curRSI = rsi[lastIdx];
    const isBullRSI = Math.round(curRSI) === 60;
    const isBearRSI = Math.round(curRSI) === 40;

    // 4. Mean Reversion: Bollinger Bands
    const bb = ind.calculateBollingerBands(closes, 20, 2);
    const curBBMid = bb.middle[lastIdx];
    const prevBBMid = bb.middle[lastIdx - 1];
    const crossedAboveMid = currentPrice > curBBMid && prevPrice <= prevBBMid;
    const crossedBelowMid = currentPrice < curBBMid && prevPrice >= prevBBMid;

    // 5. Volume: VWAP
    const vwap = ind.calculateVWAP(bars);
    const curVWAP = vwap[lastIdx];
    const isBullVWAP = currentPrice > curVWAP;
    const isBearVWAP = currentPrice < curVWAP;

    // 6. Trend Strength: ADX 14
    const adx = ind.calculateADX(bars, 14);
    const curADX = adx[lastIdx];
    const isStrongTrend = curADX > 25;

    // 7. Reversal: MACD
    const macd = ind.calculateMACD(closes);
    const macdLine = macd.macdLine[lastIdx];
    const signalLine = macd.signalLine[lastIdx];
    const prevMacdLine = macd.macdLine[lastIdx - 1];
    const prevSignalLine = macd.signalLine[lastIdx - 1];
    const bullMACDCross = macdLine > signalLine && prevMacdLine <= prevSignalLine;
    const bearMACDCross = macdLine < signalLine && prevMacdLine >= prevSignalLine;

    const indicatorsInfo = [
        {
            name: '200-Day SMA',
            category: 'Long-Trend',
            bullish: isBullLongTrend,
            bearish: isBearLongTrend,
            value: curSMA200?.toFixed(2) || 'N/A',
            description: 'Grand Regime indicator.'
        },
        {
            name: '20-Day EMA',
            category: 'Short-Trend',
            bullish: isBullShortTrend,
            bearish: isBearShortTrend,
            value: curEMA20?.toFixed(2) || 'N/A',
            description: 'Immediate price gravity.'
        },
        {
            name: 'RSI (14)',
            category: 'Momentum',
            bullish: isBullRSI,
            bearish: isBearRSI,
            value: curRSI?.toFixed(2) || 'N/A',
            description: 'Momentum consensus.'
        },
        {
            name: 'Bollinger Bands',
            category: 'Mean Reversion',
            bullish: crossedAboveMid,
            bearish: crossedBelowMid,
            value: 'Middle Cross',
            description: 'Trend continuation.'
        },
        {
            name: 'VWAP',
            category: 'Volume',
            bullish: isBullVWAP,
            bearish: isBearVWAP,
            value: curVWAP?.toFixed(2) || 'N/A',
            description: 'Big Money price.'
        },
        {
            name: 'ADX (14)',
            category: 'Trend Strength',
            bullish: isStrongTrend && (currentPrice > prevPrice),
            bearish: isStrongTrend && (currentPrice < prevPrice),
            value: curADX?.toFixed(2) || 'N/A',
            description: 'Trend power.'
        },
        {
            name: 'MACD',
            category: 'Reversal',
            bullish: bullMACDCross,
            bearish: bearMACDCross,
            value: 'Crossover',
            description: 'Momentum shift.'
        }
    ];

    const bullishScore = indicatorsInfo.filter(i => i.bullish).length;
    const bearishScore = indicatorsInfo.filter(i => i.bearish).length;

    let netBias: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
    if (bullishScore > bearishScore) netBias = 'Bullish';
    else if (bearishScore > bullishScore) netBias = 'Bearish';

    // Phase logic (primarily for the dominant side)
    let phase: 'Lead-In' | 'Confirmation' | 'Exhaustion' | 'Neutral' = 'Neutral';
    const activeScore = netBias === 'Bullish' ? bullishScore : bearishScore;

    if (activeScore >= 1) {
        if (bullMACDCross || bearMACDCross || (curRSI > 40 && curRSI < 60)) {
            phase = 'Lead-In';
        }
        if (activeScore >= 4 && ((netBias === 'Bullish' && isBullShortTrend && isBullVWAP) || (netBias === 'Bearish' && isBearShortTrend && isBearVWAP))) {
            phase = 'Confirmation';
        }
        if (activeScore >= 4 && (curRSI > 70 || curRSI < 30 || curADX < adx[lastIdx - 1])) {
            phase = 'Exhaustion';
        }
    }

    return {
        bullishScore,
        bearishScore,
        maxScore: 7,
        netBias,
        phase,
        indicators: indicatorsInfo.map(i => ({
            name: i.name,
            category: i.category,
            side: i.bullish ? 'Bullish' : i.bearish ? 'Bearish' : 'Neutral',
            value: i.value,
            description: i.description
        }))
    };
}
