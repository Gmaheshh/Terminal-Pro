
import type { ProcessedStock, PortfolioBacktestResult, Trade, EquityPoint, StockData } from '../types';
import { calculateIndicators } from './technicalAnalysisService';

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
const RISK_PERCENT_PER_TRADE = 0.02; 
const MAX_POSITION_PERCENT = 0.25; 
const SLIPPAGE_PER_SIDE = 0.0005; // 0.05% slippage on entry and exit

/**
 * Calculates Indian market charges (Brokerage, STT, Transaction Charges, GST, SEBI, Stamp Duty)
 * Assumes Equity Delivery as it's a daily timeframe simulation.
 */
const calculateCharges = (turnover: number, side: 'BUY' | 'SELL'): number => {
    const brokerage = Math.min(20, turnover * 0.0003); // Flat 20 or 0.03%
    const stt = turnover * 0.001; // 0.1% on both buy and sell for delivery
    const transactionCharge = turnover * 0.0000345; // 0.00345%
    const sebiCharge = turnover * 0.0000001; // ₹10 / Crore
    const gst = (brokerage + transactionCharge) * 0.18; // 18% on Brokerage + Trxn
    const stampDuty = side === 'BUY' ? turnover * 0.00015 : 0; // 0.015% on buy only

    return brokerage + stt + transactionCharge + sebiCharge + gst + stampDuty;
};

const runBenchmarkSimulation = (niftyData: StockData): PortfolioBacktestResult[] => {
    const results: PortfolioBacktestResult[] = [];

    for (const period of BACKTEST_PERIODS) {
        const startDate = new Date(new Date().setDate(new Date().getDate() - period.years * 365));
        const historical = niftyData.historical.filter(d => new Date(d.date) >= startDate);

        if (historical.length < 2) continue;

        const startPrice = historical[0].close;
        const entryCharges = calculateCharges(INITIAL_CAPITAL, 'BUY');
        const netInitialCapital = INITIAL_CAPITAL - entryCharges;
        const shares = netInitialCapital / startPrice;
        
        const equityCurve: EquityPoint[] = historical.map(d => ({
            time: d.date,
            value: d.close * shares
        }));

        const rawFinalValue = equityCurve[equityCurve.length - 1].value;
        const exitCharges = calculateCharges(rawFinalValue, 'SELL');
        const finalCapital = rawFinalValue - exitCharges;
        
        const totalReturn = ((finalCapital - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;
        const cagr = (Math.pow(finalCapital / INITIAL_CAPITAL, 1 / period.years) - 1) * 100;

        let maxDrawdown = 0;
        let peak = 0;
        equityCurve.forEach(pt => {
            if (pt.value > peak) peak = pt.value;
            const dd = peak === 0 ? 0 : ((peak - pt.value) / peak) * 100;
            if (dd > maxDrawdown) maxDrawdown = dd;
        });

        results.push({
            strategy: "Benchmark (Nifty 50)",
            period: period.label,
            totalTrades: 1,
            winRate: finalCapital > INITIAL_CAPITAL ? 100 : 0,
            totalReturn,
            cagr,
            maxDrawdown,
            trades: [{
                ticker: "NIFTY_ETF",
                entryDate: historical[0].date,
                entryPrice: startPrice,
                exitDate: historical[historical.length - 1].date,
                exitPrice: historical[historical.length - 1].close,
                pnl: finalCapital - INITIAL_CAPITAL,
                tradeRoI: totalReturn,
                shares,
                entryCapital: INITIAL_CAPITAL,
                exitCapital: finalCapital,
                charges: entryCharges + exitCharges,
                netPnl: finalCapital - INITIAL_CAPITAL
            }],
            initialCapital: INITIAL_CAPITAL,
            finalCapital,
            netFinalCapital: finalCapital,
            netReturn: totalReturn,
            totalCharges: entryCharges + exitCharges,
            equityCurve,
            isBenchmark: true
        });
    }

    return results;
};

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
            if (stock.data.historical.length > 200) {
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
        let totalChargesAccrued = 0;
        const openPositions: BacktestTrade[] = [];
        const closedTrades: BacktestTrade[] = [];
        
        const equityCurve: EquityPoint[] = [];
        let peakEquity = INITIAL_CAPITAL;
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
                    }
                }

                if (exitPrice !== null) {
                    // Apply slippage to exit
                    const actualExitPrice = exitPrice * (1 - SLIPPAGE_PER_SIDE);
                    const turnover = trade.shares * actualExitPrice;
                    const exitCharges = calculateCharges(turnover, 'SELL');
                    
                    trade.exitDate = date;
                    trade.exitPrice = actualExitPrice;
                    trade.exitCondition = exitCondition;
                    trade.exitCapital = turnover - exitCharges;
                    
                    // Note: entryCharges were already deducted at entry
                    trade.charges = (trade.charges || 0) + exitCharges;
                    trade.pnl = trade.exitCapital - trade.entryCapital; 
                    trade.netPnl = trade.pnl;
                    trade.tradeRoI = (trade.netPnl / trade.entryCapital) * 100;
                    
                    totalChargesAccrued += exitCharges;
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

            const signalsForToday = getEntrySignalsForDate(date);
            for (const signal of signalsForToday) {
                if (openPositions.some(p => p.ticker === signal.ticker)) continue; 

                const riskPerShare = signal.entryPrice - signal.stopLoss;
                if (riskPerShare <= 0) continue; 

                const capitalToRisk = currentTotalEquity * RISK_PERCENT_PER_TRADE;
                let shares = Math.floor(capitalToRisk / riskPerShare);
                if (shares === 0) continue;

                const maxPositionCapital = currentTotalEquity * MAX_POSITION_PERCENT;
                
                // Apply slippage to entry
                const entryPriceWithSlippage = signal.entryPrice * (1 + SLIPPAGE_PER_SIDE);
                let entryValue = shares * entryPriceWithSlippage;

                if (entryValue > maxPositionCapital) {
                    shares = Math.floor(maxPositionCapital / entryPriceWithSlippage);
                    entryValue = shares * entryPriceWithSlippage;
                }
                
                if (shares === 0) continue;

                const entryCharges = calculateCharges(entryValue, 'BUY');
                const totalOutflow = entryValue + entryCharges;

                if (availableCapital >= totalOutflow) {
                    availableCapital -= totalOutflow;
                    totalChargesAccrued += entryCharges;
                    
                    openPositions.push({
                        ticker: signal.ticker, entryDate: signal.date, entryPrice: entryPriceWithSlippage,
                        shares, stopLoss: signal.stopLoss, target: signal.target,
                        exitDate: '', exitPrice: 0, pnl: 0, tradeRoI: 0,
                        entryCapital: totalOutflow, 
                        exitCapital: 0,
                        charges: entryCharges,
                        exitCondition: 'Signal',
                    });
                }
            }
        }

        const lastDate = sortedDates[sortedDates.length - 1];
        if (openPositions.length > 0 && lastDate) {
            for (const trade of openPositions) {
                const dayData = dailyDataMap.get(trade.ticker)?.get(lastDate);
                const exitPrice = (dayData?.close || trade.entryPrice) * (1 - SLIPPAGE_PER_SIDE);
                const turnover = trade.shares * exitPrice;
                const exitCharges = calculateCharges(turnover, 'SELL');
                
                trade.exitDate = lastDate;
                trade.exitPrice = exitPrice;
                trade.exitCondition = 'Signal'; 
                trade.exitCapital = turnover - exitCharges;
                trade.charges = (trade.charges || 0) + exitCharges;
                trade.pnl = trade.exitCapital - trade.entryCapital;
                trade.netPnl = trade.pnl;
                trade.tradeRoI = (trade.pnl / trade.entryCapital) * 100;
                
                totalChargesAccrued += exitCharges;
                availableCapital += trade.exitCapital; 
                closedTrades.push(trade);
            }
            openPositions.length = 0;
        }

        const finalCapital = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].value : INITIAL_CAPITAL;
        const winRate = closedTrades.length > 0 ? (closedTrades.filter(t => t.pnl > 0).length / closedTrades.length) * 100 : 0;
        const totalReturn = ((finalCapital - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;
        const cagr = (Math.pow(finalCapital / INITIAL_CAPITAL, 1 / period.years) - 1) * 100;
        
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
            netFinalCapital: finalCapital,
            netReturn: totalReturn,
            totalCharges: totalChargesAccrued,
            equityCurve
        });
    }
    return results;
}


