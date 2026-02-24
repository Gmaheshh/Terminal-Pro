import React from 'react';
import type { ComprehensiveAnalysis, ProcessedStock } from '../types';
import { BrainCircuitIcon, LinkIcon, InfoIcon } from './Icons';
import { Loader } from './Loader';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string | null;
  data: ComprehensiveAnalysis | null;
  isLoading: boolean;
  stock?: ProcessedStock;
}

const IndicatorBadge: React.FC<{ label: string, value: string | number, color?: string }> = ({ label, value, color = "text-pro-text" }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-pro-border/40 text-[10px]">
        <span className="font-bold text-pro-muted uppercase tracking-tighter">{label}</span>
        <span className={`font-black ${color}`}>{value}</span>
    </div>
);

const AnalysisModal: React.FC<AnalysisModalProps> = ({ 
    isOpen, 
    onClose, 
    ticker, 
    data,
    isLoading,
    stock
}) => {
  if (!isOpen) return null;

  const getSentimentColor = (val: string) => {
    switch (val) {
      case 'Bullish': return 'text-pro-green';
      case 'Bearish': return 'text-pro-red';
      default: return 'text-pro-primary';
    }
  };

  const getActiveStrategy = () => {
    if (!stock) return null;
    const signals = [];
    if (stock.signals.volumeSignal === 'Spike') signals.push("VOLATILITY BREAKOUT");
    if (stock.signals.vwlmBuySignal) signals.push("VWLM (LONG)");
    if (stock.signals.vwlmSellSignal) signals.push("VWLM (SHORT)");
    return signals.length > 0 ? signals : null;
  };

  const strategies = getActiveStrategy();

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-6xl rounded-[3rem] shadow-heavy flex flex-col max-h-[95vh] overflow-hidden border border-pro-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-pro-primary text-white flex justify-between items-center px-10 py-6 font-black tracking-widest shrink-0">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-xl">
                <BrainCircuitIcon className="w-6 h-6" />
            </div>
            <div>
                <span className="text-sm font-extrabold block uppercase tracking-tighter">Alpha Intelligence Matrix</span>
                <span className="text-[10px] opacity-60 uppercase">Omni-Channel Signal Engine Active</span>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-3 rounded-full transition-colors font-bold group">
            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
          <div className="border-b border-pro-border pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h2 className="text-5xl font-black text-pro-text uppercase tracking-tighter">Target: <span className="text-pro-primary">{ticker}</span></h2>
                <div className="flex items-center mt-2 space-x-3">
                    <span className="text-pro-muted text-[11px] tracking-[0.2em] font-black uppercase">Institutional Scan Process: Nominal</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-pro-green animate-pulse"></span>
                </div>
              </div>
              
              {/* Strategy Verdict Component */}
              <div className="bg-pro-bg border border-pro-border rounded-3xl p-6 min-w-[320px] flex flex-col justify-center text-center shadow-soft">
                    <span className="text-[10px] font-black text-pro-muted uppercase mb-2 tracking-[0.2em]">Live Strategy Signal</span>
                    {strategies ? (
                        <div className="space-y-1">
                            {strategies.map(s => (
                                <div key={s} className="text-xl font-black text-pro-primary uppercase tracking-tight">{s}</div>
                            ))}
                            <div className="text-[9px] font-bold text-pro-green uppercase animate-pulse">{">>"} ACTIVE_CONVICTION</div>
                        </div>
                    ) : (
                        <div>
                            <div className="text-2xl font-black text-pro-muted opacity-40 uppercase tracking-tighter italic">NO SIGNAL</div>
                            <div className="text-[9px] font-bold text-pro-muted/40 uppercase mt-1">Quantitative Thresholds Not Triggered</div>
                        </div>
                    )}
              </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader className="w-16 h-16 text-pro-primary mb-6" />
                <p className="text-pro-primary text-xs font-black tracking-[0.4em] animate-pulse">Establishing Neural Uplink...</p>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in pb-10">
                
                {/* Metrics & Quants Column */}
                <div className="lg:col-span-4 space-y-8">
                    {stock && (
                        <div className="bg-pro-surface border border-pro-border p-6 rounded-3xl shadow-sm">
                            <h3 className="text-[10px] font-black text-pro-primary uppercase mb-6 tracking-widest border-b border-pro-border pb-3 flex items-center">
                                <InfoIcon className="w-3.5 h-3.5 mr-2" /> Live Market Pulse
                            </h3>
                            <div className="space-y-1">
                                <IndicatorBadge label="Institutional Price" value={`₹${stock.data.currentPrice.toFixed(2)}`} color="text-pro-text" />
                                <IndicatorBadge label="Trend (ADX)" value={stock.indicators.adx[stock.indicators.adx.length-1].toFixed(2)} color="text-pro-primary" />
                                <IndicatorBadge label="Momentum (RSI)" value={stock.indicators.rsi[stock.indicators.rsi.length-1].toFixed(1)} color={stock.indicators.rsi[stock.indicators.rsi.length-1] > 60 ? "text-pro-green" : "text-pro-text"} />
                                <IndicatorBadge label="Conviction (RVOL)" value={stock.indicators.rvol[stock.indicators.rvol.length-1].toFixed(2)} color="text-pro-accent" />
                                <IndicatorBadge label="OI Intake" value={`${stock.signals.oiBuild.toFixed(2)}%`} color={stock.signals.oiBuild > 0 ? "text-pro-green" : "text-pro-red"} />
                                <IndicatorBadge label="Beta/Vol (ATR)" value={stock.indicators.atr[stock.indicators.atr.length-1].toFixed(2)} />
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-pro-border p-6 rounded-3xl shadow-sm">
                        <h3 className="text-[10px] font-black text-pro-primary uppercase mb-6 tracking-widest border-b border-pro-border pb-3">Fibonacci Retracement (30D)</h3>
                        {data.fibonacciLevels ? (
                          <div className="space-y-3 text-[11px] font-mono">
                              <FibRow label="Resistance (1.0)" value={data.fibonacciLevels.level100} />
                              <FibRow label="Deep (0.618)" value={data.fibonacciLevels.level618} />
                              <FibRow label="Golden (0.5)" value={data.fibonacciLevels.level50} highlighted />
                              <FibRow label="Pivot (0.382)" value={data.fibonacciLevels.level382} />
                              <FibRow label="Base (0)" value={data.fibonacciLevels.level0} />
                          </div>
                        ) : (
                          <div className="py-4 text-center text-[10px] text-pro-muted uppercase font-bold italic opacity-40">Calculating levels...</div>
                        )}
                    </div>
                </div>

                {/* AI Reasoning & Narrative Column */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <HighlightCard label="Market Bias" value={data.sentiment} color={getSentimentColor(data.sentiment)} />
                        <HighlightCard label="Breakout Conviction" value={`${data.breakoutPotential}%`} />
                        <HighlightCard label="Pattern Matrix" value={data.candlestickPattern} isSmall />
                    </div>

                    <div className="bg-slate-50 border-l-8 border-pro-primary p-10 rounded-3xl relative overflow-hidden shadow-soft">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-8xl font-black text-pro-primary pointer-events-none tracking-tighter">ALPHA</div>
                        <h3 className="text-xs font-black text-pro-primary uppercase mb-6 tracking-[0.2em] flex items-center">
                            <BrainCircuitIcon className="w-5 h-5 mr-3" /> Neural Strategy Thesis
                        </h3>
                        <p className="text-lg text-pro-text font-bold leading-relaxed border-l-4 border-pro-border/40 pl-8 uppercase">
                            "{data.alphaReasoning}"
                        </p>
                    </div>

                    <div className="bg-white border border-pro-border p-8 rounded-3xl shadow-sm relative">
                        <h3 className="text-[10px] font-black text-pro-primary uppercase mb-4 tracking-widest">Macro & News Synthesis</h3>
                        <p className="text-[13px] text-pro-muted font-medium leading-relaxed uppercase pb-6 mb-6 italic border-b border-pro-border/50">
                            {data.newsSummary}
                        </p>
                        <div className="flex items-center space-x-3 text-[9px] text-pro-muted font-black tracking-widest">
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>Verified Exchange Intelligence Feed</span>
                        </div>
                    </div>
                </div>

            </div>
          ) : (
            <div className="text-center py-32 text-pro-muted font-black uppercase tracking-widest opacity-40 italic">Link interrupted. Re-establish terminal connection.</div>
          )}
        </div>

        <footer className="bg-pro-surface border-t border-pro-border px-10 py-5 text-[10px] text-pro-muted flex justify-between items-center shrink-0">
            <span className="uppercase font-black tracking-widest opacity-60">Protocol: Omni-Channel Alpha Reconnaissance // 2025</span>
            <span className="text-pro-primary font-black uppercase tracking-widest">Engine: Gemini_3_Pro_Flash_Synapse</span>
        </footer>
      </div>
    </div>
  );
};

const HighlightCard = ({ label, value, color = "text-pro-text", isSmall = false }: { label: string, value: string, color?: string, isSmall?: boolean }) => (
    <div className="bg-pro-surface border border-pro-border p-6 rounded-3xl text-center shadow-sm hover:border-pro-primary/20 transition-all">
        <span className="text-[9px] text-pro-muted uppercase font-black block mb-2 tracking-widest">{label}</span>
        <span className={`font-black uppercase tracking-tight block ${isSmall ? 'text-xs' : 'text-2xl'} ${color}`}>{value}</span>
    </div>
);

const FibRow = ({ label, value, highlighted = false }: { label: string, value: number, highlighted?: boolean }) => (
    <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${highlighted ? 'bg-pro-primary/10 border border-pro-primary/20' : 'border border-transparent'}`}>
        <span className={`uppercase text-[9px] font-black ${highlighted ? 'text-pro-primary' : 'text-pro-muted'}`}>{label}</span>
        <span className={`font-black ${highlighted ? 'text-pro-primary' : 'text-pro-text'}`}>₹{value.toFixed(2)}</span>
    </div>
);

export default AnalysisModal;