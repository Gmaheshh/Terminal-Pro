
import React from 'react';
import type { DerivativeStrategy, PayoffPoint, TechnicalTrade } from '../types';

interface PayoffVisualizerProps {
  strategies: DerivativeStrategy[];
  // Fix: Add missing properties passed from App.tsx
  onCloseStrategy?: (index: number) => void;
  technicalTrades?: TechnicalTrade[];
  onCloseTechnical?: (index: number) => void;
}

const PayoffChart: React.FC<{ points: PayoffPoint[], currentPrice: number }> = ({ points, currentPrice }) => {
    if (!points || points.length === 0) return <div className="h-full flex items-center justify-center text-bb-muted text-[10px]">PAYOFF DATA N/A</div>;

    const width = 600;
    const height = 240;
    const padding = 30;

    const minPrice = Math.min(...points.map(p => p.price));
    const maxPrice = Math.max(...points.map(p => p.price));
    const minPnl = Math.min(...points.map(p => p.pnl), -100);
    const maxPnl = Math.max(...points.map(p => p.pnl), 100);

    const getX = (price: number) => padding + ((price - minPrice) / (maxPrice - minPrice)) * (width - 2 * padding);
    const getY = (pnl: number) => height - padding - ((pnl - minPnl) / (maxPnl - minPnl)) * (height - 2 * padding);

    const zeroY = getY(0);
    const currentX = getX(currentPrice);

    const pathData = points
        .sort((a, b) => a.price - b.price)
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.price)} ${getY(p.pnl)}`)
        .join(' ');

    return (
        <div className="w-full h-full bg-bb-black border border-bb-border relative overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full font-mono">
                {/* Grid Lines */}
                <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#333" strokeWidth="1" strokeDasharray="4" />
                <line x1={currentX} y1={padding} x2={currentX} y2={height - padding} stroke="#ff9900" strokeWidth="1" strokeDasharray="2" opacity="0.3" />
                
                {/* Payoff Curve */}
                <path d={pathData} fill="none" stroke="#00ccff" strokeWidth="2.5" />
                
                {/* Labels */}
                <text x={currentX} y={padding - 5} fill="#ff9900" fontSize="10" textAnchor="middle" fontWeight="bold">SPOT: {currentPrice.toFixed(0)}</text>
                <text x={padding - 20} y={zeroY + 3} fill="#555" fontSize="8">PNL:0</text>
                
                <text x={padding} y={height - 5} fill="#777" fontSize="8" textAnchor="start">PRICE: {minPrice.toFixed(0)}</text>
                <text x={width - padding} y={height - 5} fill="#777" fontSize="8" textAnchor="end">PRICE: {maxPrice.toFixed(0)}</text>
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
    <div className="p-4 font-mono h-full overflow-y-auto bg-bb-black space-y-8">
      <header className="border-b border-bb-orange pb-4">
        <h2 className="text-2xl font-bold text-bb-orange uppercase tracking-wider">>> PAYOFF_VISUALIZER_v1.0</h2>
        <p className="text-bb-muted text-[10px] mt-1 uppercase">Active Derivative Positions & Live PnL Trajectories</p>
      </header>

      {!hasPositions ? (
        <div className="flex flex-col items-center justify-center py-32 border border-dashed border-bb-border bg-bb-panel/20">
          <p className="text-bb-muted text-sm uppercase tracking-widest text-center px-4">
            // NO ACTIVE POSITIONS IN MONITORING QUEUE //<br/>
            GO TO 'DERIVATIVES DESK' TO EXECUTE A SPREAD.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {/* Render Options Strategies */}
          {strategies.map((strat, idx) => (
            <div key={`${strat.ticker}-opt-${idx}`} className="bg-bb-panel border border-bb-border p-6 shadow-2xl relative">
              <div className="absolute top-0 right-0 flex items-center">
                <button 
                  onClick={() => onCloseStrategy?.(idx)}
                  className="bg-bb-red/20 text-bb-red hover:bg-bb-red hover:text-black px-2 py-1 font-bold text-[10px] transition-colors border-l border-b border-bb-red"
                >
                  [ CLOSE POSITION ]
                </button>
                <div className="px-4 py-1 bg-bb-orange text-bb-black font-bold text-[10px]">
                  EXECUTED @ {strat.timestamp}
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-8 mt-4 lg:mt-0">
                {/* Strategy Header & Stats */}
                <div className="lg:w-1/3 space-y-6">
                  <div>
                    <h3 className="text-bb-blue font-bold text-xs uppercase mb-1">{strat.ticker} Analysis</h3>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-tighter mb-2">{strat.name}</h2>
                    <div className="flex space-x-2">
                        <span className="px-2 py-0.5 bg-bb-dark border border-bb-border text-[9px] text-bb-green font-bold">BIAS: {strat.bias.toUpperCase()}</span>
                        <span className="px-2 py-0.5 bg-bb-dark border border-bb-border text-[9px] text-bb-orange font-bold">CONF: {strat.confidence.score}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <MetricCard label="Max Profit" value={strat.maxProfit} color="text-bb-green" />
                    <MetricCard label="Max Loss" value={strat.maxLoss} color="text-bb-red" />
                    <MetricCard label="Risk Reward" value={strat.rrRatio} color="text-white" />
                    <MetricCard label="Entry Spot" value={strat.executionPrice.toFixed(2)} color="text-bb-blue" />
                  </div>

                  <div className="space-y-2 border-t border-bb-border pt-4">
                    <h4 className="text-[10px] text-bb-muted uppercase font-bold tracking-widest mb-2">Δ Live Greeks</h4>
                    <div className="flex justify-between text-xs">
                        <span className="text-bb-muted">Delta:</span>
                        <span className="text-white">{strat.greeks.delta}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-bb-muted">Theta:</span>
                        <span className="text-white">{strat.greeks.theta}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-bb-muted">Vega:</span>
                        <span className="text-white">{strat.greeks.vega}</span>
                    </div>
                  </div>
                </div>

                {/* Payoff Chart */}
                <div className="flex-1 min-h-[300px] flex flex-col">
                  <h4 className="text-[10px] text-bb-orange uppercase font-bold mb-3">Payoff Profile @ Expiry</h4>
                  <div className="flex-1">
                    <PayoffChart points={strat.payoffPoints} currentPrice={strat.executionPrice} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {strat.tradeStructure.map((leg, i) => (
                        <span key={i} className="text-[9px] px-2 py-1 bg-bb-dark border border-bb-blue/30 text-bb-text uppercase">
                            {leg.action} {leg.strike} {leg.type} @ ₹{leg.premium}
                        </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Render Technical Trades */}
          {technicalTrades.map((trade, idx) => (
            <div key={`${trade.ticker}-tech-${idx}`} className="bg-bb-panel border border-bb-border p-6 shadow-2xl relative">
              <div className="absolute top-0 right-0 flex items-center">
                <button 
                  onClick={() => onCloseTechnical?.(idx)}
                  className="bg-bb-red/20 text-bb-red hover:bg-bb-red hover:text-black px-2 py-1 font-bold text-[10px] transition-colors border-l border-b border-bb-red"
                >
                  [ CLOSE TRADE ]
                </button>
                <div className="px-4 py-1 bg-bb-blue text-bb-black font-bold text-[10px]">
                  EXECUTED @ {trade.timestamp}
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-8 mt-4 lg:mt-0">
                <div className="lg:w-1/3 space-y-6">
                  <div>
                    <h3 className="text-bb-blue font-bold text-xs uppercase mb-1">{trade.ticker} Technical</h3>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-tighter mb-2">{trade.direction} Trade</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <MetricCard label="Entry Price" value={trade.entryPrice.toFixed(2)} color="text-bb-blue" />
                    <MetricCard label="Current Price" value={trade.currentPrice.toFixed(2)} color="text-white" />
                    <MetricCard label="Stop Loss" value={trade.stopLoss.toFixed(2)} color="text-bb-red" />
                    <MetricCard label="Target" value={trade.target.toFixed(2)} color="text-bb-green" />
                  </div>
                </div>
                <div className="flex-1 min-h-[150px] bg-bb-black/40 border border-bb-border flex items-center justify-center">
                   <p className="text-[10px] text-bb-muted uppercase tracking-widest font-bold">Live Technical Tracking Active</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
    <div className="bg-bb-dark border border-bb-border p-3">
        <span className="text-[8px] text-bb-muted uppercase block mb-1">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
);

export default PayoffVisualizer;
