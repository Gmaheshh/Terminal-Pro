
import React, { useState, useEffect, useMemo } from 'react';
import type { ProcessedStock, OptionChain, DerivativeStrategy, DerivativeMetrics } from '../types';
import { fetchOptionChain } from '../services/stockDataService';
import { getDerivativeStrategy } from '../services/geminiService';
import { Loader } from './Loader';
import { BrainCircuitIcon } from './Icons';
import { AllFOTickers } from '../constants';

interface DerivativesDashboardProps {
    stocks: ProcessedStock[];
}

const DerivativesDashboard: React.FC<DerivativesDashboardProps> = ({ stocks }) => {
    const [selectedTicker, setSelectedTicker] = useState('^NSEI');
    const [chain, setChain] = useState<OptionChain | null>(null);
    const [strategy, setStrategy] = useState<DerivativeStrategy | null>(null);
    const [loading, setLoading] = useState(false);

    // Filter the AllFOTickers to show what's available vs what's in the universe
    const availableTickers = useMemo(() => new Set(stocks.map(s => s.ticker)), [stocks]);

    const currentStock = useMemo(() => stocks.find(s => s.ticker === selectedTicker), [stocks, selectedTicker]);

    useEffect(() => {
        const loadDerivatives = async () => {
            if (!currentStock) return;
            setLoading(true);
            
            const optionChain = fetchOptionChain(selectedTicker, currentStock.data.currentPrice);
            setChain(optionChain);
            
            const lastIdx = currentStock.indicators.rsi.length - 1;
            const avgIV = optionChain.calls.reduce((acc, c) => acc + c.iv, 0) / optionChain.calls.length;
            
            const strat = await getDerivativeStrategy(
                selectedTicker,
                currentStock.data.currentPrice,
                avgIV,
                currentStock.signals.trendSignal,
                currentStock.indicators.adx[lastIdx],
                currentStock.indicators.rsi[lastIdx]
            );
            setStrategy(strat);
            setLoading(false);
        };

        loadDerivatives();
    }, [selectedTicker, currentStock]);

    const metrics = useMemo((): DerivativeMetrics | null => {
        if (!chain) return null;
        const totalOI = chain.calls.reduce((a, b) => a + b.oi, 0) + chain.puts.reduce((a, b) => a + b.oi, 0);
        const totalCallOI = chain.calls.reduce((a, b) => a + b.oi, 0);
        const totalPutOI = chain.puts.reduce((a, b) => a + b.oi, 0);
        const avgIV = chain.calls.reduce((a, b) => a + b.iv, 0) / chain.calls.length;
        
        return {
            totalOI,
            rolloverPct: 78.4, // Simulated static for demo
            putCallRatio: Number((totalPutOI / totalCallOI).toFixed(2)),
            avgIV: Number(avgIV.toFixed(1)),
            maxPain: chain.underlyingPrice // Simulated
        };
    }, [chain]);

    const getTickerLabel = (ticker: string) => {
        if (ticker === '^NSEI') return 'INDEX: NIFTY 50';
        if (ticker === '^NSEBANK') return 'INDEX: BANK NIFTY';
        const label = ticker.replace('.NS', '');
        return availableTickers.has(ticker) ? label : `${label} [SYNCING...]`;
    };

    return (
        <div className="p-4 font-mono h-full overflow-y-auto bg-bb-black space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-bb-orange pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-bb-orange uppercase tracking-wider">>> DERIVATIVES_DESK_v4.0</h2>
                    <p className="text-bb-muted text-[10px] mt-1 uppercase">Advanced Open Interest & Volatility Execution Engine</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-3">
                    <span className="text-xs text-bb-muted uppercase">Asset:</span>
                    <select 
                        value={selectedTicker}
                        onChange={(e) => setSelectedTicker(e.target.value)}
                        className="bg-bb-dark border border-bb-border text-bb-blue font-bold px-3 py-1 outline-none focus:border-bb-orange"
                    >
                        {AllFOTickers.map(t => (
                            <option 
                                key={t} 
                                value={t} 
                                disabled={!availableTickers.has(t)}
                                className={availableTickers.has(t) ? 'text-bb-blue' : 'text-bb-muted'}
                            >
                                {getTickerLabel(t)}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            {!currentStock ? (
                <div className="flex flex-col items-center justify-center h-96 border border-dashed border-bb-border">
                    <Loader className="w-12 h-12 text-bb-orange mb-4 opacity-50" />
                    <p className="text-bb-muted text-xs uppercase text-center">
                        Waiting for Terminal to process {selectedTicker.replace('.NS', '')} data...<br/>
                        <span className="text-[10px] mt-2 block">System is currently scanning 180+ F&O assets.</span>
                    </p>
                </div>
            ) : loading ? (
                <div className="flex flex-col items-center justify-center h-96">
                    <Loader className="w-12 h-12 text-bb-orange mb-4" />
                    <p className="text-bb-orange text-xs animate-pulse uppercase">Syncing F&O Data Stream...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    
                    {/* Left: Summary Metrics */}
                    <div className="xl:col-span-1 space-y-4">
                        <div className="bg-bb-panel border border-bb-border p-4">
                            <h3 className="text-xs font-bold text-bb-orange mb-3 uppercase border-b border-bb-border pb-1">>> OPTION_GREEKS_CORE</h3>
                            <div className="space-y-3">
                                <MetricRow label="Underlying" value={currentStock?.data.currentPrice.toFixed(2) || '0.00'} color="text-white" />
                                <MetricRow label="Total OI" value={metrics?.totalOI.toLocaleString() || '0'} color="text-bb-blue" />
                                <MetricRow label="Rollover %" value={`${metrics?.rolloverPct}%`} color="text-bb-green" />
                                <MetricRow label="Put/Call Ratio" value={metrics?.putCallRatio.toString() || '0'} color={metrics && metrics.putCallRatio > 1 ? 'text-bb-red' : 'text-bb-green'} />
                                <MetricRow label="Avg IV" value={`${metrics?.avgIV}%`} color="text-bb-orange" />
                                <MetricRow label="Expiry" value={chain?.expiryDate || '-'} color="text-bb-muted" />
                            </div>
                        </div>

                        {/* AI Strategy Recommendation */}
                        {strategy && (
                            <div className="bg-bb-dark border-2 border-bb-blue p-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <BrainCircuitIcon className="w-12 h-12 text-bb-blue" />
                                </div>
                                <h3 className="text-xs font-bold text-bb-blue mb-2 uppercase">>> QUANT_STRATEGY_ENGINE</h3>
                                <div className="text-xl font-bold text-white mb-1 uppercase tracking-tighter">{strategy.name}</div>
                                <div className="text-[10px] text-bb-muted mb-4">{strategy.description}</div>
                                
                                <div className="mb-4">
                                    <div className="flex justify-between text-[10px] mb-1">
                                        <span className="text-bb-muted uppercase">Backtested Confidence</span>
                                        <span className="text-bb-blue font-bold">{strategy.confidence}%</span>
                                    </div>
                                    <div className="w-full bg-bb-black h-1.5 border border-bb-border rounded-full">
                                        <div 
                                            className="h-full bg-bb-blue transition-all duration-1000" 
                                            style={{ width: `${strategy.confidence}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-[9px] text-bb-orange font-bold uppercase mb-1">Legs:</div>
                                    {strategy.legs.map((leg, i) => (
                                        <div key={i} className="text-[10px] text-bb-text border-l border-bb-blue pl-2 py-0.5">{leg}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Option Chain */}
                    <div className="xl:col-span-3 bg-bb-dark border border-bb-border">
                        <div className="bg-bb-panel px-4 py-2 border-b border-bb-border flex justify-between items-center">
                            <h3 className="text-xs font-bold text-bb-orange uppercase tracking-widest">Live Option Chain</h3>
                            <div className="text-[10px] text-bb-muted uppercase">Last Sync: {new Date().toLocaleTimeString()}</div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px] text-center border-collapse">
                                <thead className="bg-bb-black text-bb-muted uppercase border-b border-bb-border">
                                    <tr>
                                        <th colSpan={3} className="py-2 border-r border-bb-border bg-bb-blue/5 text-bb-blue">CALLS</th>
                                        <th className="bg-bb-panel">STRIKE</th>
                                        <th colSpan={3} className="py-2 border-l border-bb-border bg-bb-red/5 text-bb-red">PUTS</th>
                                    </tr>
                                    <tr className="border-b border-bb-border text-[9px]">
                                        <th className="p-1">OI</th>
                                        <th className="p-1">IV</th>
                                        <th className="p-1 border-r border-bb-border">LTP</th>
                                        <th className="bg-bb-panel">PRICE</th>
                                        <th className="p-1 border-l border-bb-border">LTP</th>
                                        <th className="p-1">IV</th>
                                        <th className="p-1">OI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chain?.calls.map((c, i) => {
                                        const p = chain.puts[i];
                                        const isATM = Math.abs(c.strike - chain.underlyingPrice) < 10;
                                        return (
                                            <tr key={c.strike} className={`hover:bg-bb-panel transition-colors ${isATM ? 'bg-bb-orange/10' : ''}`}>
                                                <td className="p-2 text-bb-muted">{c.oi.toLocaleString()}</td>
                                                <td className="p-2 text-bb-blue">{c.iv}%</td>
                                                <td className="p-2 text-white font-bold border-r border-bb-border">₹{c.price}</td>
                                                <td className="p-2 bg-bb-panel text-bb-orange font-bold font-mono">
                                                    {c.strike}
                                                </td>
                                                <td className="p-2 text-white font-bold border-l border-bb-border">₹{p.price}</td>
                                                <td className="p-2 text-bb-red">{p.iv}%</td>
                                                <td className="p-2 text-bb-muted">{p.oi.toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

const MetricRow: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
    <div className="flex justify-between items-center border-b border-bb-border/30 pb-2">
        <span className="text-[10px] text-bb-muted uppercase tracking-tighter">{label}</span>
        <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
);

export default DerivativesDashboard;
