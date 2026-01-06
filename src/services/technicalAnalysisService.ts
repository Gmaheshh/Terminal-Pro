
import type { OHLCV, TechnicalIndicators, Signals } from '../types';
import { calculateFactorAttribution } from './factorAttributionService';

// Caches to store computed values, preventing redundant calculations for the same data.
const indicatorsCache = new Map<string, TechnicalIndicators>();
const signalsCache = new Map<string, Signals>();

const UI_SUGGESTED_RISK_CAPITAL = 2000; // 2% of a hypothetical 100k portfolio

/**
 * Creates a unique cache key from OHLCV data.
 */
const createOhlcvCacheKey = (data: OHLCV[]): string => {
    if (data.length === 0) return 'no_data';
    const first = data[0];
    const last = data[data.length - 1];
    return `len:${data.length}-start:${first.date}/${first.close}-end:${last.date}/${last.close}`;
};


export const calculateEMA = (data: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const emaArray: number[] = Array(data.length).fill(NaN);

    let startIndex = -1;
    for (let i = 0; i <= data.length - period; i++) {
        const window = data.slice(i, i + period);
        if (window.every(v => !isNaN(v))) {
            startIndex = i;
            break;
        }
    }
    
    if (startIndex === -1) {
        return emaArray;
    }

    const initialWindow = data.slice(startIndex, startIndex + period);
    const sma = initialWindow.reduce((a, b) => a + b, 0) / period;
    
    let lastEma = sma;
    emaArray[startIndex + period - 1] = lastEma;

    for (let i = startIndex + period; i < data.length; i++) {
        const currentValue = data[i];
        if (isNaN(currentValue)) {
            emaArray[i] = lastEma;
        } else {
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
}

export const calculateADX = (data: OHLCV[], period = 14) => {
    if (data.length < period * 2) {
        return { 
            adx: Array(data.length).fill(NaN), 
            plusDI: Array(data.length).fill(NaN), 
            minusDI: Array(data.length).fill(NaN) 
        };
    }

    const trs: number[] = [];
    const plusDMs: number[] = [];
    const minusDMs: number[] = [];

    for (let i = 1; i < data.length; i++) {
        const high = data[i].high;
        const low = data[i].low;
        const prevHigh = data[i - 1].high;
        const prevLow = data[i - 1].low;
        const prevClose = data[i - 1].close;

        trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));

        const upMove = high - prevHigh;
        const downMove = prevLow - low;
        plusDMs.push((upMove > downMove && upMove > 0) ? upMove : 0);
        minusDMs.push((downMove > upMove && downMove > 0) ? downMove : 0);
    }
    
    const atr = calculateEMA(trs, period);
    const smoothedPlusDM = calculateEMA(plusDMs, period);
    const smoothedMinusDM = calculateEMA(minusDMs, period);

    const plusDIs: number[] = [];
    const minusDIs: number[] = [];
    
    for (let i = period - 1; i < atr.length; i++) {
        plusDIs.push((smoothedPlusDM[i] / (atr[i] || 1)) * 100);
        minusDIs.push((smoothedMinusDM[i] / (atr[i] || 1)) * 100);
    }

    const dxs: number[] = [];
    for (let i = 0; i < plusDIs.length; i++) {
        const diSum = plusDIs[i] + minusDIs[i];
        dxs.push(diSum === 0 ? 0 : (Math.abs(plusDIs[i] - minusDIs[i]) / diSum) * 100);
    }
    
    const adx = calculateEMA(dxs, period);
    const padding = Array(data.length - adx.length).fill(NaN);
    
    return {
      adx: [...padding, ...adx],
      plusDI: [...padding, ...plusDIs],
      minusDI: [...padding, ...minusDIs]
    };
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

const calculateStochRSI = (rsi: number[], period = 14): number[] => {
    if (rsi.length < period) return Array(rsi.length).fill(NaN);
    const stochRsi: number[] = Array(period - 1).fill(NaN);
    for (let i = period - 1; i < rsi.length; i++) {
        const slice = rsi.slice(i - period + 1, i + 1).filter(v => !isNaN(v));
        if (slice.length === 0) {
            stochRsi.push(NaN);
            continue;
        }
        const currentRsi = slice[slice.length - 1];
        const lowestRsi = Math.min(...slice);
        const highestRsi = Math.max(...slice);
        const denominator = highestRsi - lowestRsi;
        stochRsi.push(denominator === 0 ? 0 : 100 * (currentRsi - lowestRsi) / denominator);
    }
    return stochRsi;
};

const calculateMACD = (data: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    const emaFast = calculateEMA(data, fastPeriod);
    const emaSlow = calculateEMA(data, slowPeriod);
    const macdLine: number[] = [];
    for (let i = 0; i < data.length; i++) {
        macdLine.push(emaFast[i] - emaSlow[i]);
    }
    const validMacdLine = macdLine.slice(slowPeriod - 1).filter(v => !isNaN(v));
    const signalLineEma = calculateEMA(validMacdLine, signalPeriod);
    const macdSignal = [...Array(data.length - signalLineEma.length).fill(NaN), ...signalLineEma];
    return { macdLine, macdSignal };
};

const calculateOBV = (data: OHLCV[]): number[] => {
    if (data.length === 0) return [];
    const obv: number[] = [0];
    for (let i = 1; i < data.length; i++) {
        const current = data[i];
        const prev = data[i - 1];
        if (current.close > prev.close) {
            obv.push(obv[i - 1] + current.volume);
        } else if (current.close < prev.close) {
            obv.push(obv[i - 1] - current.volume);
        } else {
            obv.push(obv[i - 1]);
        }
    }
    return obv;
};

const calculateAVDM = (data: OHLCV[]): number[] => {
    return data.map(d => {
        if (d.close > d.open) return d.volume;
        if (d.close < d.open) return -d.volume;
        return 0;
    });
};


export const calculateIndicators = (data: OHLCV[]): TechnicalIndicators => {
    const cacheKey = createOhlcvCacheKey(data);
    if (indicatorsCache.has(cacheKey)) {
        return indicatorsCache.get(cacheKey)!;
    }

    const volumes = data.map(d => d.volume);
    const closes = data.map(d => d.close);
    
    const atr = calculateATR(data, 14);
    const atr7 = calculateATR(data, 7); 
    
    const { adx, plusDI, minusDI } = calculateADX(data, 14);
    const avgVolume = volumes.slice(-20).reduce((a,b) => a+b, 0) / Math.min(20, volumes.length);

    const rvol: number[] = Array(20).fill(NaN);
    for (let i = 20; i < volumes.length; i++) {
        const avg = volumes.slice(i - 20, i).reduce((sum, v) => sum + v, 0) / 20;
        rvol.push(avg > 0 ? volumes[i] / avg : 0);
    }
    
    const logReturns: number[] = [NaN];
    for(let i=1; i<closes.length; i++) {
        if(closes[i-1] > 0) {
            logReturns.push(Math.log(closes[i] / closes[i-1]));
        } else {
            logReturns.push(NaN);
        }
    }
    const xt = logReturns.map((lr, i) => lr * (rvol[i] || 0));
    const ema9Xt = calculateEMA(xt, 9);
    const ema21Xt = calculateEMA(xt, 21);

    const volEma5 = calculateEMA(volumes, 5);
    const volEma20 = calculateEMA(volumes, 20);
    const ema9 = calculateEMA(closes, 9);
    const ema10 = calculateEMA(closes, 10);
    const ema13 = calculateEMA(closes, 13);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);
    const ema200 = calculateEMA(closes, 200);

    const { macdLine, macdSignal } = calculateMACD(closes);
    const rsi = calculateRSI(closes);
    const stochRsi = calculateStochRSI(rsi);
    const obv = calculateOBV(data);
    const avdm = calculateAVDM(data);

    const volatilityPct = atr.map((val, i) => (closes[i] ? (val / closes[i]) * 100 : 0));

    const indicators: TechnicalIndicators = {
        atr, atr7, adx, plusDI, minusDI, avgVolume, rvol, volatilityPct,
        volEma5, volEma20, ema9, ema10, ema13, ema200, macdLine, macdSignal,
        rsi, stochRsi, sma20, sma50, sma200, obv, avdm, xt, ema9Xt, ema21Xt
    };

    indicatorsCache.set(cacheKey, indicators);
    return indicators;
};

