import { HistoricalBar } from './providers/types';

export function calculateSMA(data: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(NaN);
            continue;
        }
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
    }
    return sma;
}

export function calculateEMA(data: number[], period: number): number[] {
    const ema: number[] = [];
    const k = 2 / (period + 1);
    let previousEma = data[0];
    ema.push(previousEma);

    for (let i = 1; i < data.length; i++) {
        const currentEma = (data[i] * k) + (previousEma * (1 - k));
        ema.push(currentEma);
        previousEma = currentEma;
    }
    return ema;
}

export function calculateRSI(data: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        if (i <= period) {
            if (diff > 0) gains += diff;
            else losses -= diff;

            if (i === period) {
                let avgGain = gains / period;
                let avgLoss = losses / period;
                const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
                rsi.push(100 - 100 / (1 + rs));
            } else {
                rsi.push(NaN);
            }
            continue;
        }

        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;

        const avgGain = (gains * (period - 1) + gain) / period;
        const avgLoss = (losses * (period - 1) + loss) / period;

        gains = avgGain;
        losses = avgLoss;

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
    }
    // Prefix with NaN to match original length
    return [NaN, ...rsi];
}

export function calculateBollingerBands(data: number[], period: number = 20, multiplier: number = 2) {
    const sma = calculateSMA(data, period);
    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (isNaN(sma[i])) {
            upper.push(NaN);
            lower.push(NaN);
            continue;
        }

        const slice = data.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const squareDiffs = slice.map(v => Math.pow(v - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / period;
        const stdDev = Math.sqrt(avgSquareDiff);

        upper.push(mean + multiplier * stdDev);
        lower.push(mean - multiplier * stdDev);
    }

    return { middle: sma, upper, lower };
}

export function calculateVWAP(bars: HistoricalBar[]): number[] {
    const vwap: number[] = [];
    let cumulativeValue = 0;
    let cumulativeVolume = 0;

    for (const bar of bars) {
        const typicalPrice = (bar.high + bar.low + bar.close) / 3;
        cumulativeValue += typicalPrice * bar.volume;
        cumulativeVolume += bar.volume;
        vwap.push(cumulativeValue / cumulativeVolume);
    }

    return vwap;
}

export function calculateADX(bars: HistoricalBar[], period: number = 14): number[] {
    const adx: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];
    const tr: number[] = [];

    for (let i = 1; i < bars.length; i++) {
        const highDiff = bars[i].high - bars[i - 1].high;
        const lowDiff = bars[i - 1].low - bars[i].low;

        plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
        minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

        const trVal = Math.max(
            bars[i].high - bars[i].low,
            Math.abs(bars[i].high - bars[i - 1].close),
            Math.abs(bars[i].low - bars[i - 1].close)
        );
        tr.push(trVal);
    }

    const smoothedPlusDM = calculateEMA(plusDM, period);
    const smoothedMinusDM = calculateEMA(minusDM, period);
    const smoothedTR = calculateEMA(tr, period);

    const dx: number[] = [];
    for (let i = 0; i < smoothedPlusDM.length; i++) {
        const pDI = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
        const mDI = (smoothedMinusDM[i] / smoothedTR[i]) * 100;
        const dxVal = (Math.abs(pDI - mDI) / (pDI + mDI)) * 100;
        dx.push(dxVal || 0);
    }

    const adxValues = calculateEMA(dx, period);

    // Pad to match original length
    return Array(bars.length - adxValues.length).fill(NaN).concat(adxValues);
}

export function calculateMACD(data: number[], fast: number = 12, slow: number = 26, signal: number = 9) {
    const fastEMA = calculateEMA(data, fast);
    const slowEMA = calculateEMA(data, slow);
    const macdLine = fastEMA.map((f, i) => f - slowEMA[i]);
    const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signal);

    // Pad signal line to match macdLine length
    const paddedSignal = Array(macdLine.length - signalLine.length).fill(NaN).concat(signalLine);
    const histogram = macdLine.map((m, i) => m - paddedSignal[i]);

    return { macdLine, signalLine: paddedSignal, histogram };
}
