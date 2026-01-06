
import type { OHLCV, TechnicalIndicators, Signals } from '../types';
import { calculateFactorAttribution } from './factorAttributionService';

const indicatorsCache = new Map<string, TechnicalIndicators>();
const UI_SUGGESTED_RISK_CAPITAL = 2000;

const createOhlcvCacheKey = (data: OHLCV[]): string => {
    if (data.length === 0) return 'no_data';
    const first = data[0];
    const last = data[data.length - 1];
    return `len:${data.length}-start:${first.date}/${first.close}-end:${last.date}/${last.close}`;
};

/**
 * Helper to find the last Thursday of a given month
 */
const getLastThursday = (year: number, month: number): Date => {
    const lastDay = new Date(year, month + 1, 0); // Last day of month
    let day = lastDay.getDay(); // 0 = Sunday, 1 = Monday, ..., 4 = Thursday
    let diff = (day >= 4) ? (day - 4) : (day + 3);
    return new Date(year, month + 1, 0 - diff);
};

/**
 * Calculates the next F&O expiry date (Last Thursday of the month)
 */
const getNextExpiryInfo = (currentDate: Date) => {
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    
    let expiry = getLastThursday(year, month);
    
    // If current date is past this month's expiry, move to next month
    if (currentDate.getTime() > expiry.getTime()) {
        month += 1;
        if (month > 11) {
            month = 0;
            year += 1;
        }
        expiry = getLastThursday(year, month);
    }
    
    const diffTime = expiry.getTime() - currentDate.getTime();
    const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
        expiryDate: expiry.toISOString().split('T')[0],
        daysToExpiry: daysToExpiry >= 0 ? daysToExpiry : 0
    };
};

export const calculateEMA = (data: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const emaArray: number[] = Array(data.length).fill(NaN);
    let startIndex = -1;
    for (let i = 0; i <= data.length - period; i++) {
        const window = data.slice(i, i + period);
        if (window.every(v => !isNaN(v))) { startIndex = i; break; }
    }
    if (startIndex === -1) return emaArray;
    const initialWindow = data.slice(startIndex, startIndex + period);
    const sma = initialWindow.reduce((a, b) => a + b, 0) / period;
    let lastEma = sma;
    emaArray[startIndex + period - 1] = lastEma;
    for (let i = startIndex + period; i < data.length; i++) {
        const currentValue = data[i];
        if (isNaN(currentValue)) { emaArray[i] = lastEma; } else {
            lastEma = currentValue * k + lastEma * (1 - k);
            emaArray[i] = lastEma;
        }
    }
    return emaArray;
};

export const calculateSMA = (data: number[], period: number): number[] => {
    if (data.length < period) return Array(data.length).fill(NaN);
    const sma: number[] = Array(period - 1).fill(NaN);
    let sum = data.slice(0, period).reduce((acc, val) => acc + val, 0);
    sma.push(sum / period);
    for (let i = period; i < data.length; i++) {
        sum = sum - data[i - period] + data[i];
        sma.push(sum / period);
    }
    return sma;
};

export const calculateATR = (data: OHLCV[], period = 14): number[] => {
    if(data.length < period) return Array(data.length).fill(NaN);
    const trs = [];
    for(let i=1; i<data.length; i++) {
        const tr1 = data[i].high - data[i].low;
        const tr2 = Math.abs(data[i].high - data[i-1].close);
        const tr3 = Math.abs(data[i].low - data[i-1].close);
        trs.push(Math.max(tr1, tr2, tr3));
    }
    const atr = calculateEMA(trs, period);
    return [NaN, ...atr];
};

