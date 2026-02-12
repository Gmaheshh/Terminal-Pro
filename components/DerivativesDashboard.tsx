import React, { useState, useMemo } from 'react';
import type { ProcessedStock, DerivativeStrategy } from '../types';
import { fetchOptionChain } from '../services/stockDataService';
import { getArbitrageStrategy, scanStrategyForStocks } from '../services/geminiService';
import { Loader } from './Loader';
import { BrainCircuitIcon, InfoIcon } from './Icons';
import { AllFOTickers } from '../constants';

interface DerivativesDashboardProps {
    stocks: ProcessedStock[];
    onExecute: (strategy: DerivativeStrategy) => void;
    onHover?: (stock: ProcessedStock | null, x: number, y: number) => void;
}

type DeskTab = 'STOCK_TO_STRAT' | 'STRAT_TO_STOCK';

const DerivativesDashboard: React.FC<DerivativesDashboardProps> = ({ stocks, onExecute, onHover }) => {
    const [activeTab, setActiveTab] = useState<DeskTab>('STOCK_TO_STRAT');
    const [selectedTicker, setSelectedTicker] = useState('^NSEI');
    const [selectedStrategy, setSelectedStrategy] = useState('SHORT_STRADDLE');
    const [variableCost, setVariableCost] = useState(20); 
    
    const [strategy, setStrategy] = useState<DerivativeStrategy | null>(null);
    const [scannedResults, setScannedResults] = useState<DerivativeStrategy[]>([]);
    const [loading, setLoading] = useState(false);
    const [executedId, setExecutedId] = useState<string | null>(null);

    const currentStock = useMemo(() => stocks.find(s => s.ticker === selectedTicker), [stocks, selectedTicker]);

    const runStockToStrat = async () => {
        if (!currentStock) return;
        setLoading(true);
        setStrategy(null);
        try {
            const chain = await fetchOptionChain(selectedTicker, currentStock.data.currentPrice);
            const res = await getArbitrageStrategy(selectedTicker, currentStock.data.currentPrice, chain.futuresPrice, chain, variableCost / 1000);
            setStrategy(res);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const runStratToStock = async () => {
        setLoading(true);
        setScannedResults([]);
        try {
            const results = await scanStrategyForStocks(selectedStrategy, stocks, variableCost / 1000);
            setScannedResults(results);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleExecute = (s: DerivativeStrategy) => {
        setExecutedId(s.ticker + s.timestamp);
        onExecute(s);
    };

    return (
        <div className="p-8 font-sans h-full overflow-y-auto bg-pro-bg custom-scrollbar">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-pro-border pb-8">
                <div>
                    <h2 className="text-3xl font-black text-pro-text tracking-tight uppercase">Institutional Derivatives Desk</h2>
                    <p className="text-pro-muted text-xs font-bold mt-1 uppercase tracking-widest opacity-60">High-Fid Arbitrage & Systematic Option Architecture</p>
                </div>
                
                <div className="flex bg-white rounded-2xl p-1 shadow-soft border border-pro-border">
                    <button 
                        onClick={() => setActiveTab('STOCK_TO_STRAT')}
                        className={`px-6 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'STOCK_TO_STRAT' ? 'bg-pro-primary text-white shadow-md' : 'text-pro-muted hover:text-pro-text'}`}
                    >
                        STOCK → STRATEGY
                    </button>
                    <button 
                        onClick={() => setActiveTab('STRAT_TO_STOCK')}
                        className={`px-6 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'STRAT_TO_STOCK' ? 'bg-pro-primary text-white shadow-md' : 'text-pro-muted hover:text-pro-text'}`}
                    >
                        STRATEGY → STOCK
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-pro-border shadow-soft space-y-6">
                        <h3 className="text-xs font-black text-pro-primary uppercase tracking-widest mb-4">Parameter Controls</h3>
                        {activeTab === 'STOCK_TO_STRAT' ? (
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-pro-muted uppercase mb-1">Asset Selection</label>
                                <select 
                                    value={selectedTicker}
                                    onChange={(e) => setSelectedTicker(e.target.value)}
                                    className="w-full bg-pro-bg border border-pro-border rounded-xl px-4 py-3 text-sm font-bold text-pro-text focus:outline-none"
                                >
                                    {AllFOTickers.map(t => <option key={t} value={t}>{t.replace('.NS','')}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-pro-muted uppercase mb-1">Target Strategy</label>
                                <select 
                                    value={selectedStrategy}
                                    onChange={(e) => setSelectedStrategy(e.target.value)}
                                    className="w-full bg-pro-bg border border-pro-border rounded-xl px-4 py-3 text-sm font-bold text-pro-text focus:outline-none"
                                >
                                    <option value="SHORT_STRADDLE">Short Straddle</option>
                                    <option value="IRON_CONDOR">Iron Condor</option>
                                    <option value="RATIO_SPREAD">Ratio Spread</option>
                                    <option value="LONG_STRANGLE">Long Strangle</option>
                                </select>
                            </div>
                        )}
                        <div className="space-y-4 border-t border-pro-border pt-6">
                            <div>
                                <label className="block text-[10px] font-black text-pro-muted uppercase mb-1">Variable Transaction Cost (₹)</label>
                                <input 
                                    type="number" 
                                    value={variableCost}
                                    onChange={(e) => setVariableCost(Number(e.target.value))}
                                    className="w-full bg-pro-bg border border-pro-border rounded-xl px-4 py-3 text-sm font-bold text-pro-text focus:outline-none"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={activeTab === 'STOCK_TO_STRAT' ? runStockToStrat : runStratToStock}
                            disabled={loading}
                            className="w-full bg-pro-primary text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center uppercase tracking-widest text-[11px] disabled:opacity-50"
                        >
                            {loading ? <Loader className="w-4 h-4 mr-2" /> : <BrainCircuitIcon className="w-4 h-4 mr-2" />}
                            {activeTab === 'STOCK_TO_STRAT' ? 'Synthesize Strategy' : 'Scan Market Universe'}
                        </button>
                    </div>
                </div>
                <div className="lg:col-span-8 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-pro-border rounded-[3rem] bg-white">
                             <Loader className="w-12 h-12 text-pro-primary mb-4" />
                             <p className="text-xs font-black text-pro-primary uppercase tracking-[0.3em] animate-pulse">Calculating Multi-Asset Vectors...</p>
                        </div>
                    ) : activeTab === 'STOCK_TO_STRAT' ? (
                        strategy ? (
                            <StrategyCard s={strategy} onExecute={handleExecute} isExecuted={executedId === strategy.ticker + strategy.timestamp} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-pro-border rounded-[3rem] bg-white opacity-40">
                                <InfoIcon className="w-12 h-12 text-pro-muted mb-4" />
                                <h3 className="text-sm font-black text-pro-muted uppercase tracking-widest">No Arbitrage Edge Possible</h3>
                            </div>
                        )
                    ) : (
                        <div className="space-y-6">
                            {scannedResults.length > 0 ? scannedResults.map((s, i) => (
                                <StrategyCard key={i} s={s} onExecute={handleExecute} isExecuted={executedId === s.ticker + s.timestamp} rank={i+1} />
                            )) : (
                                <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-pro-border rounded-[3rem] bg-white opacity-40">
                                     <p className="text-xs font-black text-pro-muted uppercase tracking-widest">Awaiting Strategy Scan Initiation...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StrategyCard: React.FC<{ s: DerivativeStrategy, onExecute: (s: DerivativeStrategy) => void, isExecuted: boolean, rank?: number }> = ({ s, onExecute, isExecuted, rank }) => (
    <div className="bg-white border border-pro-border rounded-[2.5rem] shadow-soft p-10 relative overflow-hidden animate-fade-in group">
        {rank && (
            <div className="absolute top-0 left-0 bg-pro-primary text-white text-[10px] font-black px-4 py-2 rounded-br-2xl shadow-sm">
                RANK #{rank}
            </div>
        )}
        <div className="flex justify-between items-start mb-8">
            <div>
                <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-2xl font-black text-pro-text uppercase tracking-tight">{s.name}</h3>
                    <span className="text-[10px] font-black text-pro-primary bg-pro-primary/5 px-2 py-0.5 rounded border border-pro-primary/10 uppercase">{s.ticker}</span>
                </div>
                <div className="flex space-x-4">
                    <span className={`text-[10px] font-black uppercase ${s.bias.includes('Bull') ? 'text-pro-green' : s.bias.includes('Bear') ? 'text-pro-red' : 'text-pro-primary'}`}>{s.bias}</span>
                    <span className="text-[10px] font-bold text-pro-muted uppercase tracking-widest">CONFIDENCE: <span className="text-pro-text">{s.confidence}%</span></span>
                </div>
            </div>
            <button 
                onClick={() => onExecute(s)}
                disabled={isExecuted}
                className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] transition-all shadow-md active:scale-95 ${isExecuted ? 'bg-pro-green text-white cursor-default' : 'bg-pro-primary text-white hover:bg-blue-700'}`}
            >
                {isExecuted ? '>> EXECUTED' : 'EXECUTE'}
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <MetricBox label="Max Profit" value={`₹${s.maxProfit.toLocaleString()}`} color="text-pro-green" />
            <MetricBox label="Max Loss" value={s.maxLoss < 0 ? 'UNLIMITED' : `₹${s.maxLoss.toLocaleString()}`} color="text-pro-red" />
            <MetricBox label="Fixed Cost (Tax)" value={`₹${s.fixedCost.toLocaleString()}`} />
            <MetricBox label="Variable (Comm)" value={`₹${s.variableCost.toLocaleString()}`} />
        </div>
        <div className="bg-pro-surface rounded-2xl p-6 border border-pro-border mb-8">
            <h4 className="text-[10px] font-black text-pro-muted uppercase tracking-widest mb-4">Mechanism: Simple Terms</h4>
            <p className="text-[13px] text-pro-text font-medium leading-relaxed italic uppercase opacity-80">"{s.explanation}"</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-pro-border">
             <GreekItem label="Delta" val={s.greeks.delta} />
             <GreekItem label="Theta" val={s.greeks.theta} />
             <GreekItem label="Vega" val={s.greeks.vega} />
             <GreekItem label="Gamma" val={s.greeks.gamma} />
        </div>
    </div>
);

const MetricBox = ({ label, value, color = "text-pro-text" }: { label: string, value: string, color?: string }) => (
    <div className="bg-pro-surface border border-pro-border p-4 rounded-2xl text-center">
        <span className="text-[9px] font-black text-pro-muted uppercase block mb-1">{label}</span>
        <span className={`text-sm font-black ${color}`}>{value}</span>
    </div>
);

const GreekItem = ({ label, val }: { label: string, val: number }) => (
    <div className="flex justify-between items-center px-4 py-2 bg-pro-surface rounded-lg border border-pro-border/50">
        <span className="text-[9px] font-black text-pro-muted uppercase tracking-tighter">{label}</span>
        <span className="text-xs font-black text-pro-text">{val.toFixed(3)}</span>
    </div>
);

export default DerivativesDashboard;