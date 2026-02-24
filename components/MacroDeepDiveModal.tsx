import React from 'react';
import type { MacroDeepDive } from '../types';
import { Loader } from './Loader';
import { BrainCircuitIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';

interface MacroDeepDiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    label: string;
    description: string;
    data: MacroDeepDive | null;
    isLoading: boolean;
}

const MacroDeepDiveModal: React.FC<MacroDeepDiveModalProps> = ({ isOpen, onClose, label, description, data, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 font-mono overflow-y-auto">
            <div className="bg-bb-black w-full max-w-4xl border-2 border-bb-orange shadow-[0_0_40px_rgba(255,153,0,0.3)] flex flex-col max-h-[90vh]">
                <header className="bg-bb-orange text-bb-black p-3 flex justify-between items-center shrink-0">
                    <div className="flex items-center space-x-2">
                        <BrainCircuitIcon className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-widest">Macro_Intelligence_Deep_Dive_v3</span>
                    </div>
                    <button onClick={onClose} className="hover:bg-bb-black hover:text-bb-orange px-2 transition-colors font-bold">[X]</button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    <div className="border-b border-bb-border pb-4">
                        <h2 className="text-2xl font-bold text-white uppercase mb-2">{label}</h2>
                        <p className="text-bb-muted text-xs uppercase italic">Original Intel: {description}</p>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader className="w-16 h-16 text-bb-orange mb-4" />
                            <p className="text-bb-orange text-xs animate-pulse uppercase tracking-[0.2em]">Synthesizing Sectoral Consequences...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-10 animate-fade-in pb-8">
                            
                            {/* Summary Section */}
                            <div className="bg-bb-dark border-l-4 border-bb-blue p-5">
                                <h3 className="text-[10px] font-bold text-bb-blue uppercase mb-2 tracking-widest">{">>"} STRATEGIC IMPACT SUMMARY</h3>
                                <p className="text-sm text-bb-text uppercase leading-relaxed font-medium italic">"{data.summary}"</p>
                            </div>

                            {/* Chain of Consequences */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-bb-orange uppercase tracking-widest">{">>"} THE CHAIN OF CONSEQUENCES (DOTS CONNECTED)</h3>
                                <div className="space-y-4 relative pl-8">
                                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-bb-border"></div>
                                    {data.consequences.map((c, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[25px] top-1.5 w-4 h-4 rounded-full bg-bb-panel border border-bb-orange flex items-center justify-center text-[8px] font-bold text-bb-orange">{i+1}</div>
                                            <h4 className="text-xs font-bold text-white uppercase mb-1">{c.step}</h4>
                                            <p className="text-[11px] text-bb-muted uppercase leading-tight">{c.impact}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Impacted Stocks Section */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-bb-green uppercase tracking-widest">{">>"} IDENTIFIED ALPHA TARGETS (EQUITY UNIVERSE)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.impactedStocks.map((stock, i) => (
                                        <div key={i} className="bg-bb-panel border border-bb-border p-4 hover:border-bb-blue transition-colors group">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xl font-bold text-bb-blue group-hover:scale-105 transition-transform">${stock.ticker}</span>
                                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${stock.sentiment === 'Bullish' ? 'bg-bb-green/20 text-bb-green border border-bb-green' : 'bg-bb-red/20 text-bb-red border border-bb-red'}`}>
                                                    {stock.sentiment}
                                                </span>
                                            </div>
                                            <div className="mb-3">
                                                <span className="text-[8px] text-bb-muted uppercase font-bold block mb-1">Impact Metric:</span>
                                                <span className="text-[10px] text-white font-mono bg-bb-black px-1.5 py-0.5 border border-bb-border">{stock.keyMetric}</span>
                                            </div>
                                            <p className="text-[10px] text-bb-text uppercase leading-relaxed opacity-80 italic">"{stock.reasoning}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Final Alpha Recommendation */}
                            <div className="bg-bb-dark border border-bb-green p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-5 text-6xl font-bold text-bb-green pointer-events-none tracking-tighter">ALPHA</div>
                                <h3 className="text-xs font-bold text-bb-green uppercase mb-3 tracking-widest flex items-center">
                                    <BrainCircuitIcon className="w-4 h-4 mr-2" /> FINAL RECOMMENDATION & REASONING
                                </h3>
                                <p className="text-sm text-white font-bold leading-7 uppercase">
                                    {data.finalRecommendation}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-20 text-center text-bb-muted uppercase italic">Neural linkage error. Deep dive failed.</div>
                    )}
                </div>

                <footer className="bg-bb-panel border-t border-bb-border p-3 text-[10px] text-bb-muted flex justify-between items-center shrink-0">
                    <span className="uppercase">NOTE: Analysis driven by real-time corporate filings & trade data grounding.</span>
                    <span className="text-bb-orange font-bold uppercase tracking-widest animate-pulse">Syncing Alpha Stream...</span>
                </footer>
            </div>
        </div>
    );
};

export default MacroDeepDiveModal;
