import type { TechnicalIndicators, SignalFactors, OHLCV } from '../types';

const normalize = (val: number, min: number, max: number): number => {
    if (isNaN(val)) return 0;
    const clamped = Math.max(min, Math.min(max, val));
    return ((clamped - min) / (max - min)) * 100;
};

export const calculateFactorAttribution = (
    indicators: TechnicalIndicators, 
    historical: OHLCV[]
): SignalFactors => {
    const last = historical.length - 1;
    
    // 1. Momentum Score
    const momentumScore = 70; // Placeholder for simplified logic

    // 2. Volume Score
    const rvol = indicators.rvol[last] || 1;
    const volumeScore = normalize(rvol, 0.5, 3.5);

    // 3. Trend Score
    const adx = indicators.adx[last] || 0;
    const trendScore = normalize(adx, 15, 50);

    // 4. Volatility Score
    const volPct = indicators.volatilityPct[last] || 1;
    const volatilityScore = normalize(volPct, 0.5, 4.0);

    // 5. Institutional Footprint (Open Interest)
    const oiChange = indicators.oiChangePct[last] || 0;
    const institutionalScore = normalize(oiChange, -5, 10);

    const scores = [
        { key: 'MOMENTUM', val: momentumScore },
        { key: 'VOLUME', val: volumeScore },
        { key: 'TREND', val: trendScore },
        { key: 'VOLATILITY', val: volatilityScore },
        { key: 'INSTITUTIONAL', val: institutionalScore }
    ];
    
    scores.sort((a, b) => b.val - a.val);
    
    let dominantFactor: SignalFactors['dominantFactor'] = scores[0].key as any;
    if (scores[0].val - scores[1].val < 10) {
        dominantFactor = 'BALANCED';
    }

    return {
        momentum: Math.round(momentumScore),
        volume: Math.round(volumeScore),
        trend: Math.round(trendScore),
        volatility: Math.round(volatilityScore),
        institutional: Math.round(institutionalScore),
        dominantFactor
    };
};
