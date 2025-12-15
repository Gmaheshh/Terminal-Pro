import type { ProcessedStock, RiskAnalysis } from '../types';

const INITIAL_CAPITAL = 100000;

export const calculatePortfolioRisk = (stocks: ProcessedStock[]): RiskAnalysis => {
    let totalExposure = 0;
    let defensiveAllocation = 0;
    let cyclicalAllocation = 0;
    let speculativeAllocation = 0;
    
    let maxSinglePositionRisk = 0;
    let maxSinglePositionTicker = 'N/A';
    
    let weightedAtrSum = 0;
    
    // Tickers that are active in specific strategies
    const volStrategyTickers = new Set<string>();
    const crossStrategyTickers = new Set<string>();
    const vwlmStrategyTickers = new Set<string>();
    
    // Count of strategies each stock appears in
    const strategyCounts: Record<string, number> = {};

    stocks.forEach(stock => {
        let shares = 0;
        let activeInStrategies = 0;

        // Check strategies
        if (stock.signals.volumeSignal === 'Spike' && (stock.signals.trendSignal === 'Uptrend')) {
            shares += stock.signals.suggestedShares || 0;
            volStrategyTickers.add(stock.ticker);
            activeInStrategies++;
        }
        
        if (stock.signals.shortTermCrossBuySignal) {
             // For simplicity in risk calc, we treat cross signal as additional potential exposure
             // In reality, user might pick one strategy, but risk desk assumes worst case (all signals taken)
             shares += stock.signals.suggestedShares || 0;
             crossStrategyTickers.add(stock.ticker);
             activeInStrategies++;
        }

        if (stock.signals.vwlmBuySignal) {
             shares += stock.signals.suggestedShares || 0;
             vwlmStrategyTickers.add(stock.ticker);
             activeInStrategies++;
        }

        if (shares > 0) {
            const positionValue = shares * stock.data.currentPrice;
            totalExposure += positionValue;

            // Concentration Logic
            if (positionValue > maxSinglePositionRisk) {
                maxSinglePositionRisk = positionValue;
                maxSinglePositionTicker = stock.ticker;
            }

            // Volatility Clustering (Sector Proxy)
            const atr = stock.indicators.atr[stock.indicators.atr.length - 1];
            const volatilityPct = (atr / stock.data.currentPrice) * 100;

            if (volatilityPct < 1.5) {
                defensiveAllocation += positionValue;
            } else if (volatilityPct >= 1.5 && volatilityPct <= 2.5) {
                cyclicalAllocation += positionValue;
            } else {
                speculativeAllocation += positionValue;
            }

            // VaR Prep
            weightedAtrSum += (positionValue * volatilityPct);
            
            // Overlap Tracking
            strategyCounts[stock.ticker] = activeInStrategies;
        }
    });

    // Calculate Ratios
    const exposureRatio = totalExposure / INITIAL_CAPITAL;
    
    // Weighted Average Volatility of Portfolio
    const portfolioAvgVol = totalExposure > 0 ? weightedAtrSum / totalExposure : 0;
    
    // Value at Risk (Simple Parametric: 1.65 sigma ~ 95% confidence, but simplified to 1.5x daily vol for retail)
    // "How much could this portfolio drop in a normal bad day?"
    const varDaily = totalExposure * (portfolioAvgVol / 100) * 1.5;

    // Strategy Overlap Calculation
    // % of stocks that appear in > 1 strategy
    const activeTickers = Object.keys(strategyCounts);
    const multiStrategyTickers = activeTickers.filter(t => strategyCounts[t] > 1).length;
    const strategyOverlap = activeTickers.length > 0 ? (multiStrategyTickers / activeTickers.length) * 100 : 0;

    // Status Determination
    let status: 'SAFE' | 'CAUTION' | 'CRITICAL' = 'SAFE';
    let recommendation = "Portfolio balanced. Execution approved.";

    if (exposureRatio > 1.2 || strategyOverlap > 50) {
        status = 'CRITICAL';
        recommendation = "LIQUIDITY CRUNCH IMMINENT. Reduce position sizing immediately.";
    } else if (exposureRatio > 0.8 || (speculativeAllocation / totalExposure) > 0.6) {
        status = 'CAUTION';
        recommendation = "High beta exposure detected. Tighten stops on speculative assets.";
    }

    return {
        totalCapital: INITIAL_CAPITAL,
        totalExposure,
        exposureRatio,
        varDaily,
        concentration: {
            defensive: totalExposure > 0 ? (defensiveAllocation / totalExposure) * 100 : 0,
            cyclical: totalExposure > 0 ? (cyclicalAllocation / totalExposure) * 100 : 0,
            speculative: totalExposure > 0 ? (speculativeAllocation / totalExposure) * 100 : 0,
        },
        strategyOverlap,
        maxSinglePositionRisk: totalExposure > 0 ? (maxSinglePositionRisk / totalExposure) * 100 : 0,
        maxSinglePositionTicker,
        status,
        recommendation
    };
};