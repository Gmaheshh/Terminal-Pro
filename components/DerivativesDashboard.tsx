
import React, { useState, useEffect, useMemo } from 'react';
import type { ProcessedStock, OptionChain, DerivativeStrategy, DerivativeMetrics } from '../types';
import { fetchOptionChain } from '../services/stockDataService';
import { getDerivativeStrategy } from '../services/geminiService';
import { Loader } from './Loader';
import { BrainCircuitIcon } from './Icons';
import { AllFOTickers } from '../constants';

interface DerivativesDashboardProps {
    stocks: ProcessedStock[];
    onExecute: (strategy: DerivativeStrategy) => void;
}

const DerivativesDashboard: React.FC<DerivativesDashboardProps> = ({ stocks, onExecute }) => {
    const [selectedTicker, setSelectedTicker] = useState('^NSEI');
    const [chain, setChain] = useState<OptionChain | null>(null);
    const [strategy, setStrategy] = useState<DerivativeStrategy | null>(null);
    const [loading, setLoading] = useState(false);
    const [executed, setExecuted] = useState(false);
    const [isLive, setIsLive] = useState(false);

    const availableTickers = useMemo(() => new Set(stocks.map(s => s.ticker)), [stocks]);
    const currentStock = useMemo(() => stocks.find(s => s.ticker === selectedTicker), [stocks, selectedTicker]);

    useEffect(() => {
        const loadDerivatives = async () => {
            if (!currentStock) return;
            setLoading(true);
            setExecuted(false);
            setStrategy(null);
            setChain(null);
            setIsLive(false);
            
            try {
                const optionChain = await fetchOptionChain(selectedTicker, currentStock.data.currentPrice);
                setChain(optionChain);
                
                // If the expiry date looks like a real NSE date (e.g. 28-MAR-2024), it's live
                if (optionChain.expiryDate.includes('-')) setIsLive(true);

                const lastIdx = currentStock.indicators.rsi.length - 1;
                const strat = await getDerivativeStrategy(
                    selectedTicker,
                    currentStock.data.currentPrice,
                    currentStock.signals.trendSignal,
                    currentStock.indicators.adx[lastIdx],
                    currentStock.indicators.rsi[lastIdx],
                    optionChain
                );
                setStrategy(strat);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadDerivatives();
    }, [selectedTicker, currentStock]);

    const metrics = useMemo((): DerivativeMetrics | null => {
        if (!chain) return null;
        const totalCallOI = chain.calls.reduce((a, b) => a + b.oi, 0);
        const totalPutOI = chain.puts.reduce((a, b) => a + b.oi, 0);
        const avgIV = chain.calls.reduce((acc, c) => acc + c.iv, 0) / (chain.calls.length || 1);
        return {
            totalOI: totalCallOI + totalPutOI,
            rolloverPct: 78.4, 
            putCallRatio: Number((totalPutOI / (totalCallOI || 1)).toFixed(2)),
            avgIV: Number(avgIV.toFixed(1)),
            maxPain: chain.underlyingPrice
        };
    }, [chain]);

    const handleExecuteClick = () => {
        if (strategy) {
            setExecuted(true);
            onExecute(strategy);
        }
    };

    const getDisplayName = (t: string) => {
        if (t === '^NSEI') return 'NIFTY 50';
        if (t === '^NSEBANK') return 'BANK NIFTY';
        return t.replace('.NS', '');
    };

    return (
        <div className="p-4 font-mono h-full overflow-y-auto bg-bb-black space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-bb-orange pb-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold text-bb-orange uppercase tracking-wider">>> DERIVATIVES_PLANNING_DESK</h2>
                        {chain && (
                            <span className={`text-[9px] px-2 py-0.5 border font-bold uppercase ${isLive ? 'bg-bb-green/20 border-bb-green text-bb-green' : 'bg-bb-orange/20 border-bb-orange text-bb-orange'}`}>
                                {isLive ? 'LIVE_NSE_SYNC' : 'SYNTHETIC_FALLBACK'}
                            </span>
                        )}
                    </div>
                    <p className="text-bb-muted text-[10px] mt-1 uppercase">Select Underlying & Synthesize Institutional Spreads (Live NSE Feed)</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-3">
                    <span className="text-xs text-bb-muted uppercase tracking-tighter">Instrument:</span>
                    <select 
                        value={selectedTicker}
                        onChange={(e) => setSelectedTicker(e.target.value)}
                        className="bg-bb-dark border border-bb-border text-bb-blue font-bold px-4 py-1 outline-none focus:border-bb-orange cursor-pointer"
                    >
                        {AllFOTickers.map(t => (
                            <option key={t} value={t} disabled={!availableTickers.has(t)}>{getDisplayName(t)}</option>
                        ))}
                    </select>
                </div>
            </header>

            {!currentStock ? (
                <div className="flex flex-col items-center justify-center h-96 border border-dashed border-bb-border bg-bb-panel/20">
                    <Loader className="w-12 h-12 text-bb-orange mb-4 opacity-50" />
                    <p className="text-bb-muted text-xs uppercase tracking-widest">Scanning exchange liquidity...</p>
                </div>
            ) : loading ? (
                <div className="flex flex-col items-center justify-center h-96">
                    <Loader className="w-12 h-12 text-bb-orange mb-4" />
                    <p className="text-bb-orange text-xs animate-pulse uppercase tracking-widest">Querying NSE Option Chain & Processing Alpha...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in">
                    
                    <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4 bg-bb-dark border border-bb-border p-4">
                        <MarketItem label="BIAS" value={strategy?.bias || 'ANALYZING...'} color={strategy?.bias?.toLowerCase().includes('bull') ? 'text-bb-green' : strategy?.bias?.toLowerCase().includes('bear') ? 'text-bb-red' : 'text-bb-orange'} />
                        <MarketItem label="VOLATILITY" value={strategy?.volatilityRegime || 'CALCULATING...'} color="text-bb-blue" />
                        <MarketItem label="UNDERLYING" value={currentStock.data.currentPrice.toFixed(2)} color="text-white" />
                        <MarketItem label="IV LEVEL" value={`${metrics?.avgIV || 0}%`} color="text-bb-orange" />
                    </div>

                    <div className="xl:col-span-8 space-y-6">
                        <div className="bg-bb-panel border border-bb-border p-6 relative overflow-hidden">
                            <div className="flex justify-between items-start border-b border-bb-border pb-4 mb-4">
                                <div>
                                    <h3 className="text-xs font-bold text-bb-blue uppercase mb-1">🧠 Strategy Recommendation</h3>
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{strategy?.name}</h2>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-bb-muted uppercase mb-1">Confidence Score</div>
                                    <div className="text-3xl font-bold text-bb-orange">{strategy?.confidence.score}%</div>
                                </div>
                            </div>
                            
                            <p className="text-sm text-bb-text leading-relaxed uppercase mb-6">{strategy?.rationale}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-bb-border pt-6">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-bb-orange uppercase tracking-widest">📉 Risk Metrics</h4>
                                    <MetricRow label="Max Profit" value={strategy?.maxProfit || '-'} color="text-bb-green" />
                                    <MetricRow label="Max Loss" value={strategy?.maxLoss || '-'} color="text-bb-red" />
                                    <MetricRow label="RR Ratio" value={strategy?.rrRatio || '-'} color="text-white" />
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-bb-blue uppercase tracking-widest">Δ Greeks Exposure</h4>
                                    <MetricRow label="Delta Bias" value={strategy?.greeks.delta || '-'} color="text-bb-text" />
                                    <MetricRow label="Theta Decay" value={strategy?.greeks.theta || '-'} color="text-bb-text" />
                                    <MetricRow label="Vega Risk" value={strategy?.greeks.vega || '-'} color="text-bb-text" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-bb-dark border border-bb-border overflow-hidden">
                            <div className="bg-bb-panel px-4 py-2 border-b border-bb-border flex justify-between items-center">
                                <h3 className="text-xs font-bold text-bb-orange uppercase tracking-wider">🧾 Proposed Trade Structure ({isLive ? 'LIVE' : 'ESTIMATED'} CHAIN)</h3>
                                <span className="text-[9px] text-bb-muted uppercase">Expiry: {chain?.expiryDate}</span>
                            </div>
                            <table className="w-full text-left font-mono text-[11px]">
                                <thead className="bg-bb-black text-bb-muted uppercase border-b border-bb-border">
                                    <tr>
                                        <th className="px-4 py-2 font-normal">Leg</th>
                                        <th className="px-4 py-2 font-normal">Action</th>
                                        <th className="px-4 py-2 font-normal">Strike</th>
                                        <th className="px-4 py-2 font-normal">Type</th>
                                        <th className="px-4 py-2 font-normal text-right">Premium</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bb-border/30">
                                    {strategy?.tradeStructure.map((leg, i) => (
                                        <tr key={i} className="hover:bg-bb-panel/50">
                                            <td className="px-4 py-3 text-bb-muted">{leg.leg}</td>
                                            <td className={`px-4 py-3 font-bold ${leg.action === 'BUY' ? 'text-bb-blue' : 'text-bb-orange'}`}>{leg.action}</td>
                                            <td className="px-4 py-3 text-white">{leg.strike}</td>
                                            <td className="px-4 py-3">{leg.type}</td>
                                            <td className="px-4 py-3 text-right">₹{leg.premium.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-bb-panel border-l-4 border-bb-orange p-6 space-y-4">
                            <h3 className="text-xs font-bold text-bb-orange uppercase flex items-center">
                                <BrainCircuitIcon className="w-4 h-4 mr-2" /> Confidence Factors
                            </h3>
                            <ul className="space-y-3">
                                {strategy?.confidence.strengths.map((s, i) => (
                                    <li key={i} className="text-[10px] text-bb-text uppercase flex items-start">
                                        <span className="text-bb-green mr-2">✓</span> {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-bb-dark border border-bb-red/30 p-6 space-y-3">
                            <h3 className="text-xs font-bold text-bb-red uppercase flex items-center">
                                ⚠️ Trading Guardrails
                            </h3>
                            <p className="text-[10px] text-bb-muted leading-relaxed uppercase">
                                {strategy?.warnings}
                            </p>
                        </div>

                        <div className="bg-bb-panel border border-bb-border p-4 space-y-4">
                             <h3 className="text-xs font-bold text-bb-blue uppercase border-b border-bb-border pb-2">Spread Execution</h3>
                             <button 
                                onClick={handleExecuteClick}
                                disabled={executed}
                                className={`w-full py-3 font-bold uppercase transition-all ${executed ? 'bg-bb-green text-bb-black cursor-default' : 'bg-bb-blue text-bb-black hover:bg-white active:scale-95'}`}
                             >
                                {executed ? '>> ORDER EXECUTED' : 'EXECUTE SPREAD'}
                             </button>
                             <p className="text-[8px] text-bb-muted text-center uppercase">Orders will be routed to 'Payoff Visualizer' for live monitoring.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MarketItem: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
    <div className="flex flex-col">
        <span className="text-[9px] text-bb-muted uppercase tracking-tighter">{label}</span>
        <span className={`text-lg font-bold ${color} tracking-tight`}>{value}</span>
    </div>
);

const MetricRow: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
    <div className="flex justify-between items-center border-b border-bb-border/30 pb-1">
        <span className="text-[9px] text-bb-muted uppercase tracking-tighter">{label}</span>
        <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
);

export default DerivativesDashboard;
