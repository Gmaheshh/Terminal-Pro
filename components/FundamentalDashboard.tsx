
import React, { useState, useMemo } from 'react';
import type { ProcessedStock, FinancialStatementRow } from '../types';
import { InfoIcon } from './Icons';

interface FundamentalDashboardProps {
    stocks: ProcessedStock[];
}

type AnalysisTab = 'RATIOS' | 'P&L' | 'BALANCE' | 'CASHFLOW';

const CompanyAnalysis: React.FC<FundamentalDashboardProps> = ({ stocks }) => {
    const [selectedTicker, setSelectedTicker] = useState<string>(stocks[0]?.ticker || '');
    const [activeTab, setActiveTab] = useState<AnalysisTab>('RATIOS');

    const currentStock = useMemo(() => 
        stocks.find(s => s.ticker === selectedTicker), 
    [stocks, selectedTicker]);

    const formatValue = (val: number) => {
        if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        return `₹${val.toLocaleString()}`;
    };

    const StatementTable: React.FC<{ data: FinancialStatementRow[], years: string[] }> = ({ data, years }) => (
        <div className="overflow-x-auto border border-pro-border rounded-2xl bg-white shadow-soft">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-pro-surface border-b border-pro-border">
                        <th className="p-4 text-[10px] font-black text-pro-muted uppercase sticky left-0 bg-pro-surface">Line Item</th>
                        {years.map(y => (
                            <th key={y} className="p-4 text-[10px] font-black text-pro-muted uppercase text-right">{y}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-pro-border/40">
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-pro-bg/30 transition-colors">
                            <td className="p-4 text-xs font-bold text-pro-text sticky left-0 bg-white group-hover:bg-pro-bg/30">{row.label}</td>
                            {row.values.map((v, idx) => (
                                <td key={idx} className="p-4 text-xs font-medium text-right font-mono text-pro-muted">
                                    {formatValue(v)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="p-10 font-sans h-full overflow-y-auto bg-pro-bg custom-scrollbar">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-pro-text tracking-tight uppercase">Company Analysis</h2>
                    <p className="text-pro-muted text-xs font-bold mt-1 uppercase tracking-[0.2em] opacity-60">
                        {currentStock?.ticker.split('.')[0]} • {currentStock?.data.fundamentals?.industry}
                    </p>
                </div>
                <div className="flex items-center space-x-4 w-full md:w-auto">
                    <div className="flex bg-white rounded-2xl p-1 shadow-soft border border-pro-border">
                        {(['RATIOS', 'P&L', 'BALANCE', 'CASHFLOW'] as AnalysisTab[]).map(t => (
                            <button 
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === t ? 'bg-pro-primary text-white shadow-md' : 'text-pro-muted hover:text-pro-text'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center bg-white rounded-2xl p-2 shadow-soft border border-pro-border flex-1 md:w-64">
                        <select 
                            value={selectedTicker}
                            onChange={(e) => setSelectedTicker(e.target.value)}
                            className="w-full bg-transparent border-none text-sm font-black text-pro-text focus:outline-none px-2 uppercase"
                        >
                            {stocks.map(s => <option key={s.ticker} value={s.ticker}>{s.ticker}</option>)}
                        </select>
                    </div>
                </div>
            </header>

            {currentStock ? (
                <div className="animate-fade-in pb-20 space-y-8">
                    {activeTab === 'RATIOS' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <RatioCard title="Valuation" icon={<InfoIcon className="w-4 h-4" />}>
                                <RatioRow label="P/E Ratio" value={currentStock.data.fundamentals?.peRatio?.toFixed(2) || 'N/A'} sub="Price to Earnings" />
                                <RatioRow label="P/B Ratio" value={currentStock.data.fundamentals?.pbRatio?.toFixed(2) || 'N/A'} sub="Price to Book" />
                                <RatioRow label="Market Cap" value={formatValue(currentStock.data.fundamentals?.marketCap || 0)} sub="Total Valuation" />
                            </RatioCard>

                            <RatioCard title="Efficiency" icon={<InfoIcon className="w-4 h-4" />}>
                                <RatioRow label="ROE (%)" value={`${currentStock.data.fundamentals?.roe?.toFixed(1)}%`} sub="Return on Equity" color="text-pro-green" />
                                <RatioRow label="ROCE (%)" value={`${currentStock.data.fundamentals?.roce?.toFixed(1)}%`} sub="Capital Employed" color="text-pro-primary" />
                                <RatioRow label="EPS" value={currentStock.data.fundamentals?.eps?.toFixed(2) || '0.00'} sub="Earnings Per Share" />
                            </RatioCard>

                            <RatioCard title="Risk & Yield" icon={<InfoIcon className="w-4 h-4" />}>
                                <RatioRow label="Debt / Equity" value={currentStock.data.fundamentals?.debtToEquity?.toFixed(2) || '0.00'} sub="Leverage" color={(currentStock.data.fundamentals?.debtToEquity || 0) > 1.5 ? 'text-pro-red' : 'text-pro-text'} />
                                <RatioRow label="Current Ratio" value={currentStock.data.fundamentals?.currentRatio?.toFixed(2) || '0.00'} sub="Liquidity" />
                                <RatioRow label="Dividend Yield" value={`${(currentStock.data.fundamentals?.dividendYield || 0).toFixed(2)}%`} sub="Cash Yield" />
                            </RatioCard>
                        </div>
                    )}

                    {activeTab === 'P&L' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-4">
                                <h3 className="text-sm font-black text-pro-text uppercase tracking-widest">Profit & Loss Statement (3 Years)</h3>
                                <span className="text-[10px] font-black text-pro-primary uppercase bg-pro-primary/5 px-3 py-1 rounded-full">Consolidated</span>
                            </div>
                            <StatementTable 
                                data={currentStock.data.fundamentals?.incomeStatement || []} 
                                years={currentStock.data.fundamentals?.years || []} 
                            />
                        </div>
                    )}

                    {activeTab === 'BALANCE' && (
                        <div className="space-y-6">
                             <div className="flex justify-between items-center px-4">
                                <h3 className="text-sm font-black text-pro-text uppercase tracking-widest">Balance Sheet (3 Years)</h3>
                                <span className="text-[10px] font-black text-pro-primary uppercase bg-pro-primary/5 px-3 py-1 rounded-full">Consolidated</span>
                            </div>
                            <StatementTable 
                                data={currentStock.data.fundamentals?.balanceSheet || []} 
                                years={currentStock.data.fundamentals?.years || []} 
                            />
                        </div>
                    )}

                    {activeTab === 'CASHFLOW' && (
                        <div className="space-y-6">
                             <div className="flex justify-between items-center px-4">
                                <h3 className="text-sm font-black text-pro-text uppercase tracking-widest">Cash Flow Statement (3 Years)</h3>
                                <span className="text-[10px] font-black text-pro-primary uppercase bg-pro-primary/5 px-3 py-1 rounded-full">Consolidated</span>
                            </div>
                            <StatementTable 
                                data={currentStock.data.fundamentals?.cashFlowStatement || []} 
                                years={currentStock.data.fundamentals?.years || []} 
                            />
                        </div>
                    )}

                    <div className="bg-pro-primary/5 border border-pro-primary/10 p-6 rounded-3xl">
                        <h4 className="text-[10px] font-black text-pro-primary uppercase mb-2 tracking-widest flex items-center">
                            <InfoIcon className="w-3.5 h-3.5 mr-2" /> Data Grounding Note
                        </h4>
                        <p className="text-[11px] text-pro-muted font-medium leading-relaxed uppercase">
                            Data is sourced via Yahoo Finance API modules. Historical figures represent audited annual reports. Ratios are calculated based on the Trailing 12 Months (TTM) where applicable. "0.00" or "N/A" indicates data point unavailability from the primary exchange link.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-pro-border rounded-[32px] opacity-30">
                     <p className="text-sm font-black uppercase tracking-widest">Awaiting Link Establishment...</p>
                </div>
            )}
        </div>
    );
};

const RatioCard: React.FC<{ title: string, children: React.ReactNode, icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="bg-white border border-pro-border p-8 rounded-[2rem] shadow-soft relative overflow-hidden group hover:border-pro-primary/30 transition-all">
        <div className="flex items-center space-x-2 mb-8">
            <div className="p-2 bg-pro-surface rounded-lg text-pro-primary">{icon}</div>
            <h3 className="text-[11px] font-black text-pro-primary uppercase tracking-widest">{title}</h3>
        </div>
        <div className="space-y-6 relative z-10">
            {children}
        </div>
    </div>
);

const RatioRow: React.FC<{ label: string, value: string, sub: string, color?: string }> = ({ label, value, sub, color = 'text-pro-text' }) => (
    <div className="flex justify-between items-end border-b border-pro-border/40 pb-3 group/row">
        <div>
            <span className="text-[10px] font-black text-pro-muted uppercase block leading-none mb-1.5">{label}</span>
            <span className="text-[9px] font-bold text-pro-muted/40 uppercase tracking-tighter">{sub}</span>
        </div>
        <span className={`text-2xl font-black ${color} tracking-tighter leading-none`}>{value}</span>
    </div>
);

export default CompanyAnalysis;
