import React, { useEffect, useRef } from 'react';
import type { PortfolioBacktestResult } from '../types';
import { XIcon, InfoIcon } from './Icons';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';

interface BacktestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PortfolioBacktestResult | null;
}

export const StatCard: React.FC<{ label: string, value: string, color?: string, subValue?: string, tooltip?: string }> = ({ label, value, color = 'text-white', subValue, tooltip }) => (
    <div className="bg-bb-panel border border-bb-border p-3 text-center group relative">
        <div className="flex items-center justify-center space-x-1 mb-1">
            <p className="text-[10px] text-bb-muted uppercase">{label}</p>
            {tooltip && (
                <div className="relative group/tip">
                    <InfoIcon className="w-2.5 h-2.5 text-bb-muted/50 cursor-help hover:text-bb-orange transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-bb-orange text-bb-black text-[8px] font-bold uppercase leading-tight shadow-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-50">
                        {tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-bb-orange"></div>
                    </div>
                </div>
            )}
        </div>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        {subValue && <p className="text-[9px] text-bb-muted mt-1 uppercase">{subValue}</p>}
    </div>
);

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const pnlFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
});


const BacktestDetailsModal: React.FC<BacktestDetailsModalProps> = ({ isOpen, onClose, result }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !result || !chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
        layout: {
            background: { type: ColorType.Solid, color: '#000000' },
            textColor: '#d4d4d4',
        },
        grid: {
            vertLines: { color: '#1a1a1a' },
            horzLines: { color: '#1a1a1a' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 250,
        timeScale: {
            borderColor: '#333',
        },
        rightPriceScale: {
            borderColor: '#333',
        },
    });

    const themeColor = result.isBenchmark ? '#00ccff' : '#ff9900';
    const fillAlpha = result.isBenchmark ? 'rgba(0, 204, 255, 0.4)' : 'rgba(255, 153, 0, 0.4)';

    const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: themeColor,
        topColor: fillAlpha,
        bottomColor: 'transparent',
        lineWidth: 2,
    });

    if (result.equityCurve && result.equityCurve.length > 0) {
        const chartData = result.equityCurve.map(pt => ({ time: pt.time, value: pt.value }));
        areaSeries.setData(chartData);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
        if (chartContainerRef.current) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
    };

  }, [isOpen, result]);


  if (!isOpen || !result) return null;
  
  const returnColor = result.netReturn > 0 ? 'text-bb-green' : 'text-bb-red';
  const returnSign = result.netReturn > 0 ? '+' : '';
  const netProfit = result.netFinalCapital - result.initialCapital;
  const netProfitColor = netProfit > 0 ? 'text-bb-green' : 'text-bb-red';

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 font-mono"
      onClick={onClose}
    >
      <div
        className="bg-bb-black w-full max-w-6xl border-2 border-bb-orange shadow-[0_0_30px_rgba(255,153,0,0.3)] flex flex-col"
        style={{maxHeight: '90vh'}}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bg-bb-orange text-bb-black flex justify-between items-center px-4 py-2 font-bold flex-shrink-0">
          <div>
            <span className="uppercase tracking-widest text-xs">Sim_Report_v3.1 // </span>
            <span className="uppercase">{result.strategy} ({result.period})</span>
          </div>
          <button onClick={onClose} className="hover:bg-bb-black hover:text-bb-orange px-2 transition-colors">
            [CLOSE_X]
          </button>
        </header>
        
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 flex-shrink-0 border-b border-bb-border bg-bb-dark">
            <StatCard label="Initial Seed" value={currencyFormatter.format(result.initialCapital)} />
            <StatCard 
                label="Total Charges" 
                value={currencyFormatter.format(result.totalCharges)} 
                color="text-bb-red" 
                subValue="Inc. Slippage" 
                tooltip="Includes Brokerage, STT, Exchange Fees, and Price Slippage (Execution Gap)."
            />
            <StatCard label="Final Capital" value={currencyFormatter.format(result.netFinalCapital)} />
            <StatCard label="Net Profit" value={currencyFormatter.format(netProfit)} color={netProfitColor} />
            <StatCard label="Net Return" value={`${returnSign}${result.netReturn.toFixed(2)}%`} color={returnColor} />
            <StatCard label="Win Rate" value={`${result.winRate.toFixed(1)}%`} />
            <StatCard 
                label="Max Drawdown" 
                value={`-${result.maxDrawdown.toFixed(2)}%`} 
                color="text-bb-red" 
                tooltip="Maximum observed loss from a peak. Measures historical risk and volatility."
            />
        </div>

        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            {/* Chart Area */}
            <div className="lg:w-2/3 border-r border-bb-border bg-bb-black p-4 flex flex-col">
                <div className="text-[10px] text-bb-muted mb-2 uppercase font-bold tracking-tighter">{">>"} REAL-TIME EQUITY TRAJECTORY (POST-COSTS)</div>
                <div ref={chartContainerRef} className="flex-1 w-full" />
            </div>

            {/* Trade Ledger / Brokerage Breakdown */}
            <div className="lg:w-1/3 flex flex-col bg-bb-dark">
                <div className="p-4 border-b border-bb-border">
                    <h3 className="text-xs font-bold text-bb-orange uppercase mb-3">{">>"} COST DECONSTRUCTION</h3>
                    <div className="space-y-2 text-[11px] font-mono">
                        <div className="flex justify-between">
                            <span className="text-bb-muted">EST. BROKERAGE + STT:</span>
                            <span className="text-white">{currencyFormatter.format(result.totalCharges * 0.7)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-bb-muted">SLIPPAGE (0.1% ROUND):</span>
                            <span className="text-white">{currencyFormatter.format(result.totalCharges * 0.3)}</span>
                        </div>
                        <div className="pt-2 border-t border-bb-border flex justify-between font-bold">
                            <span className="text-bb-orange">TOTAL LEAKAGE:</span>
                            <span className="text-bb-red">{currencyFormatter.format(result.totalCharges)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <h3 className="text-xs font-bold text-bb-blue uppercase mb-3">{">>"} RECENT TRADE LOGS</h3>
                    <div className="space-y-3">
                        {result.trades.slice(-20).reverse().map((trade, idx) => (
                            <div key={idx} className="bg-bb-black border border-bb-border/50 p-2 text-[10px]">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-bb-blue">{trade.ticker}</span>
                                    <span className={trade.pnl > 0 ? 'text-bb-green' : 'text-bb-red'}>
                                        {trade.pnl > 0 ? '+' : ''}{currencyFormatter.format(trade.pnl)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-bb-muted">
                                    <span>OUT: {trade.exitDate}</span>
                                    <span>CHG: {currencyFormatter.format(trade.charges || 0)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <footer className="bg-bb-panel border-t border-bb-border px-4 py-2 text-[10px] text-bb-muted flex justify-between items-center">
            <span className="uppercase">NOTE: Calculations include brokerage (max ₹20/side), STT, and dynamic 0.1% slippage.</span>
            <span className="text-bb-orange font-bold uppercase tracking-widest animate-pulse">Alpha Kernel Sync Status: Nominal</span>
        </footer>
      </div>
    </div>
  );
};

export default BacktestDetailsModal;