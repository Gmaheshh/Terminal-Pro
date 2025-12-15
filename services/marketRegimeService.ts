import type { ProcessedStock, MarketRegime, RegimeType } from '../types';

export const detectMarketRegime = (stocks: ProcessedStock[]): MarketRegime => {
    if (stocks.length === 0) {
        return {
            type: 'NEUTRAL',
            avgAdx: 0,
            avgVolatility: 0,
            breadthSma50: 0,
            correlation: 0,
            description: 'INSUFFICIENT DATA'
        };
    }

    // 1. Calculate Aggregates
    let totalAdx = 0;
    let totalVolatilityPct = 0;
    let stocksAboveSma50 = 0;
    let advances = 0;
    let declines = 0;

    stocks.forEach(stock => {
        const lastIdx = stock.indicators.adx.length - 1;
        
        // ADX
        totalAdx += stock.indicators.adx[lastIdx] || 0;
        
        // Volatility (ATR / Price)
        totalVolatilityPct += stock.indicators.volatilityPct[lastIdx] || 0;
        
        // Breadth (Above SMA 50)
        const currentPrice = stock.data.currentPrice;
        const sma50 = stock.indicators.sma50[lastIdx];
        if (currentPrice > sma50) stocksAboveSma50++;

        // Direction (Advance/Decline for Correlation)
        const prevClose = stock.data.historical[lastIdx - 1]?.close || currentPrice;
        if (currentPrice > prevClose) advances++;
        else declines++;
    });

    const avgAdx = totalAdx / stocks.length;
    const avgVolatility = totalVolatilityPct / stocks.length;
    const breadthSma50 = (stocksAboveSma50 / stocks.length) * 100;
    
    // Directional Correlation Proxy: |(Advances - Declines)| / Total
    // If everyone moves up (100 - 0), score is 1. If 50/50, score is 0.
    const correlation = Math.abs(advances - declines) / stocks.length;

    // 2. Classification Logic
    let type: RegimeType = 'NEUTRAL';
    let description = 'Market is in equilibrium.';

    // Logic Gate
    if (breadthSma50 < 30 && avgVolatility > 2.0) {
        type = 'RISK_OFF';
        description = 'Capital Preservation Mode. High volatility and weak breadth detected.';
    } else if (avgVolatility > 2.5) {
        type = 'HIGH_VOLATILITY';
        description = 'Dislocated Market. Wide stops required. Reduce position sizing.';
    } else if (avgAdx > 25 && breadthSma50 > 60) {
        type = 'TRENDING';
        description = 'High Momentum. Breakout strategies favored. Aggressive sizing permitted.';
    } else if (avgAdx < 20 && correlation < 0.3) {
        type = 'RANGE_BOUND';
        description = 'Choppy Environment. Breakouts likely to fail. Use mean reversion.';
    } else {
        type = 'NEUTRAL';
        description = 'Mixed signals. Selectivity required.';
    }

    return {
        type,
        avgAdx,
        avgVolatility,
        breadthSma50,
        correlation,
        description
    };
};