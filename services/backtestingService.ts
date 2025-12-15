

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

const INITIAL_CAPITAL = 100000;
const RISK_PERCENT_PER_TRADE = 0.02; // Risk 2% of portfolio per trade
const MAX_POSITION_PERCENT = 0.25; // Max 25% of portfolio in a single position

const runSingleStrategySimulation = (
    strategyName: string,
    stocks: ProcessedStock[],
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

        let availableCapital = INITIAL_CAPITAL;
        const openPositions: BacktestTrade[] = [];
        const closedTrades: BacktestTrade[] = [];
        
        // Metrics tracking
        const equityCurve: EquityPoint[] = [];
        let peakEquity = INITIAL_CAPITAL;
        let maxDrawdown = 0;

        for (const date of sortedDates) {
            // 1. Manage and close existing positions
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
                    
                    availableCapital += trade.exitCapital; // Add capital back on trade close
                    closedTrades.push(trade);
                } else {
                    stillOpenPositions.push(trade);
                }
            }
            openPositions.splice(0, openPositions.length, ...stillOpenPositions);

            // 2. Mark to Market (Calculate Daily Equity)
            let valueOfOpenPositionsToday = 0;
            openPositions.forEach(trade => {
                const dayData = dailyDataMap.get(trade.ticker)?.get(date);
                valueOfOpenPositionsToday += (dayData?.close || trade.entryPrice) * trade.shares;
            });
            const currentTotalEquity = availableCapital + valueOfOpenPositionsToday;
            
            // Record Equity Curve
            equityCurve.push({ time: date, value: currentTotalEquity });

            // Calculate Drawdown
            if (currentTotalEquity > peakEquity) {
                peakEquity = currentTotalEquity;
            }
            const currentDrawdown = ((peakEquity - currentTotalEquity) / peakEquity) * 100;
            if (currentDrawdown > maxDrawdown) {
                maxDrawdown = currentDrawdown;
            }

            // 3. Open New Positions
            const capitalToRisk = currentTotalEquity * RISK_PERCENT_PER_TRADE;
            const maxPositionCapital = currentTotalEquity * MAX_POSITION_PERCENT;

            const signalsForToday = getEntrySignalsForDate(date);
            for (const signal of signalsForToday) {
                if (openPositions.some(p => p.ticker === signal.ticker)) continue; // Don't re-enter if already in a position

                // --- DYNAMIC POSITION SIZING LOGIC ---
                const riskPerShare = signal.entryPrice - signal.stopLoss;
                if (riskPerShare <= 0) continue; // Invalid risk, skip trade

                let shares = Math.floor(capitalToRisk / riskPerShare);
                if (shares === 0) continue;

                let entryCapital = shares * signal.entryPrice;

                // Apply max position size constraint
                if (entryCapital > maxPositionCapital) {
                    shares = Math.floor(maxPositionCapital / signal.entryPrice);
                    entryCapital = shares * signal.entryPrice;
                }
                
                if (shares === 0) continue;
                // --- END DYNAMIC SIZING LOGIC ---

                if (availableCapital >= entryCapital) {
                    availableCapital -= entryCapital; // Deduct capital for new trade
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

        // Final Metrics Calculation
        const finalCapital = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].value : INITIAL_CAPITAL;
        const winRate = closedTrades.length > 0 ? (closedTrades.filter(t => t.pnl > 0).length / closedTrades.length) * 100 : 0;
        const totalReturn = ((finalCapital - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;
        
        // CAGR Calculation: (End / Start) ^ (1 / n) - 1
        // We use the specific duration of data we actually simulated
        const durationYears = period.years; 
        const cagr = (Math.pow(finalCapital / INITIAL_CAPITAL, 1 / durationYears) - 1) * 100;
        
        results.push({
            strategy: strategyName, period: period.label,
            totalTrades: closedTrades.length, 
            winRate, 
            totalReturn,
            cagr,
            maxDrawdown,
            trades: closedTrades,
            initialCapital: INITIAL_CAPITAL, 
            finalCapital: finalCapital,
            equityCurve
        });
    }
    return results;
}


export const runPortfolioSimulation = (stocks: ProcessedStock[]): PortfolioBacktestResult[] => {
    if (stocks.length === 0) return [];

    // --- Generate all historical signals first ---
    const volumeSignalMap = new Map<string, any[]>();
    const shortTermCrossSignalMap = new Map<string, any[]>();
    const shortTermCrossExitSignalMap = new Map<string, any[]>();
    const vwlmBuySignalMap = new Map<string, any[]>();
    const vwlmSellSignalMap = new Map<string, any[]>();


    for (const stock of stocks) {
        if (stock.data.historical.length < 201) continue;
        
        const indicators = calculateIndicators(stock.data.historical);
        const { historical } = stock.data;
        // Use atr7 for risk management
        const { sma20, sma50, rsi, atr, atr7, adx, plusDI, minusDI, xt, ema9Xt, ema21Xt } = indicators;

        for (let i = 200; i < historical.length; i++) { 
            const currentDay = historical[i];
            
            // Volume Spike Logic
            const volume = currentDay.volume;
            const lookbackData = historical.slice(i - 20, i);
            const avgVolume = lookbackData.reduce((sum, day) => sum + day.volume, 0) / 20;
            
            // Use pre-calculated indicators where possible to avoid re-calculation in loop
            if (avgVolume > 0 && volume > (avgVolume * 3)) {
                // Check ADX condition using pre-calculated values
                if (adx[i] > 25 && plusDI[i] > minusDI[i]) {
                    const currentAtr7 = atr7[i];
                    if (currentAtr7 > 0) {
                        const entryPrice = currentDay.close;
                        const stopLoss = entryPrice - (3 * currentAtr7);
                        const risk = entryPrice - stopLoss;
                        const target = entryPrice + (risk * 2);
                        const signal = { date: currentDay.date, ticker: stock.ticker, entryPrice, stopLoss, target };
                        const signals = volumeSignalMap.get(currentDay.date) || [];
                        signals.push(signal);
                        volumeSignalMap.set(currentDay.date, signals);
                    }
                }
            }
            
            // Crossover Logics
            if (sma20[i] && sma50[i] && sma20[i-1] && sma50[i-1]) {
                 // Short-term Crossover (BUY - Golden Cross)
                if (sma20[i - 1] <= sma50[i - 1] && sma20[i] > sma50[i]) {
                    const entryPrice = currentDay.close;
                    const slHistory = historical.slice(Math.max(0, i - 20), i);
                    if (slHistory.length > 0) {
                        const stopLoss = Math.min(...slHistory.map(d => d.low));
                        const tpHistory = historical.slice(Math.max(0, i - 50), i);
                        if(tpHistory.length > 0) {
                            const target = Math.max(...tpHistory.map(d => d.high));
                            const risk = entryPrice - stopLoss;
                            const reward = target - entryPrice;
                            if (risk > 0 && (reward / risk) >= 1.5) {
                                const signal = { date: currentDay.date, ticker: stock.ticker, entryPrice, stopLoss, target };
                                const signals = shortTermCrossSignalMap.get(currentDay.date) || [];
                                signals.push(signal);
                                shortTermCrossSignalMap.set(currentDay.date, signals);
                            }
                        }
                    }
                }

                // Short-term Crossover (EXIT - Death Cross)
                if (sma20[i - 1] >= sma50[i - 1] && sma20[i] < sma50[i]) {
                    const signal = { date: currentDay.date, ticker: stock.ticker };
                    const signals = shortTermCrossExitSignalMap.get(currentDay.date) || [];
                    signals.push(signal);
                    shortTermCrossExitSignalMap.set(currentDay.date, signals);
                }
            }
            
            // VWLM Logic
            if (xt[i] && ema9Xt[i] && ema21Xt[i] && ema9Xt[i-1] && ema21Xt[i-1] && adx[i] && rsi[i] && atr7[i]) {
                // Buy
                if (ema9Xt[i - 1] <= ema21Xt[i - 1] && ema9Xt[i] > ema21Xt[i] && xt[i] >= 0.1 && adx[i] > 25 && rsi[i] > 50) {
                    const entryPrice = currentDay.close;
                    const stopLoss = entryPrice - (2 * atr7[i]);
                    const target = entryPrice + (4 * atr7[i]);
                     if (entryPrice > stopLoss) {
                        const signal = { date: currentDay.date, ticker: stock.ticker, entryPrice, stopLoss, target };
                        const signals = vwlmBuySignalMap.get(currentDay.date) || [];
                        signals.push(signal);
                        vwlmBuySignalMap.set(currentDay.date, signals);
                    }
                }
                // Sell
                if (ema9Xt[i - 1] >= ema21Xt[i - 1] && ema9Xt[i] < ema21Xt[i] && xt[i] <= -0.1 && adx[i] > 25 && rsi[i] < 50) {
                    const signal = { date: currentDay.date, ticker: stock.ticker };
                    const signals = vwlmSellSignalMap.get(currentDay.date) || [];
                    signals.push(signal);
                    vwlmSellSignalMap.set(currentDay.date, signals);
                }
            }
        }
    }

    // --- Run simulations ---
    const volumeResults = runSingleStrategySimulation("Volatility Breakout", stocks, (date) => volumeSignalMap.get(date) || []);
    const stcResults = runSingleStrategySimulation("Short-term Crossover", stocks, (date) => shortTermCrossSignalMap.get(date) || [], (date) => shortTermCrossExitSignalMap.get(date) || []);
    const vwlmResults = runSingleStrategySimulation("VWLM", stocks, (date) => vwlmBuySignalMap.get(date) || [], (date) => vwlmSellSignalMap.get(date) || []);

    return [...volumeResults, ...stcResults, ...vwlmResults];
};