export const calculateADX = (data: OHLCV[], period = 14) => {
    if (data.length < period * 2) {
        return { adx: Array(data.length).fill(NaN), plusDI: Array(data.length).fill(NaN), minusDI: Array(data.length).fill(NaN) };
    }
    const trs: number[] = [];
    const plusDMs: number[] = [];
    const minusDMs: number[] = [];
    for (let i = 1; i < data.length; i++) {
        const h = data[i].high;
        const l = data[i].low;
        const ph = data[i - 1].high;
        const pl = data[i - 1].low;
        const pc = data[i - 1].close;
        trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
        const up = h - ph;
        const down = pl - l;
        plusDMs.push((up > down && up > 0) ? up : 0);
        minusDMs.push((down > up && down > 0) ? down : 0);
    }
    const atr = calculateEMA(trs, period);
    const sdmPlus = calculateEMA(plusDMs, period);
    const sdmMinus = calculateEMA(minusDMs, period);
    const plusDI = [];
    const minusDI = [];
    for (let i = period - 1; i < sdmPlus.length; i++) {
        plusDI.push((sdmPlus[i] / (atr[i] || 1)) * 100);
        minusDI.push((sdmMinus[i] / (atr[i] || 1)) * 100);
    }
    const dxs = [];
    for (let i = 0; i < plusDI.length; i++) {
        const sum = plusDI[i] + minusDI[i];
        dxs.push(sum === 0 ? 0 : (Math.abs(plusDI[i] - minusDI[i]) / sum) * 100);
    }
    const adx = calculateEMA(dxs, period);
    const padding = Array(data.length - adx.length).fill(NaN);
    return { adx: [...padding, ...adx], plusDI: [...padding, ...plusDI], minusDI: [...padding, ...minusDI] };
};

const calculateRMA = (data: number[], period: number): number[] => {
    if (data.length < period) return Array(data.length).fill(NaN);
    const alpha = 1 / period;
    const rmaArray: number[] = [];
    let sum = data.slice(0, period).reduce((a, b) => a + b, 0);
    rmaArray.push(sum / period);
    for (let i = period; i < data.length; i++) {
        const rma = data[i] * alpha + rmaArray[rmaArray.length - 1] * (1 - alpha);
        rmaArray.push(rma);
    }
    return [...Array(period - 1).fill(NaN), ...rmaArray];
};

const calculateRSI = (data: number[], period = 14): number[] => {
    if (data.length < period + 1) return Array(data.length).fill(NaN);
    const deltas: number[] = [];
    for (let i = 1; i < data.length; i++) {
        deltas.push(data[i] - data[i - 1]);
    }
    const gains = deltas.map(d => d > 0 ? d : 0);
    const losses = deltas.map(d => d < 0 ? -d : 0);
    const avgGain = calculateRMA(gains, period);
    const avgLoss = calculateRMA(losses, period);
    const rs: number[] = [];
    for (let i = 0; i < avgGain.length; i++) {
        rs.push(avgLoss[i] === 0 ? Infinity : avgGain[i] / avgLoss[i]);
    }
    const rsi = rs.map(r => r === Infinity ? 100 : 100 - (100 / (1 + r)));
    return [NaN, ...rsi];
};

export const calculateIndicators = (data: OHLCV[]): TechnicalIndicators => {
    const cacheKey = createOhlcvCacheKey(data);
    if (indicatorsCache.has(cacheKey)) return indicatorsCache.get(cacheKey)!;

    const volumes = data.map(d => d.volume);
    const closes = data.map(d => d.close);
    const ois = data.map(d => d.openInterest || 0);
    const atr = calculateATR(data, 14);
    const atr7 = calculateATR(data, 7);
    const { adx, plusDI, minusDI } = calculateADX(data, 14);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);
    const ema200 = calculateEMA(closes, 200);
    const ema9 = calculateEMA(closes, 9);
    const ema10 = calculateEMA(closes, 10);
    const ema13 = calculateEMA(closes, 13);
    const rsi = calculateRSI(closes);

    const bbUpper = sma20.map((m, i) => {
        if (isNaN(m)) return NaN;
        const slice = closes.slice(Math.max(0, i-19), i+1);
        const std = Math.sqrt(slice.reduce((s, c) => s + Math.pow(c - m, 2), 0) / 20);
        return m + (std * 2);
    });
    
    const kcUpper = sma20.map((m, i) => m + (atr[i] * 1.5));
    const isSqueezing = bbUpper.map((u, i) => u < (kcUpper[i] || 0));
    
    const oiChangePct: number[] = Array(5).fill(0);
    for (let i = 5; i < ois.length; i++) {
        const prevOi = ois[i-1] || 1;
        oiChangePct.push(((ois[i] - prevOi) / prevOi) * 100);
    }

    const rvol: number[] = Array(20).fill(NaN);
    for (let i = 20; i < volumes.length; i++) {
        const avg = volumes.slice(i - 20, i).reduce((sum, v) => sum + v, 0) / 20;
        rvol.push(avg > 0 ? volumes[i] / avg : 0);
    }

    const logReturns: number[] = [NaN];
    for(let i=1; i<closes.length; i++) {
        if(closes[i-1] > 0) logReturns.push(Math.log(closes[i] / closes[i-1]));
        else logReturns.push(NaN);
    }
    const xt = logReturns.map((lr, i) => lr * (rvol[i] || 0));
    const ema9Xt = calculateEMA(xt, 9);
    const ema21Xt = calculateEMA(xt, 21);

    const volatilityPct = atr.map((val, i) => (closes[i] ? (val / closes[i]) * 100 : 0));

    const indicators: TechnicalIndicators = {
        atr, atr7, adx, plusDI, minusDI, avgVolume: volumes.slice(-20).reduce((a,b)=>a+b,0)/20, rvol, volatilityPct,
        volEma5: calculateEMA(volumes, 5), volEma20: calculateEMA(volumes, 20), ema9, ema10, ema13, ema200, 
        macdLine: [], macdSignal: [], rsi, stochRsi: [], sma20, sma50, sma200, obv: [], avdm: [],
        xt, ema9Xt, ema21Xt, bbUpper, kcUpper, isSqueezing, oiChangePct, oiSmartMoneyScore: []
    };

    indicatorsCache.set(cacheKey, indicators);
    return indicators;
};

