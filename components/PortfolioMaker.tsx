
import React, { useState, useEffect, useMemo } from 'react';
import type { ProcessedStock, PortfolioMetrics, OptimizationRecommendation, FundamentalFilters } from '../types';
import { getPortfolioMetrics } from '../services/portfolioService';
import { suggestFundamentalFilters } from '../services/geminiService';
import { Loader } from './Loader';
import { XIcon, BrainCircuitIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';

interface PortfolioMakerProps {
    stocks: ProcessedStock[];
    marketRegime?: string;
}

const PortfolioMaker: React.FC<PortfolioMakerProps> = ({ stocks, marketRegime = "Neutral" }) => {
    const [step, setStep] = useState<'screen' | 'optimize'>('screen');
    const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
    const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiSuggesting, setAiSuggesting] = useState(false);
    
    // Fundamental Filters
    const [filters, setFilters] = useState<FundamentalFilters>({
        maxPE: 100,
        maxPB: 10,
        minROE: 0,
        maxDebtEquity: 500,
        minDivYield: 0
    });

    const [searchTerm, setSearchTerm] = useState('');

    const screenedStocks = useMemo(() => {
        return stocks.filter(stock => {
            const f = stock.data.fundamentals;
            if (!f) return false;
            
            const matchesTicker = stock.ticker.toUpperCase().includes(searchTerm.toUpperCase());
            const matchesPE = filters.maxPE === undefined || (f.peRatio !== undefined && f.peRatio <= filters.maxPE);
            const matchesPB = filters.maxPB === undefined || (f.pbRatio !== undefined && f.pbRatio <= filters.maxPB);
            const matchesROE = filters.minROE === undefined || (f.roe !== undefined && f.roe >= filters.minROE);
            const matchesDebt = filters.maxDebtEquity === undefined || (f.debtToEquity !== undefined && f.debtToEquity <= filters.maxDebtEquity);
            const matchesDiv = filters.minDivYield === undefined || (f.dividendYield !== undefined && f.dividendYield >= filters.minDivYield);

            return matchesTicker && matchesPE && matchesPB && matchesROE && matchesDebt && matchesDiv;
        });
    }, [stocks, filters, searchTerm]);

    const selectedStocks = useMemo(() => 
        stocks.filter(s => selectedTickers.includes(s.ticker)), 
    [stocks, selectedTickers]);

    const handleToggleStock = (ticker: string) => {
        setSelectedTickers(prev => 
            prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
        );
    };

    const handleAiSuggest = async () => {
        setAiSuggesting(true);
        const suggested = await suggestFundamentalFilters(marketRegime);
        setFilters(suggested);
        setAiSuggesting(false);
    };

    const handleFilterChange = (key: keyof FundamentalFilters, value: number) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        const updateMetrics = async () => {
            if (step === 'optimize' && selectedTickers.length > 0) {
                setLoading(true);
                const res = await getPortfolioMetrics(selectedStocks, stocks);
                setMetrics(res);
                setLoading(false);
            }
        };
        updateMetrics();
    }, [step, selectedTickers, stocks]);

    return (
        <div className="p-6 font-mono h-full overflow-y-auto bg-bb-black space-y-8">
            <header className="border-b border-bb-orange pb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-bb-orange uppercase tracking-wider">&gt;&gt; PORTFOLIO_FACTORY_v3.0</h2>
                    <p className="text-bb-muted text-[10px] mt-1 uppercase">Workflow: Fundamental Screening &gt; AI Diversification & Optimization</p>
                </div>
                <div className="flex bg-bb-panel border border-bb-border rounded overflow-hidden">
                    <button 
                        onClick={() => setStep('screen')}
                        className={`px-4 py-1 text-[10px] font-bold uppercase transition-colors ${step === 'screen' ? 'bg-bb-orange text-bb-black' : 'text-bb-muted hover:text-white'}`}
                    >
                        1. SCREENER
                    </button>
                    <button 
                        onClick={() => setStep('optimize')}
                        className={`px-4 py-1 text-[10px] font-bold uppercase transition-colors ${step === 'optimize' ? 'bg-bb-orange text-bb-black' : 'text-bb-muted hover:text-white'}`}
                    >
                        2. OPTIMIZER
                    </button>
                </div>
            </header>

            {step === 'screen' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Panel: Filters */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-bb-panel border border-bb-border p-5">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Filter Matrix</h3>
                                <button 
                                    onClick={handleAiSuggest}
                                    disabled={aiSuggesting}
                                    className="flex items-center text-[9px] font-bold text-bb-orange border border-bb-orange px-2 py-1 hover:bg-bb-orange hover:text-bb-black transition-all disabled:opacity-50"
                                >
                                    {aiSuggesting ? <Loader className="w-3 h-3 mr-1" /> : <BrainCircuitIcon className="w-3 h-3 mr-1" />}
                                    AI SUGGEST
                                </button>
                            </div>

                            <div className="space-y-5">
                                <FilterSlider 
                                    label="Max P/E Ratio" 
                                    value={filters.maxPE || 100} 
                                    min={1} max={150} 
                                    onChange={(v) => handleFilterChange('maxPE', v)} 
                                />
                                <FilterSlider 
                                    label="Max P/B Ratio" 
                                    value={filters.maxPB || 10} 
                                    min={0.1} max={30} step={0.1}
                                    onChange={(v) => handleFilterChange('maxPB', v)} 
                                />
                                <FilterSlider 
                                    label="Min ROE (%)" 
                                    value={filters.minROE || 0} 
                                    min={0} max={60} 
                                    onChange={(v) => handleFilterChange('minROE', v)} 
                                />
                                <FilterSlider 
                                    label="Max Debt/Equity" 
                                    value={filters.maxDebtEquity || 500} 
                                    min={0} max={1000} 
                                    onChange={(v) => handleFilterChange('maxDebtEquity', v)} 
                                />
                                <FilterSlider 
                                    label="Min Div Yield (%)" 
                                    value={filters.minDivYield || 0} 
                                    min={0} max={10} step={0.1}
                                    onChange={(v) => handleFilterChange('minDivYield', v)} 
                                />
                            </div>
                        </div>

                        <div className="bg-bb-dark border border-bb-border p-4 text-[9px] text-bb-muted uppercase leading-relaxed">
                            <h4 className="text-white font-bold mb-1">DATA DISCLOSURE:</h4>
                            Fundamentals are aggregated from Yahoo Finance quote summaries. If real-time connectivity fails, the engine uses high-probability sector proxies based on trailing 12-month sector volatility.
                        </div>
                    </div>

                    {/* Right Panel: Screened List */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="bg-bb-panel border border-bb-border p-6 flex flex-col h-[600px]">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex-1 mr-4">
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="SEARCH TICKER IN UNIVERSE..."
                                        className="w-full bg-bb-black border border-bb-border text-xs px-4 py-2 text-bb-orange outline-none focus:border-bb-orange uppercase"
                                    />
                                </div>
                                <div className="text-[10px] text-bb-muted font-bold">
                                    MATCHES: <span className="text-white">{screenedStocks.length}</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar border border-bb-border bg-bb-black/40">
                                <table className="w-full text-left text-[10px] font-mono border-collapse">
                                    <thead className="bg-bb-dark sticky top-0 border-b border-bb-border text-bb-muted uppercase">
                                        <tr>
                                            <th className="p-3 font-normal">Ticker</th>
                                            <th className="p-3 font-normal">P/E</th>
                                            <th className="p-3 font-normal">P/B</th>
                                            <th className="p-3 font-normal">ROE%</th>
                                            <th className="p-3 font-normal">D/E</th>
                                            <th className="p-3 font-normal text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bb-border/30">
                                        {screenedStocks.map(stock => {
                                            const isSelected = selectedTickers.includes(stock.ticker);
                                            return (
                                                <tr key={stock.ticker} className={`hover:bg-bb-panel/50 transition-colors ${isSelected ? 'bg-bb-blue/5' : ''}`}>
                                                    <td className="p-3 font-bold text-bb-blue">{stock.ticker}</td>
                                                    <td className="p-3">{stock.data.fundamentals?.peRatio?.toFixed(1) || 'N/A'}</td>
                                                    <td className="p-3">{stock.data.fundamentals?.pbRatio?.toFixed(1) || 'N/A'}</td>
                                                    <td className="p-3">{stock.data.fundamentals?.roe?.toFixed(1) || 'N/A'}%</td>
                                                    <td className="p-3">{stock.data.fundamentals?.debtToEquity?.toFixed(0) || 'N/A'}</td>
                                                    <td className="p-3 text-right">
                                                        <button 
                                                            onClick={() => handleToggleStock(stock.ticker)}
                                                            className={`px-3 py-1 font-bold text-[9px] border transition-all ${isSelected ? 'bg-bb-red/20 border-bb-red text-bb-red hover:bg-bb-red hover:text-black' : 'bg-bb-green/20 border-bb-green text-bb-green hover:bg-bb-green hover:text-black'}`}
                                                        >
                                                            {isSelected ? 'REMOVE' : 'SELECT'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="mt-4 flex justify-between items-center">
                                <div className="text-[10px] text-bb-muted uppercase">
                                    Total Selected: <span className="text-bb-blue font-bold">{selectedTickers.length}</span>
                                </div>
                                <button 
                                    onClick={() => setStep('optimize')}
                                    disabled={selectedTickers.length === 0}
                                    className="bg-bb-orange text-bb-black font-bold px-8 py-2 text-xs uppercase hover:bg-white transition-all disabled:opacity-50"
                                >
                                    Proceed to Diversification {">>"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Optimization Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Allocations Table */}
                        <div className="lg:col-span-8 bg-bb-panel border border-bb-border p-6 space-y-4">
                            <h3 className="text-xs font-bold text-white uppercase mb-4 border-b border-bb-border pb-2">
                                Optimal Portfolio Diversification
                            </h3>
                            <div className="space-y-3">
                                {selectedTickers.map(t => {
                                    const weight = metrics?.optimalWeights[t] || (100 / selectedTickers.length);
                                    return (
                                        <div key={t} className="bg-bb-black border border-bb-border p-3 flex items-center justify-between group">
                                            <div className="flex items-center space-x-4 flex-1">
                                                <div className="w-16 text-xs font-bold text-bb-blue">{t}</div>
                                                <div className="flex-1 h-2 bg-bb-dark border border-bb-border rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-bb-blue transition-all duration-1000" 
                                                        style={{ width: `${weight}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4 ml-6">
                                                <span className="text-xs font-bold text-white w-12 text-right">{weight.toFixed(1)}%</span>
                                                <button onClick={() => handleToggleStock(t)} className="text-bb-muted hover:text-bb-red transition-colors">
                                                    <XIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Summary Metrics */}
                        <div className="lg:col-span-4 space-y-6">
                            {metrics && (
                                <div className="grid grid-cols-1 gap-4">
                                    <StatBox label="Annualized Return" value={`${metrics.annualReturn.toFixed(2)}%`} color="text-bb-green" />
                                    <StatBox label="Annualized Vol" value={`${metrics.annualVolatility.toFixed(2)}%`} color="text-bb-red" />
                                    <StatBox 
                                        label="SHARPE RATIO" 
                                        value={metrics.sharpeRatio.toFixed(2)} 
                                        color={metrics.sharpeRatio > 2 ? 'text-bb-green' : metrics.sharpeRatio > 1 ? 'text-bb-blue' : 'text-bb-orange'} 
                                        subtext="Efficiency"
                                    />
                                </div>
                            )}
                            <button 
                                onClick={() => setStep('screen')}
                                className="w-full py-2 border border-bb-muted text-bb-muted hover:text-white hover:border-white text-[10px] font-bold uppercase transition-all"
                            >
                                {/* Fix: Use a string literal to avoid JSX parser errors with the '<' character */}
                                {"<< Modify Selection"}
                            </button>
                        </div>
                    </div>

                    {/* AI Analysis */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader className="w-8 h-8 text-bb-orange mb-4" />
                            <p className="text-bb-orange text-[10px] uppercase blink">Calibrating Portfolio DNA...</p>
                        </div>
                    ) : metrics && (
                        <div className="space-y-6">
                            <div className="bg-bb-panel border border-bb-orange p-6 relative">
                                <h3 className="text-xs font-bold text-bb-orange uppercase flex items-center mb-4 tracking-widest">
                                    <BrainCircuitIcon className="w-4 h-4 mr-2" /> AI DIVERSIFICATION INSIGHT
                                </h3>
                                <p className="text-xs text-bb-text leading-relaxed uppercase border-l-2 border-bb-orange pl-4 italic">
                                    "{metrics.aiInsight}"
                                </p>
                            </div>

                            <div className="bg-bb-dark border border-bb-border p-6">
                                <h3 className="text-xs font-bold text-bb-blue uppercase mb-4 border-b border-bb-border pb-2">Institutional Alpha Boost</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {metrics.recommendations.map(rec => (
                                        <div key={rec.ticker} className="bg-bb-panel border border-bb-border p-4 flex flex-col justify-between hover:border-bb-blue transition-colors">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-lg font-bold text-white">{rec.ticker}</span>
                                                    <span className="text-[9px] px-1 bg-bb-blue text-black font-bold uppercase">SUGGESTION</span>
                                                </div>
                                                <p className="text-[9px] text-bb-muted uppercase mb-4 leading-tight">{rec.reason}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleToggleStock(rec.ticker)}
                                                className="w-full py-1 text-[9px] font-bold border border-bb-blue text-bb-blue hover:bg-bb-blue hover:text-black transition-all uppercase"
                                            >
                                                Add to Matrix
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const FilterSlider: React.FC<{ label: string, value: number, min: number, max: number, step?: number, onChange: (v: number) => void }> = ({ label, value, min, max, step = 1, onChange }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase">
            <span className="text-bb-muted">{label}</span>
            <span className="text-white bg-bb-black px-2 border border-bb-border">{value}</span>
        </div>
        <input 
            type="range" 
            min={min} max={max} step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-bb-dark rounded-lg appearance-none cursor-pointer accent-bb-orange"
        />
    </div>
);

const StatBox: React.FC<{ label: string, value: string, color: string, subtext?: string }> = ({ label, value, color, subtext }) => (
    <div className="bg-bb-panel border border-bb-border p-4 flex flex-col items-center justify-center">
        <span className="text-[9px] text-bb-muted uppercase mb-1 tracking-widest">{label}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {subtext && <span className="text-[8px] text-bb-muted mt-1 uppercase">{subtext}</span>}
    </div>
);

export default PortfolioMaker;
