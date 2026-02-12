
import React from 'react';
import type { DerivativeStrategy, TechnicalTrade } from '../types';

interface PayoffVisualizerProps {
  strategies: DerivativeStrategy[];
  onCloseStrategy?: (index: number) => void;
  technicalTrades?: TechnicalTrade[];
  onCloseTechnical?: (index: number) => void;
}

const PayoffChart: React.FC<{ points: {price: number, pnl: number}[], currentPrice: number }> = ({ points, currentPrice }) => {
    if (!points || points.length === 0) return <div className="h-full flex items-center justify-center text-pro-muted text-[10px]">PAYOFF DATA N/A</div>;

    const width = 800;
    const height = 300;
    const padding = 40;

    const minPrice = Math.min(...points.map(p => p.price));
    const maxPrice = Math.max(...points.map(p => p.price));
    const minPnl = Math.min(...points.map(p => p.pnl), -100);
    const maxPnl = Math.max(...points.map(p => p.pnl), 100);

    const getX = (price: number) => padding + ((price - minPrice) / (maxPrice - minPrice)) * (width - 2 * padding);
    const getY = (pnl: number) => height - padding - ((pnl - minPnl) / (maxPnl - minPnl)) * (height - 2 * padding);

    const zeroY = getY(0);
    const currentX = getX(currentPrice);

    const sortedPoints = [...points].sort((a, b) => a.price - b.price);
    const pathData = sortedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.price)} ${getY(p.pnl)}`).join(' ');

    return (
        <div className="w-full h-full bg-white relative overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full font-sans">
                {/* Horizontal Zero Line */}
                <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4" />
                {/* Vertical Spot Line */}
                <line x1={currentX} y1={padding} x2={currentX} y2={height - padding} stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="2" opacity="0.3" />
                
                {/* Payoff Curve */}
                <path d={pathData} fill="none" stroke="#4F46E5" strokeWidth="3" strokeLinejoin="round" />
                
                {/* Current Spot Label */}
                <circle cx={currentX} cy={zeroY} r="4" fill="#4F46E5" />
                <text x={currentX} y={padding - 10} fill="#4F46E5" fontSize="10" textAnchor="middle" fontWeight="900" className="uppercase tracking-widest">Live Spot: {currentPrice.toFixed(0)}</text>
                
                <text x={padding - 30} y={zeroY + 4} fill="#94A3B8" fontSize="8" fontWeight="bold">PNL:0</text>
            </svg>
        </div>
    );
};

const PayoffVisualizer: React.FC<PayoffVisualizerProps> = ({ 
  strategies, 
  onCloseStrategy,
  technicalTrades = [],
  onCloseTechnical 
}) => {
  const hasPositions = strategies.length > 0 || technicalTrades.length > 0;

  return (
    <div className="p-8 font-sans h-full overflow-y-auto bg-pro-bg space-y-10 custom-scrollbar">
      <header className="border-b border-pro-border pb-8">
        <h2 className="text-3xl font-black text-pro-text uppercase tracking-tight">Active Payoff Monitor</h2>
        <p className="text-pro-muted text-[10px] font-bold mt-1 uppercase tracking-[0.2em]">Real-Time Greeks & Multi-Leg PnL Trajectories</p>
      </header>

      {!hasPositions ? (
        <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-pro-border bg-white rounded-[3rem] opacity-40">
          <p className="text-pro-muted text-xs font-black uppercase tracking-[0.3em] text-center px-4 leading-relaxed">
            // No Active Derivatives Detected //<br/>
            Initialize via 'Derivatives Desk'
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {strategies.map((strat, idx) => (
            <div key={`${strat.ticker}-${idx}`} className="bg-white border border-pro-border rounded-[3rem] shadow-heavy overflow-hidden animate-fade-in relative group">
              <button 
                  onClick={() => onCloseStrategy?.(idx)}
                  className="absolute top-6 right-6 p-2 text-pro-muted hover:text-pro-red transition-all active:scale-90"
                  title="Close Position"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <div className="p-10 flex flex-col lg:flex-row gap-12">
                {/* Info Panel */}
                <div className="lg:w-1/3 space-y-8">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                         <span className="text-[10px] font-black text-pro-primary bg-pro-primary/5 px-2 py-0.5 rounded uppercase">{strat.ticker}</span>
                         <span className="text-[10px] font-black text-pro-accent bg-pro-accent/5 px-2 py-0.5 rounded uppercase">Conf: {strat.confidence}%</span>
                    </div>
                    <h2 className="text-3xl font-black text-pro-text uppercase tracking-tighter leading-none">{strat.name}</h2>
                    <p className="mt-4 text-[13px] text-pro-muted font-medium leading-relaxed uppercase opacity-80 italic">"{strat.explanation}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <MiniStat label="Net Potential" value={`₹${strat.maxProfit.toLocaleString()}`} color="text-pro-green" />
                    <MiniStat label="Downside Cap" value={strat.maxLoss < 0 ? 'UNLIMITED' : `₹${strat.maxLoss.toLocaleString()}`} color="text-pro-red" />
                    <MiniStat label="Taxes/Fixed" value={`₹${strat.fixedCost.toLocaleString()}`} />
                    <MiniStat label="Comm/Var" value={`₹${strat.variableCost.toLocaleString()}`} />
                  </div>

                  <div className="space-y-2 border-t border-pro-border pt-6">
                    <h4 className="text-[10px] text-pro-muted uppercase font-black tracking-widest mb-2">Live Greeks Matrix</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        <GreekRow label="Delta" val={strat.greeks.delta} />
                        <GreekRow label="Theta" val={strat.greeks.theta} />
                        <GreekRow label="Vega" val={strat.greeks.vega} />
                        <GreekRow label="Gamma" val={strat.greeks.gamma} />
                    </div>
                  </div>
                </div>

                {/* Chart Panel */}
                <div className="flex-1 space-y-6">
                  <div className="h-[300px] bg-pro-surface rounded-3xl border border-pro-border overflow-hidden p-2">
                    <PayoffChart points={strat.payoffPoints} currentPrice={strat.executionPrice} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {strat.tradeStructure.map((leg, i) => (
                        <div key={i} className="px-4 py-2 bg-pro-surface border border-pro-border rounded-xl text-[10px] font-black uppercase text-pro-muted flex items-center">
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${leg.action === 'BUY' ? 'bg-pro-primary' : 'bg-pro-accent'}`}></span>
                            {leg.action} {leg.strike} {leg.type} @ ₹{leg.premium}
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Render Technical Trades */}
          {technicalTrades.map((trade, idx) => (
            <div key={`${trade.ticker}-tech-${idx}`} className="bg-white border border-pro-border p-10 rounded-[3rem] shadow-heavy flex flex-col md:flex-row gap-10 items-center justify-between">
                <div>
                    <h3 className="text-[10px] font-black text-pro-muted uppercase tracking-widest mb-1">Direct Technical Entry</h3>
                    <h2 className="text-3xl font-black text-pro-text uppercase tracking-tight">{trade.direction} {trade.ticker}</h2>
                </div>
                <div className="flex space-x-12">
                    <MiniStat label="Entry" value={trade.entryPrice.toFixed(2)} />
                    <MiniStat label="Current" value={trade.currentPrice.toFixed(2)} color="text-pro-primary" />
                    <MiniStat label="Stop Loss" value={trade.stopLoss.toFixed(2)} color="text-pro-red" />
                    <MiniStat label="Target" value={trade.target.toFixed(2)} color="text-pro-green" />
                </div>
                <button 
                  onClick={() => onCloseTechnical?.(idx)}
                  className="bg-pro-bg hover:bg-pro-red/10 text-pro-muted hover:text-pro-red p-4 rounded-2xl transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MiniStat = ({ label, value, color = "text-pro-text" }: { label: string, value: string, color?: string }) => (
    <div>
        <span className="text-[8px] font-black text-pro-muted uppercase block mb-0.5">{label}</span>
        <span className={`text-sm font-black ${color}`}>{value}</span>
    </div>
);

const GreekRow = ({ label, val }: { label: string, val: number }) => (
    <div className="flex justify-between border-b border-pro-border/40 pb-1">
        <span className="text-[9px] font-bold text-pro-muted uppercase">{label}</span>
        <span className="text-[10px] font-black text-pro-text">{val.toFixed(4)}</span>
    </div>
);

export default PayoffVisualizer;
