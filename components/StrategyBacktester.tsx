

import React, { useState, useMemo } from 'react';
import type { PortfolioBacktestResult } from '../types';
import TradeTable from './TradeTable';

interface StrategyBacktesterProps {
    results: PortfolioBacktestResult[];
}

const STRATEGIES = ["Volatility Breakout", "Short-term Crossover", "VWLM"];
const PERIODS: PortfolioBacktestResult['period'][] = ['1Y', '3Y', '5Y', '10Y'];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const StatCard: React.FC<{ label: string, value: string, color?: string }> = ({ label, value, color = 'text-white' }) => (
    <div className="bg-bb-panel border border-bb-border p-3">
        <p className="text-[10px] text-bb-muted uppercase tracking-wider">{label}</p>
        <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
);

const Selector: React.FC<{ label: string, value: string, options: string[], onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, value, options, onChange }) => (
    <div>
        <label htmlFor={label} className="block text-[10px] font-bold text-bb-orange uppercase mb-1">{label}</label>
        <select
            id={label}
            value={value}
            onChange={onChange}
            className="block w-full pl-3 pr-10 py-2 text-xs bg-bb-black border border-bb-border text-bb-text focus:outline-none focus:border-bb-orange rounded-none font-mono uppercase"
        >
            {options.map(opt => <option key={opt}>{opt}</option>)}
        </select>
    </div>
);


const StrategyBacktester: React.FC<StrategyBacktesterProps> = ({ results }) => {
    const [selectedStrategy, setSelectedStrategy] = useState(STRATEGIES[0]);
    const [selectedPeriod, setSelectedPeriod] = useState<PortfolioBacktestResult['period']>('5Y');

    const selectedResult = useMemo(() => {
        return results.find(r => r.strategy === selectedStrategy && r.period === selectedPeriod);
    }, [results, selectedStrategy, selectedPeriod]);

    const summaryStats = useMemo(() => {
        if (!selectedResult || selectedResult.trades.length === 0) {
            return { totalPnl: 0, avgReturn: 0, winRate: 0, totalTrades: 0, cagr: 0, maxDrawdown: 0 };
        }
        const totalPnl = selectedResult.trades.reduce((sum, trade) => sum + trade.pnl, 0);
        const avgReturn = selectedResult.trades.reduce((sum, trade) => sum + trade.tradeRoI, 0) / selectedResult.trades.length;
        const winRate = (selectedResult.trades.filter(t => t.pnl > 0).length / selectedResult.trades.length) * 100;
        return {
            totalPnl,
            avgReturn,
            winRate,
            totalTrades: selectedResult.trades.length,
            cagr: selectedResult.cagr,
            maxDrawdown: selectedResult.maxDrawdown
        };
    }, [selectedResult]);

    const { topWinners, topLosers } = useMemo(() => {
        if (!selectedResult) return { topWinners: [], topLosers: [] };

        const sortedByPnl = [...selectedResult.trades].sort((a, b) => b.pnl - a.pnl);
        const winners = sortedByPnl.filter(t => t.pnl > 0).slice(0, 10);
        const losers = sortedByPnl.filter(t => t.pnl <= 0).reverse().slice(0, 10);
        
        return { topWinners: winners, topLosers: losers };

    }, [selectedResult]);
    
    const pnlColor = summaryStats.totalPnl >= 0 ? 'text-bb-green' : 'text-bb-red';
    const avgReturnColor = summaryStats.avgReturn >= 0 ? 'text-bb-green' : 'text-bb-red';

    return (
        <div className="p-4 space-y-6 font-mono h-full overflow-y-auto">
            <div className="bg-bb-dark border border-bb-border p-4">
                <h2 className="text-sm font-bold text-bb-orange uppercase tracking-wider mb-4 border-b border-bb-border pb-2">>> STRATEGY ANALYSIS KERNEL</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Selector label="Algorithm" value={selectedStrategy} options={STRATEGIES} onChange={(e) => setSelectedStrategy(e.target.value)} />
                    <Selector label="Timeframe" value={selectedPeriod} options={PERIODS} onChange={(e) => setSelectedPeriod(e.target.value as any)} />
                </div>
            </div>

            {selectedResult ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                        <StatCard label="Total P/L" value={currencyFormatter.format(summaryStats.totalPnl)} color={pnlColor} />
                        <StatCard label="Avg ROI" value={`${summaryStats.avgReturn.toFixed(2)}%`} color={avgReturnColor} />
                        <StatCard label="Win Rate" value={`${summaryStats.winRate.toFixed(1)}%`} />
                        <StatCard label="Trades" value={summaryStats.totalTrades.toString()} />
                        <StatCard label="CAGR" value={`${summaryStats.cagr.toFixed(2)}%`} color="text-bb-blue" />
                        <StatCard label="Max Drawdown" value={`-${summaryStats.maxDrawdown.toFixed(2)}%`} color="text-bb-red" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TradeTable trades={topWinners} title="TOP GAINERS" />
                        <TradeTable trades={topLosers} title="TOP LOSERS" />
                    </div>

                    <div>
                        <TradeTable trades={selectedResult.trades} title="FULL LEDGER" />
                    </div>
                </>
            ) : (
                <div className="text-center py-20 text-bb-muted uppercase bg-bb-panel border border-bb-border border-dashed">
                    <p>// NO DATASETS FOUND FOR SELECTION //</p>
                </div>
            )}
        </div>
    );
};

export default StrategyBacktester;