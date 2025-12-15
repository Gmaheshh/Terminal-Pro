import type { TechnicalIndicators, SignalFactors, OHLCV } from '../types';

/**
 * Normalizes a value to a 0-100 score based on min/max bounds.
 */
const normalize = (val: number, min: number, max: number): number => {
    if (isNaN(val)) return 0;
    const clamped = Math.max(min, Math.min(max, val));
    return ((clamped - min) / (max - min)) * 100;
};

/**
 * Calculates the Factor Attribution for a stock.
 * Explains WHY a signal might exist by breaking it down into component drivers.
 */
export const calculateFactorAttribution = (
    indicators: TechnicalIndicators, 
    historical: OHLCV[]
): SignalFactors => {
    const last = historical.length - 1;
    const currentPrice = historical[last].close;

    // 1. Momentum Score (Velocity)
    // - RSI: > 50 is bullish, > 70 is strong (but maybe overbought, we treat high RSI as high momentum)
    // - Price vs EMA9: Being above short-term EMA implies momentum.
    // - MACD: Histogram > 0 implies momentum.
    const rsi = indicators.rsi[last] || 50;
    const rsiScore = normalize(rsi, 40, 80); // RSI 40=0, 80=100
    
    const ema9 = indicators.ema9[last] || currentPrice;
    const priceVsEmaScore = currentPrice > ema9 ? 75 : 25;
    
    const macdHist = (indicators.macdLine[last] - indicators.macdSignal[last]) || 0;
    const macdScore = macdHist > 0 ? 80 : 20;

    const momentumScore = (rsiScore * 0.4) + (priceVsEmaScore * 0.3) + (macdScore * 0.3);

    // 2. Volume Score (Conviction)
    // - RVOL: > 1 is good, > 3 is extreme.
    // - OBV Slope: Check last 5 days.
    const rvol = indicators.rvol[last] || 1;
    const rvolScore = normalize(rvol, 0.5, 3.5); // RVOL 0.5=0, 3.5=100
    
    const obvCurrent = indicators.obv[last] || 0;
    const obv5Ago = indicators.obv[last - 5] || 0;
    const obvTrending = obvCurrent > obv5Ago;
    const obvScore = obvTrending ? 80 : 20;

    const volumeScore = (rvolScore * 0.7) + (obvScore * 0.3);

    // 3. Trend Score (Persistence)
    // - ADX: > 25 is trending.
    // - DI Spread: +DI > -DI is bullish trend.
    const adx = indicators.adx[last] || 0;
    const adxScore = normalize(adx, 15, 50); // ADX 15=0, 50=100
    
    const plusDI = indicators.plusDI[last] || 0;
    const minusDI = indicators.minusDI[last] || 0;
    const diScore = plusDI > minusDI ? 80 : 20;

    const trendScore = (adxScore * 0.6) + (diScore * 0.4);

    // 4. Volatility Score (Opportunity Magnitude)
    // - Volatility%: Higher volatility often accompanies breakouts (though adds risk).
    // - ATR Expansion: Current ATR vs ATR(20).
    const volPct = indicators.volatilityPct[last] || 1;
    const volScoreRaw = normalize(volPct, 0.5, 4.0); // 0.5% daily move to 4% daily move
    
    const atr = indicators.atr[last] || 0;
    const atr20 = indicators.atr[last-20] || atr; // approximate lookback check
    const atrExpansion = atr > atr20 ? 80 : 40;

    const volatilityScore = (volScoreRaw * 0.5) + (atrExpansion * 0.5);

    // Determine Dominant Factor
    const scores = [
        { key: 'MOMENTUM', val: momentumScore },
        { key: 'VOLUME', val: volumeScore },
        { key: 'TREND', val: trendScore },
        { key: 'VOLATILITY', val: volatilityScore }
    ];
    
    // Sort descending
    scores.sort((a, b) => b.val - a.val);
    
    // Check if balanced (top two are close)
    let dominantFactor: SignalFactors['dominantFactor'] = scores[0].key as any;
    if (scores[0].val - scores[1].val < 10) {
        dominantFactor = 'BALANCED';
    }

    return {
        momentum: Math.round(momentumScore),
        volume: Math.round(volumeScore),
        trend: Math.round(trendScore),
        volatility: Math.round(volatilityScore),
        dominantFactor
    };
};