export const generateSignals = (indicators: TechnicalIndicators, historical: OHLCV[], niftyUptrend: boolean = true): Signals => {
    const lastIndex = historical.length - 1;
    const currentData = historical[lastIndex];

    const getVal = (arr: number[], idx: number) => arr[idx] || 0;

    const rvol = getVal(indicators.rvol, lastIndex);
    const adx = getVal(indicators.adx, lastIndex);
    const plusDI = getVal(indicators.plusDI, lastIndex);
    const minusDI = getVal(indicators.minusDI, lastIndex);
    const volEma5 = getVal(indicators.volEma5, lastIndex);
    const volEma20 = getVal(indicators.volEma20, lastIndex);
    const ema10 = getVal(indicators.ema10, lastIndex);

    let volumeSignal: 'Spike' | 'Normal' = 'Normal';
    let volumeSpikeSignalDate = '';
    
    for (let i = lastIndex; i >= Math.max(0, lastIndex - 5); i--) {
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

    let volumeEmaSignal: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
    if (volEma5 > volEma20) volumeEmaSignal = 'Bullish';
    else if (volEma5 < volEma20) volumeEmaSignal = 'Bearish';

    const volumeStatus = rvol > 1.5 ? 'High 🔺' : rvol < 0.5 ? 'Low 🔻' : 'Average ➖';
    const priceAboveEma10 = currentData.close > ema10;

    // --- Corrected Stop Loss & Target Logic ---
    const atr7 = getVal(indicators.atr7, lastIndex);
    let stopLoss = 0;
    let target = 0;
    let risk = 0;

    if (trendSignal === 'Downtrend') {
        // SELL Logic: SL is ABOVE current price
        stopLoss = currentData.close + (3 * atr7);
        risk = stopLoss - currentData.close;
        target = currentData.close - (2 * risk); // TP is BELOW current price
    } else {
        // BUY Logic: SL is BELOW current price
        stopLoss = currentData.close - (3 * atr7);
        risk = currentData.close - stopLoss;
        target = currentData.close + (2 * risk); // TP is ABOVE current price
    }
    
    const suggestedShares = risk > 0 ? Math.floor(UI_SUGGESTED_RISK_CAPITAL / risk) : 0; 

    // --- VWLM ---
    let vwlmBuy = false;
    let vwlmBuyDate = '';
    let vwlmSell = false;
    let vwlmSellDate = '';
    let vwlmStrength = getVal(indicators.xt, lastIndex);
    let vwlmStop = 0;
    let vwlmTgt = 0;

    for (let i = lastIndex; i >= Math.max(21, lastIndex - 5); i--) {
        const ema9Xt = getVal(indicators.ema9Xt, i);
        const ema21Xt = getVal(indicators.ema21Xt, i);
        const ema9XtPrev = getVal(indicators.ema9Xt, i - 1);
        const ema21XtPrev = getVal(indicators.ema21Xt, i - 1);
        const xt = getVal(indicators.xt, i);
        const rsi = getVal(indicators.rsi, i);
        const adxVal = getVal(indicators.adx, i);

        if (ema9XtPrev <= ema21XtPrev && ema9Xt > ema21Xt && xt >= 0.1 && adxVal > 25 && rsi > 50) {
            vwlmBuy = true;
            vwlmBuyDate = historical[i].date;
            const atr7Val = getVal(indicators.atr7, i);
            vwlmStop = historical[i].close - (2 * atr7Val);
            vwlmTgt = historical[i].close + (4 * atr7Val);
            break;
        }
        if (ema9XtPrev >= ema21XtPrev && ema9Xt < ema21Xt && xt <= -0.1 && adxVal > 25 && rsi < 50) {
            vwlmSell = true;
            vwlmSellDate = historical[i].date;
            const atr7Val = getVal(indicators.atr7, i);
            vwlmStop = historical[i].close + (2 * atr7Val);
            vwlmTgt = historical[i].close - (4 * atr7Val);
            break;
        }
    }
    
    if (!niftyUptrend) {
        if (volumeSignal === 'Spike') volumeSignal = 'Normal';
        if (vwlmBuy) {
            vwlmBuy = false;
            vwlmBuyDate = '';
        }
    }

    const factors = calculateFactorAttribution(indicators, historical);

    return {
        volumeSignal,
        trendSignal,
        volumeEmaSignal,
        volumeSpikeSignalDate,
        stopLoss,
        target,
        volumeStatus: volumeStatus as any,
        priceAboveEma10,
        suggestedShares,

        vwlmBuySignal: vwlmBuy,
        vwlmBuySignalDate: vwlmBuyDate,
        vwlmSellSignal: vwlmSell,
        vwlmSellSignalDate: vwlmSellDate,
        vwlmStrength,
        vwlmStopLoss: vwlmStop,
        vwlmTarget: vwlmTgt,
        
        factors
    };
};