export const generateSignals = (indicators: TechnicalIndicators, historical: OHLCV[]): Signals => {
    const lastIndex = historical.length - 1;
    const currentData = historical[lastIndex];

    const rvol = indicators.rvol[lastIndex] || 0;
    const adx = indicators.adx[lastIndex] || 0;
    const plusDI = indicators.plusDI[lastIndex] || 0;
    const minusDI = indicators.minusDI[lastIndex] || 0;
    const ema10 = indicators.ema10[lastIndex] || 0;

    let volumeSignal: 'Spike' | 'Normal' = 'Normal';
    let volumeSpikeSignalDate = '';
    for (let i = lastIndex; i >= Math.max(0, lastIndex - 55); i--) {
        if (indicators.rvol[i] > 3) {
            volumeSignal = 'Spike';
            volumeSpikeSignalDate = historical[i].date;
            break;
        }
    }

    let trendSignal: 'Uptrend' | 'Downtrend' | 'Weak' = 'Weak';
    if (adx > 25) {
        if (plusDI > minusDI) trendSignal = 'Uptrend';
        else if (minusDI > plusDI) trendSignal = 'Downtrend';
    }

    const oiBuild = indicators.oiChangePct[lastIndex] || 0;
    const atr7 = indicators.atr7[lastIndex] || 1;
    const stopLoss = currentData.close - (3 * atr7);
    const risk = currentData.close - stopLoss;
    const target = currentData.close + (2 * risk);

    let vwlmBuy = false;
    let vwlmBuyDate = '';
    let vwlmSell = false;
    let vwlmSellDate = '';
    for (let i = lastIndex; i >= Math.max(21, lastIndex - 5); i--) {
        const ema9Xt = indicators.ema9Xt[i] || 0;
        const ema21Xt = indicators.ema21Xt[i] || 0;
        const ema9XtPrev = indicators.ema9Xt[i-1] || 0;
        const ema21XtPrev = indicators.ema21Xt[i-1] || 0;
        if (ema9XtPrev <= ema21XtPrev && ema9Xt > ema21Xt && (indicators.xt[i] || 0) >= 0.1) {
            vwlmBuy = true;
            vwlmBuyDate = historical[i].date;
            break;
        }
    }

    const factors = calculateFactorAttribution(indicators, historical);
    
    // Calculate Expiry Info
    const { expiryDate, daysToExpiry } = getNextExpiryInfo(new Date());

    return {
        volumeSignal,
        trendSignal,
        volumeEmaSignal: 'Neutral',
        volumeSpikeSignalDate,
        stopLoss,
        target,
        volumeStatus: rvol > 1.5 ? 'High 🔺' : 'Average ➖',
        priceAboveEma10: currentData.close > ema10,
        suggestedShares: risk > 0 ? Math.floor(UI_SUGGESTED_RISK_CAPITAL / risk) : 0,
        oiBuild,
        expiryDate,
        daysToExpiry,
        vwlmBuySignal: vwlmBuy,
        vwlmBuySignalDate: vwlmBuyDate,
        vwlmSellSignal: vwlmSell,
        vwlmSellSignalDate: vwlmSellDate,
        vwlmStrength: indicators.xt[lastIndex] || 0,
        factors
    };
};