export const runPortfolioSimulation = (stocks: ProcessedStock[], niftyBenchmarkData?: StockData): PortfolioBacktestResult[] => {
    if (stocks.length === 0) return [];

    const volumeSignalMap = new Map<string, any[]>();
    const vwlmBuySignalMap = new Map<string, any[]>();

    for (const stock of stocks) {
        if (stock.data.historical.length < 200) continue;
        
        const indicators = calculateIndicators(stock.data.historical);
        const { historical } = stock.data;
        const { atr7, adx, plusDI, minusDI, xt, ema9Xt, ema21Xt, rsi, isSqueezing, oiChangePct, ema200, rvol } = indicators;

        for (let i = 20; i < historical.length; i++) { 
            const currentDay = historical[i];
            const currentRvol = rvol[i] || 0;
            const wasSqueezing = isSqueezing?.[i-1] || false;
            const nowSqueezing = isSqueezing?.[i] || false;
            const squeezeRelease = wasSqueezing && !nowSqueezing;
            const above200 = currentDay.close > (ema200[i] || 0);
            const oiBuild = oiChangePct[i] || 0;

            if (currentRvol > 2.5 && squeezeRelease && above200 && oiBuild > 1.0) {
                const entryPrice = currentDay.close;
                const stopLoss = entryPrice - (2.5 * (atr7[i] || 1));
                const risk = entryPrice - stopLoss;
                const target = entryPrice + (risk * 3);
                
                const signals = volumeSignalMap.get(currentDay.date) || [];
                signals.push({ date: currentDay.date, ticker: stock.ticker, entryPrice, stopLoss, target });
                volumeSignalMap.set(currentDay.date, signals);
            }
            
            const crossover = ema9Xt[i-1] <= ema21Xt[i-1] && ema9Xt[i] > ema21Xt[i];
            if (crossover && (xt[i] || 0) >= 0.1 && (adx[i] || 0) > 25 && (rsi[i] || 0) > 50 && oiBuild > 0.5) {
                const entryPrice = currentDay.close;
                const stopLoss = entryPrice - (2 * (atr7[i] || 1));
                const target = entryPrice + (4 * (atr7[i] || 1));
                
                const signals = vwlmBuySignalMap.get(currentDay.date) || [];
                signals.push({ date: currentDay.date, ticker: stock.ticker, entryPrice, stopLoss, target });
                vwlmBuySignalMap.set(currentDay.date, signals);
            }
        }
    }

    const volumeResults = runSingleStrategySimulation("Volatility Breakout", stocks, (date) => volumeSignalMap.get(date) || []);
    const vwlmResults = runSingleStrategySimulation("VWLM", stocks, (date) => vwlmBuySignalMap.get(date) || []);
    
    let benchmarkResults: PortfolioBacktestResult[] = [];
    if (niftyBenchmarkData) {
        benchmarkResults = runBenchmarkSimulation(niftyBenchmarkData);
    }

    return [...volumeResults, ...vwlmResults, ...benchmarkResults];
};
