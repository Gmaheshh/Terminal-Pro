import type { ProcessedStock, PortfolioBacktestResult, Trade, EquityPoint } from '../types';
import { calculateATR, calculateADX, calculateSMA, calculateIndicators } from './technicalAnalysisService';

interface BacktestTrade extends Trade {
    stopLoss: number;
    target: number;
    exitCondition?: 'SL' | 'TP' | 'Death Cross' | 'Signal';
}

type BacktestPeriod = {
    years: number;
    label: '1Y' | '3Y' | '5Y' | '10Y';
};

const BACKTEST_PERIODS: BacktestPeriod[] = [
    { years: 1, label: '1Y' },
    { years: 3, label: '3Y' },
    { years: 5, label: '5Y' },
    { years: 10, label: '10Y' },
];

const RISK_PERCENT_PER_TRADE = 0.02; // FIXED 2% FOR BACKTEST
const MAX_POSITION_PERCENT = 0.25; // FIXED 25% FOR BACKTEST

const runSingleStrategySimulation = (
    strategyName: string,
    stocks: ProcessedStock[],
    initialCapital: number,
    getEntrySignalsForDate: (date: string) => any[],
    getExitSignalsForDate?: (date: string) => any[]
): PortfolioBacktestResult[] => {
    
    const results: PortfolioBacktestResult[] = [];

    for (const period of BACKTEST_PERIODS) {
        const startDate = new Date(new Date().setDate(new Date().getDate() - period.years * 365));
        
        const allDates = new Set<string>();
        const dailyDataMap = new Map<string, Map<string, { close: number; high: number; low: number; }>>();

        stocks.forEach(stock => {
            if (stock.data.historical.length > 252 * period.years) {
                stock.data.historical.forEach(d => {
                    if (new Date(d.date) >= startDate) {
                        allDates.add(d.date);
                    }
                });
                
                const stockDailyData = new Map<string, { close: number; high: number; low: number; }>();
                stock.data.historical.forEach((day) => {
                    stockDailyData.set(day.date, { close: day.close, high: day.high, low: day.low });
                });
                dailyDataMap.set(stock.ticker, stockDailyData);
            }
        });
        
        const sortedDates = Array.from(allDates).sort();
        if (sortedDates.length === 0) continue;

        let availableCapital = initialCapital;
        const openPositions: BacktestTrade[] = [];
        const closedTrades: BacktestTrade[] = [];
        
        const equityCurve: EquityPoint[] = [];
        let peakEquity = initialCapital;
        let maxDrawdown = 0;

        for (const date of sortedDates) {
            const stillOpenPositions: BacktestTrade[] = [];
            for (const trade of openPositions) {
                const dayData = dailyDataMap.get(trade.ticker)?.get(date);
                let exitPrice: number | null = null;
                let exitCondition: BacktestTrade['exitCondition'] = undefined;

                if (dayData && date > trade.entryDate) {
                    if (dayData.low <= trade.stopLoss) {
                        exitPrice = trade.stopLoss;
                        exitCondition = 'SL';
                    } else if (dayData.high >= trade.target) {
                        exitPrice = trade.target;
                        exitCondition = 'TP';
                    } else if (getExitSignalsForDate && getExitSignalsForDate(date)?.some(s => s.ticker === trade.ticker)) {
                        exitPrice = dayData.close;
                        exitCondition = 'Signal';
                    } else if (trade.exitCondition === 'Death Cross') {
                         exitPrice = dayData.close;
                    }
                }

                if (exitPrice !== null) {
                    trade.exitDate = date;
                    trade.exitPrice = exitPrice;
                    trade.exitCondition = exitCondition;
                    
                    trade.exitCapital = trade.shares * trade.exitPrice;
                    trade.tradeRoI = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
                    trade.pnl = (trade.exitPrice - trade.entryPrice) * trade.shares;
                    
                    availableCapital += trade.exitCapital; 
                    closedTrades.push(trade);
                } else {
                    stillOpenPositions.push(trade);
                }
            }
            openPositions.splice(0, openPositions.length, ...stillOpenPositions);

            let valueOfOpenPositionsToday = 0;
            openPositions.forEach(trade => {
                const dayData = dailyDataMap.get(trade.ticker)?.get(date);
                valueOfOpenPositionsToday += (dayData?.close || trade.entryPrice) * trade.shares;
            });
            const currentTotalEquity = availableCapital + valueOfOpenPositionsToday;
            
            equityCurve.push({ time: date, value: currentTotalEquity });

            if (currentTotalEquity > peakEquity) {
                peakEquity = currentTotalEquity;
            }
            const currentDrawdown = peakEquity === 0 ? 0 : ((peakEquity - currentTotalEquity) / peakEquity) * 100;
            if (currentDrawdown > maxDrawdown) {
                maxDrawdown = currentDrawdown;
            }

            const capitalToRisk = currentTotalEquity * RISK_PERCENT_PER_TRADE;
            const maxPositionCapital = currentTotalEquity * MAX_POSITION_PERCENT;

            const signalsForToday = getEntrySignalsForDate(date);
            for (const signal of signalsForToday) {
                if (openPositions.some(p => p.ticker === signal.ticker)) continue;

                const riskPerShare = Math.abs(signal.entryPrice - signal.stopLoss);
                if (riskPerShare <= 0) continue;

                let shares = Math.floor(capitalToRisk / riskPerShare);
                if (shares === 0) continue;

                let entryCapital = shares * signal.entryPrice;

                if (entryCapital > maxPositionCapital) {
                    shares = Math.floor(maxPositionCapital / signal.entryPrice);
                    entryCapital = shares * signal.entryPrice;
                }
                
                if (shares === 0) continue;

                if (availableCapital >= entryCapital) {
                    availableCapital -= entryCapital;
                    openPositions.push({
                        ticker: signal.ticker, entryDate: signal.date, entryPrice: signal.entryPrice,
                        shares, stopLoss: signal.stopLoss, target: signal.target,
                        exitDate: '', exitPrice: 0, pnl: 0, tradeRoI: 0,
                        entryCapital: entryCapital, 
                        exitCapital: 0,
                        exitCondition: signal.exitCondition,
                    });
                }
            }
        }

        const finalCapital = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].value : initialCapital;
        const winRate = closedTrades.length > 0 ? (closedTrades.filter(t => t.pnl > 0).length / closedTrades.length) * 100 : 0;
        const totalReturn = ((finalCapital - initialCapital) / initialCapital) * 100;
        const durationYears = period.years; 
        const cagr = (Math.pow(finalCapital / initialCapital, 1 / durationYears) - 1) * 100;
        
        results.push({
            strategy: strategyName, period: period.label,
            totalTrades: closedTrades.length, 
            winRate, 
            totalReturn,
            cagr,
            maxDrawdown,
            trades: closedTrades,
            initialCapital: initialCapital, 
            finalCapital: finalCapital,
            equityCurve,
            totalCharges: 0,
            netReturn: totalReturn,
            netFinalCapital: finalCapital
        });
    }
    return results;
}


