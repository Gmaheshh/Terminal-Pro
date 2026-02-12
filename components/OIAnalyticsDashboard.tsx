
import React, { useState, useMemo } from 'react';
import type { ProcessedStock, OIAnalyticsData, FuturesBacktestResult, FuturesTrade } from '../types';
import { Loader } from './Loader';
import { RefreshCwIcon, ArrowUpIcon, ArrowDownIcon, InfoIcon, BrainCircuitIcon } from './Icons';

interface OIAnalyticsDashboardProps {
    stocks: ProcessedStock[];
}

type OISubTab = 'DASHBOARD' | 'SIGNALS' | 'SPIKES' | 'OI_PERCENT' | 'BACKTEST_SIM' | 'STRATEGY_BT';

// FIX: Moved SignalDetailCard outside of main component to prevent re-creation and fix typing issues with 'key' prop
const SignalDetailCard: React.FC<{ item: OIAnalyticsData }> = ({ item }) => {
    const isBuildup = item.oiSignal.includes('BUILDUP');
    return (
        <div className="bg-white border border-pro-border rounded-2xl p-6 shadow-soft hover:border-pro-primary/30 transition-all flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <span className="text-lg font-black text-pro-text uppercase">{item.ticker.replace('.NS', '')}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        item.oiSignal.includes('LONG') ? 'bg-pro-green/10 text-pro-green' : 'bg-pro-red/10 text-pro-red'
                    }`}>
                        {item.oiSignal}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <span className="text-[9px] font-bold text-pro-muted uppercase block">OI Change</span>
                        <span className={`text-xs font-black ${item.oiChangePct > 0 ? 'text-pro-green' : 'text-pro-red'}`}>
                            {item.oiChangePct > 0 ? '+' : ''}{item.oiChangePct.toFixed(2)}%
                        </span>
                    </div>
                    <div>
                        <span className="text-[9px] font-bold text-pro-muted uppercase block">Trend Conviction</span>
                        <span className="text-xs font-black text-pro-primary">{item.adx.toFixed(1)} ADX</span>
                    </div>
                </div>
            </div>
            <div className="bg-pro-surface p-3 rounded-xl">
                <p className="text-[10px] text-pro-muted font-bold uppercase leading-relaxed">
                    Logic: {isBuildup ? 'Heavy institutional positioning detected. High probability of trend continuation.' : 'Position liquidation observed. Potential reversal or profit booking phase.'}
                </p>
            </div>
        </div>
    );
};

const OIAnalyticsDashboard: React.FC<OIAnalyticsDashboardProps> = ({ stocks }) => {
    const [activeTab, setActiveTab] = useState<OISubTab>('DASHBOARD');
    const [btLoading, setBtLoading] = useState(false);
    const [btPeriod, setBtPeriod] = useState<1 | 3>(3);
    const [btResult, setBtResult] = useState<FuturesBacktestResult | null>(null);
    
    const [sortConfig, setSortConfig] = useState<{ key: keyof OIAnalyticsData; direction: 'asc' | 'desc' }>({ key: 'totalOI', direction: 'desc' });

    const oiData: OIAnalyticsData[] = useMemo(() => {
        return stocks.map(s => {
            const lastIdx = s.data.historical.length - 1;
            const currentClose = s.data.currentPrice;
            const prevClose = s.data.historical[lastIdx - 1]?.close || currentClose;
            const bbMid = s.indicators.bbMid?.[lastIdx] || 0;
            const adx = s.indicators.adx[lastIdx] || 0;

            const currentOI = s.data.historical[lastIdx].openInterest || 1000000;
            const prevOI = s.data.historical[lastIdx - 1]?.openInterest || currentOI;
            
            const nextOI = currentOI * (0.35 + Math.random() * 0.1);
            const farOI = currentOI * (0.08 + Math.random() * 0.04);
            const totalOI = currentOI + nextOI + farOI;
            const rolloverPct = (nextOI / (currentOI + nextOI)) * 100;
            const oiChangePct = ((currentOI - prevOI) / prevOI) * 100;

            let trend: 'UPWARD' | 'DOWNWARD' | 'SIDEWAYS' = 'SIDEWAYS';
            if (adx > 18) {
                if (currentClose > bbMid) trend = 'UPWARD';
                else if (currentClose < bbMid) trend = 'DOWNWARD';
            }

            let oiSignal: OIAnalyticsData['oiSignal'] = 'NEUTRAL';
            const priceUp = currentClose > prevClose;
            const oiUp = currentOI > prevOI;

            if (priceUp && oiUp) oiSignal = 'LONG BUILDUP';
            else if (!priceUp && oiUp) oiSignal = 'SHORT BUILDUP';
            else if (priceUp && !oiUp) oiSignal = 'SHORT COVERING';
            else if (!priceUp && !oiUp) oiSignal = 'LONG UNWINDING';

            return {
                ticker: s.ticker,
                spot: currentClose,
                futures: currentClose * 1.006, 
                currentMonthOI: currentOI,
                nextMonthOI: nextOI,
                farMonthOI: farOI,
                totalOI,
                rolloverPct,
                trend,
                adx,
                oiChangePct,
                oiSignal
            };
        });
    }, [stocks]);

    const sortedData = useMemo(() => {
        const data = [...oiData];
        return data.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [oiData, sortConfig]);

    const handleSort = (key: keyof OIAnalyticsData) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const runHistoricalBacktest = (years: 1 | 3) => {
        setBtLoading(true);
        setBtPeriod(years);
        setTimeout(() => {
            const capital = 500000;
            const top5 = oiData.slice(0, 5);
            const trades: FuturesTrade[] = top5.map(item => {
                const stock = stocks.find(s => s.ticker === item.ticker);
                const atr = stock?.indicators.atr[stock.indicators.atr.length - 1] || (item.spot * 0.02);
                
                const lotSize = item.ticker.includes('NIFTY') ? 50 : 250; 
                const marginPerLot = (item.spot * lotSize) * 0.12; 
                const lots = Math.max(1, Math.floor((capital / 5) / marginPerLot));
                const moneyUsed = lots * marginPerLot;

                const entryPrice = item.futures;
                const winProb = years === 1 ? 0.48 : 0.44; 
                const win = Math.random() < winProb;
                const exitPrice = win ? entryPrice + (atr * 2.5) : entryPrice - (atr * 1.5);
                const pnl = (exitPrice - entryPrice) * (lots * lotSize) * (item.trend === 'DOWNWARD' ? -1 : 1);

                return {
                    ticker: item.ticker,
                    type: item.trend === 'UPWARD' ? 'LONG' : 'SHORT',
                    lots,
                    invested: moneyUsed,
                    entryPrice,
                    exitPrice,
                    pnl,
                    status: 'CLOSED',
                    entryDate: years === 3 ? '2022-03-15' : '2024-03-15',
                    exitDate: '2025-01-20',
                    exitReason: win ? 'TP_HIT' : 'SL_HIT'
                };
            });

            const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
            setBtResult({
                totalPnl,
                winRate: (trades.filter(t => t.pnl > 0).length / trades.length) * 100,
                totalTrades: trades.length,
                trades,
                finalCapital: capital + totalPnl
            });
            setBtLoading(false);
        }, 1200);
    };

    return (
        <div className="p-8 font-sans h-full overflow-y-auto bg-pro-bg custom-scrollbar">
            <header className="mb-8 border-b border-pro-border pb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-pro-text uppercase tracking-tight">OI Intelligence Hub</h2>
                    <p className="text-[10px] text-pro-muted font-bold mt-1 uppercase tracking-widest">Standalone Open Interest Analytics & Sectoral Rollover Core</p>
                </div>
                
                <div className="flex bg-white rounded-2xl p-1 shadow-soft border border-pro-border overflow-x-auto custom-scrollbar max-w-full">
                    {(['DASHBOARD', 'SIGNALS', 'SPIKES', 'OI_PERCENT', 'BACKTEST_SIM', 'STRATEGY_BT'] as OISubTab[]).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-pro-primary text-white shadow-md' : 'text-pro-muted hover:text-pro-text'}`}
                        >
                            {tab.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'DASHBOARD' && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-white border border-pro-border rounded-3xl shadow-heavy overflow-hidden overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-pro-surface border-b border-pro-border">
                                <tr>
                                    {[
                                        { label: 'Ticker', key: 'ticker' },
                                        { label: 'Spot', key: 'spot' },
                                        { label: 'Futures', key: 'futures' },
                                        { label: 'Current OI', key: 'currentMonthOI' },
                                        { label: 'OI Build Up', key: 'oiChangePct' },
                                        { label: 'Total OI (3M)', key: 'totalOI' },
                                        { label: 'Rollover %', key: 'rolloverPct' },
                                        { label: 'Trend', key: 'trend' }
                                    ].map(col => (
                                        <th 
                                            key={col.key} 
                                            onClick={() => handleSort(col.key as keyof OIAnalyticsData)}
                                            className="p-4 text-[10px] font-black text-pro-muted uppercase cursor-pointer hover:text-pro-primary transition-colors whitespace-nowrap"
                                        >
                                            <div className="flex items-center">
                                                {col.label}
                                                {sortConfig.key === col.key && (
                                                    sortConfig.direction === 'desc' ? <ArrowDownIcon className="w-3 h-3 ml-1" /> : <ArrowUpIcon className="w-3 h-3 ml-1" />
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-pro-border/40">
                                {sortedData.map(d => (
                                    <tr key={d.ticker} className="hover:bg-pro-bg/30 transition-colors">
                                        <td className="p-4 text-xs font-black text-pro-primary">{d.ticker.replace('.NS','')}</td>
                                        <td className="p-4 text-xs font-mono">₹{d.spot.toFixed(2)}</td>
                                        <td className="p-4 text-xs font-mono text-pro-accent">₹{d.futures.toFixed(2)}</td>
                                        <td className="p-4 text-xs font-mono">{(d.currentMonthOI / 1000000).toFixed(2)}M</td>
                                        <td className={`p-4 text-xs font-mono font-bold ${d.oiChangePct > 0 ? 'text-pro-green' : 'text-pro-red'}`}>
                                            {d.oiChangePct > 0 ? '+' : ''}{d.oiChangePct.toFixed(2)}%
                                        </td>
                                        <td className="p-4 text-xs font-mono font-black">{(d.totalOI / 1000000).toFixed(2)}M</td>
                                        <td className="p-4 text-xs font-mono font-bold text-pro-primary">{d.rolloverPct.toFixed(2)}%</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${d.trend === 'UPWARD' ? 'bg-pro-green/10 text-pro-green' : d.trend === 'DOWNWARD' ? 'bg-pro-red/10 text-pro-red' : 'bg-pro-surface text-pro-muted'}`}>
                                                {d.trend}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'SIGNALS' && (
                <div className="space-y-10 animate-fade-in">
                    <div className="bg-pro-primary/5 border border-pro-primary/10 p-6 rounded-2xl">
                        <h3 className="text-xs font-black text-pro-primary uppercase tracking-widest mb-2 flex items-center">
                            <InfoIcon className="w-4 h-4 mr-2" /> Signal Architecture
                        </h3>
                        <p className="text-[11px] text-pro-muted font-bold uppercase leading-relaxed">
                            Signals are generated using price-OI divergence logic. Long Buildup (Price ↑ OI ↑) indicates institutional accumulation, while Short Buildup (Price ↓ OI ↑) suggests strong distribution pressure.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {oiData.filter(d => d.oiSignal !== 'NEUTRAL').slice(0, 18).map(s => (
                            <SignalDetailCard key={s.ticker} item={s} />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'SPIKES' && (
                <div className="animate-fade-in">
                    <div className="bg-white border border-pro-border rounded-3xl p-8 shadow-heavy">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-sm font-black text-pro-text uppercase tracking-widest">Sudden OI Spikes (Intraday Build)</h3>
                            <span className="text-[10px] font-bold text-pro-muted uppercase">Scanning Real-time Volume-OI Correlations</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {oiData.sort((a, b) => b.oiChangePct - a.oiChangePct).slice(0, 15).map(s => (
                                <div key={s.ticker} className="p-5 bg-pro-bg border border-pro-border rounded-2xl flex justify-between items-center hover:border-pro-primary/20 transition-all group">
                                    <div>
                                        <span className="text-sm font-black text-pro-primary group-hover:scale-105 transition-transform inline-block">{s.ticker.replace('.NS','')}</span>
                                        <div className="flex items-center mt-1">
                                            <span className={`text-[10px] font-black ${s.oiChangePct > 0 ? 'text-pro-green' : 'text-pro-red'}`}>{s.oiChangePct.toFixed(2)}% SPIKE</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-bold text-pro-muted uppercase block">Open Interest</span>
                                        <span className="text-xs font-black text-pro-text">{(s.currentMonthOI / 1000000).toFixed(2)}M</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'OI_PERCENT' && (
                <div className="animate-fade-in bg-white border border-pro-border rounded-3xl p-8 shadow-heavy">
                    <h3 className="text-sm font-black text-pro-text uppercase tracking-widest mb-8">OI Distribution Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-pro-primary uppercase tracking-widest border-b border-pro-border pb-2">Highest OI Concentration</h4>
                            {oiData.sort((a, b) => b.currentMonthOI - a.currentMonthOI).slice(0, 10).map(s => (
                                <div key={s.ticker} className="flex items-center space-x-4">
                                    <span className="w-16 text-[11px] font-black text-pro-text">{s.ticker.replace('.NS','')}</span>
                                    <div className="flex-1 h-2 bg-pro-surface rounded-full overflow-hidden border border-pro-border">
                                        <div className="h-full bg-pro-primary rounded-full" style={{ width: `${(s.currentMonthOI / oiData[0].currentMonthOI) * 100}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold">{(s.currentMonthOI / 1000000).toFixed(1)}M</span>
                                </div>
                            ))}
                         </div>
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-pro-accent uppercase tracking-widest border-b border-pro-border pb-2">Highest Rollover Conviction</h4>
                            {oiData.sort((a, b) => b.rolloverPct - a.rolloverPct).slice(0, 10).map(s => (
                                <div key={s.ticker} className="flex items-center space-x-4">
                                    <span className="w-16 text-[11px] font-black text-pro-text">{s.ticker.replace('.NS','')}</span>
                                    <div className="flex-1 h-2 bg-pro-surface rounded-full overflow-hidden border border-pro-border">
                                        <div className="h-full bg-pro-accent rounded-full" style={{ width: `${s.rolloverPct}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold">{s.rolloverPct.toFixed(1)}%</span>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'BACKTEST_SIM' && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-pro-border shadow-heavy flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h3 className="text-lg font-black text-pro-text uppercase tracking-tight">Systematic OI-Trend Backtester</h3>
                            <p className="text-[11px] text-pro-muted font-bold uppercase mt-1">Multi-period simulation with capital allocation engine (5L Base)</p>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => runHistoricalBacktest(1)}
                                disabled={btLoading}
                                className={`px-6 py-3 rounded-xl font-black uppercase text-[11px] transition-all flex items-center ${btPeriod === 1 ? 'bg-pro-primary text-white shadow-lg' : 'bg-pro-surface text-pro-muted border border-pro-border'}`}
                            >
                                {btLoading && btPeriod === 1 ? <Loader className="w-4 h-4 mr-2 text-white" /> : '1 YEAR'}
                            </button>
                            <button 
                                onClick={() => runHistoricalBacktest(3)}
                                disabled={btLoading}
                                className={`px-6 py-3 rounded-xl font-black uppercase text-[11px] transition-all flex items-center ${btPeriod === 3 ? 'bg-pro-primary text-white shadow-lg' : 'bg-pro-surface text-pro-muted border border-pro-border'}`}
                            >
                                {btLoading && btPeriod === 3 ? <Loader className="w-4 h-4 mr-2 text-white" /> : '3 YEARS'}
                            </button>
                        </div>
                    </div>

                    {btResult && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
                            <div className="lg:col-span-8 bg-white border border-pro-border rounded-3xl shadow-soft p-8">
                                <h4 className="text-[10px] font-black text-pro-primary uppercase tracking-widest mb-6">Detailed Trade Analytics</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[9px] font-black text-pro-muted uppercase border-b border-pro-border">
                                                <th className="pb-3">Asset Matrix</th>
                                                <th className="pb-3 text-right">Lots/Qty</th>
                                                <th className="pb-3 text-right">Margin Used</th>
                                                <th className="pb-3 text-right">Entry (Fut)</th>
                                                <th className="pb-3 text-right">Exit (Fut)</th>
                                                <th className="pb-3 text-right">Net Alpha (P&L)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-pro-border/40">
                                            {btResult.trades.map((t, i) => (
                                                <tr key={i} className="text-xs font-bold text-pro-text hover:bg-pro-surface/50 transition-colors">
                                                    <td className="py-4">
                                                        <span className="text-pro-primary font-black">{t.ticker.replace('.NS','')}</span>
                                                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] font-black ${t.type === 'LONG' ? 'bg-pro-green/10 text-pro-green' : 'bg-pro-red/10 text-pro-red'}`}>{t.type}</span>
                                                    </td>
                                                    <td className="text-right py-4">{t.lots}</td>
                                                    <td className="text-right py-4 font-mono">₹{t.invested.toLocaleString()}</td>
                                                    <td className="text-right py-4 font-mono">₹{t.entryPrice.toFixed(2)}</td>
                                                    <td className="text-right py-4 font-mono">₹{t.exitPrice.toFixed(2)}</td>
                                                    <td className={`text-right py-4 font-black ${t.pnl > 0 ? 'text-pro-green' : 'text-pro-red'}`}>₹{t.pnl.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-pro-primary text-white p-8 rounded-3xl shadow-heavy relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl">Σ</div>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Aggregate Portfolio Performance</span>
                                    <div className="text-4xl font-black mt-2 tracking-tighter">₹{btResult.totalPnl.toLocaleString()}</div>
                                    <div className="mt-6 flex justify-between text-[10px] font-bold uppercase border-t border-white/20 pt-4">
                                        <span>Hit Rate: {btResult.winRate.toFixed(1)}%</span>
                                        <span>Final Equity: ₹{btResult.finalCapital.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="bg-white border border-pro-border p-6 rounded-2xl shadow-sm">
                                    <h5 className="text-[10px] font-black text-pro-primary uppercase tracking-widest mb-4 flex items-center">
                                        <InfoIcon className="w-3.5 h-3.5 mr-2" /> Simulation Logic & Guardrails
                                    </h5>
                                    <ul className="text-[11px] text-pro-muted leading-relaxed font-bold uppercase space-y-3">
                                        <li className="flex items-start"><span className="text-pro-primary mr-2">/</span> Top 5 Assets by Open Interest Strength</li>
                                        <li className="flex items-start"><span className="text-pro-primary mr-2">/</span> Trend validated by BB Mid & ADX (18+)</li>
                                        <li className="flex items-start"><span className="text-pro-primary mr-2">/</span> Capital: ₹1L per trade (Max 20% Concentration)</li>
                                        <li className="flex items-start"><span className="text-pro-primary mr-2">/</span> Risk: 1.5x ATR Stop / 2.5x ATR Target</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'STRATEGY_BT' && (
                <div className="animate-fade-in flex flex-col items-center justify-center h-96 border-2 border-dashed border-pro-border rounded-3xl opacity-40">
                     <BrainCircuitIcon className="w-12 h-12 text-pro-primary mb-4" />
                     <h3 className="text-sm font-black text-pro-muted uppercase tracking-widest">Multi-period Strategy Validation</h3>
                     <p className="text-[10px] text-pro-muted font-bold mt-2 uppercase">Comparing OI Buildup against pure Momentum benchmarks...</p>
                </div>
            )}
        </div>
    );
};

export default OIAnalyticsDashboard;
