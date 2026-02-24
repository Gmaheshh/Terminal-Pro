import React, { useMemo, useState } from 'react';
import { BrainCircuitIcon, ListIcon, ArrowUpIcon, InfoIcon, RefreshCwIcon, ArrowDownIcon } from './Icons';
import type { TabType, ProcessedStock } from '../types';
import type { MainCategory } from '../constants';

interface HomeHubProps {
    onNavigate: (category: MainCategory, tab: TabType) => void;
    stocks: ProcessedStock[];
    onAnalyze: (ticker: string) => void;
}

const HomeHub: React.FC<HomeHubProps> = ({ onNavigate, stocks, onAnalyze }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSearch = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) return [];
        return stocks.filter(s => 
            s.ticker.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
    }, [stocks, searchQuery]);

    const marketStats = useMemo(() => {
        if (!stocks.length) return null;
        const sorted = [...stocks].sort((a, b) => {
            const aPrev = a.data.historical[a.data.historical.length - 2]?.close || a.data.currentPrice;
            const bPrev = b.data.historical[b.data.historical.length - 2]?.close || b.data.currentPrice;
            const aChange = (a.data.currentPrice - aPrev) / aPrev;
            const bChange = (b.data.currentPrice - bPrev) / bPrev;
            return bChange - aChange;
        });
        return {
            topGainers: sorted.slice(0, 6),
            topLosers: sorted.slice(-6).reverse(),
            volSpikes: stocks.filter(s => s.signals.volumeSignal === 'Spike').slice(0, 8)
        };
    }, [stocks]);

    return (
        <div className="p-8 font-sans h-full overflow-y-auto bg-pro-bg custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-20">
                
                {/* Institutional Hero Section */}
                <section className="text-center py-12 space-y-8 max-w-5xl mx-auto">
                    <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-pro-primary/5 border border-pro-primary/10 rounded-full">
                        <span className="flex h-2 w-2 rounded-full bg-pro-primary animate-pulse"></span>
                        <span className="text-[10px] font-black text-pro-primary uppercase tracking-[0.2em]">Institutional Terminal v4.2.5 Active</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black text-pro-text leading-[0.85] tracking-tighter uppercase">
                        Bridging the Gap: <span className="text-pro-red">PRA</span><span className="text-pro-green">-GATI</span> For Individual Traders.
                    </h1>
                    
                    <p className="text-pro-muted font-bold text-xs uppercase tracking-[0.3em] opacity-60">
                        High-Fidelity Intelligence • Distributed Institutional Quantitative Alpha
                    </p>

                    {/* Omni-Search Engine - Center Aligned */}
                    <div className="max-w-2xl mx-auto relative z-50 pt-4">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-pro-primary/10 rounded-3xl blur-2xl group-focus-within:bg-pro-primary/20 transition-all"></div>
                            <div className="relative bg-white border-2 border-pro-border rounded-3xl shadow-soft flex items-center p-3 group-focus-within:border-pro-primary transition-all">
                                <div className="p-3">
                                    <svg className="w-5 h-5 text-pro-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/></svg>
                                </div>
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="SCAN ANY STOCK FOR DEEP-DIVE ANALYSIS..."
                                    className="flex-1 bg-transparent border-none text-sm font-black text-pro-text focus:outline-none placeholder:text-pro-muted/40 uppercase tracking-widest"
                                />
                            </div>
                        </div>
                        {filteredSearch.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-pro-border rounded-3xl shadow-heavy overflow-hidden animate-fade-in ring-4 ring-pro-primary/5 text-left">
                                <div className="p-2 space-y-1">
                                    {filteredSearch.map(stock => (
                                        <button 
                                            key={stock.ticker}
                                            onClick={() => { onAnalyze(stock.ticker); setSearchQuery(''); }}
                                            className="w-full flex items-center justify-between p-5 hover:bg-pro-primary/5 rounded-2xl transition-all group/res"
                                        >
                                            <div className="flex items-center space-x-5">
                                                <span className="bg-pro-surface border border-pro-border px-3 py-1.5 rounded-xl text-xs font-black text-pro-primary shadow-sm">{stock.ticker.replace('.NS','')}</span>
                                                <div>
                                                    <div className="text-[10px] font-black text-pro-muted uppercase tracking-wider leading-none mb-1">Current Spot</div>
                                                    <div className="text-base font-bold text-pro-text font-mono">₹{stock.data.currentPrice.toFixed(2)}</div>
                                                </div>
                                            </div>
                                            <span className="p-2 rounded-full bg-pro-primary/10 text-pro-primary group-hover/res:scale-110 transition-transform">
                                                <ArrowUpIcon className="w-4 h-4 rotate-90" />
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Journey Section - Intelligence -> Investing -> Trading */}
                <section className="space-y-12">
                    <div className="flex items-center space-x-4 px-2">
                        <span className="h-px bg-pro-border flex-1"></span>
                        <h3 className="text-[10px] font-black text-pro-muted uppercase tracking-[0.5em]">Strategize your Day</h3>
                        <span className="h-px bg-pro-border flex-1"></span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <PortalCard 
                            step="01"
                            title="Intelligence"
                            subtitle="Start Day: Global News"
                            description="Every morning begins here. Scan institutional news wires and global macro sentiment to understand the 'Why' behind market moves."
                            icon={<RefreshCwIcon className="w-6 h-6" />}
                            color="text-pro-accent"
                            bg="bg-pro-accent/5"
                            onAction={() => onNavigate('Intelligence Hub', 'Recent News')}
                            badge="Analyze First"
                        />
                        <PortalCard 
                            step="02"
                            title="Investing"
                            subtitle="Build Wealth: Fundamental"
                            description="Analyze core company health metrics and build a portfolio for the long haul. Focused on wealth preservation and compound growth."
                            icon={<ListIcon className="w-6 h-6" />}
                            color="text-emerald-500"
                            bg="bg-emerald-500/5"
                            onAction={() => onNavigate('Investing Tree', 'Company Analysis')}
                            badge="Long-term"
                        />
                        <PortalCard 
                            step="03"
                            title="Trading"
                            subtitle="Active Income: Swing & F&O"
                            description="Deploy algorithmic swing signals and professional derivative tools for hedging and arbitrage. Designed for active traders."
                            icon={<BrainCircuitIcon className="w-6 h-6" />}
                            color="text-pro-primary"
                            bg="bg-pro-primary/5"
                            onAction={() => onNavigate('Trading Tree', 'Volume/Trend')}
                            badge="Active Strategy"
                        />
                    </div>
                </section>

                {/* Distributed Market Pulse */}
                <section className="bg-white border border-pro-border rounded-[3rem] p-10 shadow-soft">
                    <div className="flex justify-between items-center mb-12 border-b border-pro-border pb-8">
                        <div>
                            <h2 className="text-2xl font-black text-pro-text uppercase tracking-tight">Market Pulse Scanners</h2>
                            <p className="text-[10px] text-pro-muted font-bold uppercase tracking-widest mt-1">Real-time Institutional Footprint Mapping</p>
                        </div>
                        <div className="text-right">
                             <span className="text-[9px] font-black text-pro-primary uppercase px-4 py-1.5 bg-pro-primary/5 rounded-full border border-pro-primary/10 tracking-widest shadow-sm">Sync: Nominal</span>
                        </div>
                    </div>

                    {marketStats ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                            <PulseGroup title="Alpha Momentum (Up)" items={marketStats.topGainers} type="UP" onAnalyze={onAnalyze} />
                            <PulseGroup title="Distribution Phase (Down)" items={marketStats.topLosers} type="DOWN" onAnalyze={onAnalyze} />
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-black text-pro-muted uppercase mb-8 tracking-widest flex items-center">
                                    <InfoIcon className="w-3.5 h-3.5 mr-2 text-pro-primary" /> Recent Volatility Spikes
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {marketStats.volSpikes.map(s => (
                                        <div key={s.ticker} onClick={() => onAnalyze(s.ticker)} className="p-4 bg-pro-bg border border-pro-border rounded-2xl flex flex-col hover:border-pro-primary transition-all cursor-pointer group/spike text-center justify-center">
                                            <span className="text-xs font-black text-pro-text group-hover:text-pro-primary transition-colors">{s.ticker.replace('.NS','')}</span>
                                            <span className="text-[9px] font-bold text-pro-primary uppercase mt-1">Spike Link</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-30">
                            <RefreshCwIcon className="w-12 h-12 animate-spin text-pro-primary" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Connecting Neural Matrix...</p>
                        </div>
                    )}
                </section>

                <footer className="text-center pt-10 pb-20 border-t border-pro-border/40 opacity-40">
                     <p className="text-[9px] text-pro-muted font-bold uppercase tracking-[0.6em] flex items-center justify-center">
                        &copy; 2025 <span className="text-pro-red">PRA</span><span className="text-pro-green">-GATI</span> Alpha • Professional Retail Architecture
                     </p>
                </footer>
            </div>
        </div>
    );
};

const PortalCard: React.FC<{ step: string, title: string, subtitle: string, description: string, icon: React.ReactNode, color: string, bg: string, badge?: string, onAction: () => void }> = ({ step, title, subtitle, description, icon, color, bg, badge, onAction }) => (
    <div onClick={onAction} className="bg-white border border-pro-border p-10 rounded-[3rem] shadow-soft hover:shadow-heavy transition-all duration-500 group cursor-pointer relative overflow-hidden flex flex-col justify-between h-full min-h-[420px]">
        <div className={`absolute top-0 right-0 p-10 opacity-[0.03] transition-all group-hover:scale-150 group-hover:opacity-10 duration-700 ${color}`}>
            {icon}
        </div>
        <div className="flex flex-col items-start flex-1">
            <div className="w-full flex justify-between items-start mb-8">
                <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <span className="text-3xl font-black text-pro-border/40 group-hover:text-pro-primary/20 transition-colors">{step}</span>
            </div>
            <div className="h-44 flex flex-col justify-start">
                {badge && <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border mb-4 self-start ${color} ${bg} border-current`}>{badge}</span>}
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] block leading-none mb-2 ${color}`}>{subtitle}</span>
                <h2 className="text-3xl font-black text-pro-text uppercase tracking-tighter mt-1">{title}</h2>
                <p className="text-[13px] text-pro-muted font-medium leading-relaxed mt-5 opacity-80 uppercase italic">
                    {description}
                </p>
            </div>
        </div>
        <div className="mt-auto pt-6 border-t border-pro-border w-full flex justify-between items-center shrink-0">
            <span className="text-[10px] font-black text-pro-text uppercase tracking-widest group-hover:text-pro-primary transition-colors">Launch Module {">>"}</span>
            <span className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 ${bg} ${color}`}>
                <ArrowUpIcon className="w-5 h-5 rotate-90" />
            </span>
        </div>
    </div>
);

const PulseGroup: React.FC<{ title: string, items: ProcessedStock[], type: 'UP' | 'DOWN', onAnalyze: (t: string) => void }> = ({ title, items, type, onAnalyze }) => (
    <div className="flex flex-col flex-1">
        <h3 className="text-[10px] font-black text-pro-muted uppercase mb-8 tracking-widest flex items-center h-4">
            {type === 'UP' ? <ArrowUpIcon className="w-4 h-4 mr-3 text-pro-green" /> : <ArrowDownIcon className="w-4 h-4 mr-3 text-pro-red" />}
            {title}
        </h3>
        <div className="space-y-4 flex-1">
            {items.map(s => {
                const prev = s.data.historical[s.data.historical.length - 2]?.close || s.data.currentPrice;
                const change = ((s.data.currentPrice - prev) / prev) * 100;
                return (
                    <div key={s.ticker} onClick={() => onAnalyze(s.ticker)} className="flex justify-between items-center bg-pro-bg p-4 rounded-2xl border border-pro-border/50 hover:bg-white hover:border-pro-primary/30 hover:shadow-sm transition-all group cursor-pointer h-14">
                        <span className="text-xs font-black text-pro-text uppercase tracking-tight group-hover:text-pro-primary transition-colors">{s.ticker.replace('.NS','')}</span>
                        <div className="flex items-center space-x-5 font-mono">
                            <span className="text-[10px] font-bold text-pro-muted">₹{s.data.currentPrice.toFixed(1)}</span>
                            <span className={`text-xs font-black ${type === 'UP' ? 'text-pro-green' : 'text-pro-red'}`}>
                                {change > 0 ? '+' : ''}{change.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

export default HomeHub;