export const runPortfolioSimulation = (stocks: ProcessedStock[], initialCapital: number = 100000, niftyUptrendMap?: Map<string, boolean>): PortfolioBacktestResult[] => {
    if (stocks.length === 0) return [];

    const volumeSignalMap = new Map<string, any[]>();
    const vwlmBuySignalMap = new Map<string, any[]>();
    const vwlmSellSignalMap = new Map<string, any[]>();

    for (const stock of stocks) {
        if (stock.data.historical.length < 201) continue;
        
        const indicators = calculateIndicators(stock.data.historical);
        const { historical } = stock.data;
        const { atr7, adx, plusDI, minusDI, xt, ema9Xt, ema21Xt, rsi } = indicators;

        for (let i = 200; i < historical.length; i++) { 
            const currentDay = historical[i];
            
            // Fixed niftyUptrendMap check to ensure initialCapital (2nd arg) isn't used as Map
            const isMarketUptrend = (niftyUptrendMap && typeof (niftyUptrendMap as any).get === 'function') 
                ? (niftyUptrendMap as any).get(currentDay.date) ?? true 
                : true;
            
            const volume = currentDay.volume;
            const avgVolume = historical.slice(i - 20, i).reduce((sum, day) => sum + day.volume, 0) / 20;
            
            if (avgVolume > 0 && volume > (avgVolume * 3)) {
                if (adx[i] > 25 && plusDI[i] > minusDI[i] && isMarketUptrend) {
                    const currentAtr7 = atr7[i];
                    if (currentAtr7 > 0) {
                        const entryPrice = currentDay.close;
                        const stopLoss = entryPrice - (3 * currentAtr7);
                        const risk = entryPrice - stopLoss;
                        const target = entryPrice + (risk * 2);
                        const signals = volumeSignalMap.get(currentDay.date) || [];
                        signals.push({ date: currentDay.date, ticker: stock.ticker, entryPrice, stopLoss, target });
                        volumeSignalMap.set(currentDay.date, signals);
                    }
                }
            }
            
            if (xt[i] && ema9Xt[i] && ema21Xt[i] && ema9Xt[i-1] && ema21Xt[i-1] && adx[i] && rsi[i] && atr7[i]) {
                if (ema9Xt[i - 1] <= ema21Xt[i - 1] && ema9Xt[i] > ema21Xt[i] && xt[i] >= 0.1 && adx[i] > 25 && rsi[i] > 50 && isMarketUptrend) {
                    const entryPrice = currentDay.close;
                    const stopLoss = entryPrice - (2 * atr7[i]);
                    const target = entryPrice + (4 * atr7[i]);
                     if (entryPrice > stopLoss) {
                        const signals = vwlmBuySignalMap.get(currentDay.date) || [];
                        signals.push({ date: currentDay.date, ticker: stock.ticker, entryPrice, stopLoss, target });
                        vwlmBuySignalMap.set(currentDay.date, signals);
                    }
                }
            }
        }
    }

    const volumeResults = runSingleStrategySimulation("Volatility Breakout", stocks, initialCapital, (date) => volumeSignalMap.get(date) || []);
    const vwlmResults = runSingleStrategySimulation("VWLM", stocks, initialCapital, (date) => vwlmBuySignalMap.get(date) || []);

    return [...volumeResults, ...vwlmResults];
};