

import React, { useEffect, useRef } from 'react';
import type { PortfolioBacktestResult } from '../types';
import { XIcon } from './Icons';
import { createChart, ColorType } from 'lightweight-charts';

interface BacktestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PortfolioBacktestResult | null;
}

export const StatCard: React.FC<{ label: string, value: string, color?: string }> = ({ label, value, color = 'text-white' }) => (
    <div className="bg-gray-700/50 p-3 rounded-lg text-center">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-lg font-semibold ${color}`}>{value}</p>
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
            background: { type: ColorType.Solid, color: '#111827' }, // gray-900
            textColor: '#d1d5db',
        },
        grid: {
            vertLines: { color: '#374151' },
            horzLines: { color: '#374151' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 250,
        timeScale: {
            borderColor: '#4b5563',
        },
        rightPriceScale: {
            borderColor: '#4b5563',
        },
    });

    const areaSeries = chart.addAreaSeries({
        lineColor: '#00ff00',
        topColor: 'rgba(0, 255, 0, 0.4)',
        bottomColor: 'rgba(0, 255, 0, 0)',
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
  
  const returnColor = result.totalReturn > 0 ? 'text-emerald-400' : 'text-red-400';
  const returnSign = result.totalReturn > 0 ? '+' : '';
  const profit = result.finalCapital - result.initialCapital;
  const profitColor = profit > 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 font-mono"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl border border-gray-700 transform transition-all flex flex-col"
        style={{maxHeight: '95vh'}}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">Portfolio Simulation Details</h2>
            <p className="text-sm text-gray-400">{result.strategy} ({result.period})</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors">
            <XIcon className="w-5 h-5 text-gray-400" />
          </button>
        </header>
        
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 flex-shrink-0 border-b border-gray-700">
            <StatCard label="Initial Capital" value={currencyFormatter.format(result.initialCapital)} />
            <StatCard label="Final Capital" value={currencyFormatter.format(result.finalCapital)} />
            <StatCard label="Profit / Loss" value={currencyFormatter.format(profit)} color={profitColor} />
            <StatCard label="Total Return" value={`${returnSign}${result.totalReturn.toFixed(2)}%`} color={returnColor} />
            <StatCard label="CAGR" value={`${result.cagr.toFixed(2)}%`} color="text-cyan-400" />
            <StatCard label="Max Drawdown" value={`-${result.maxDrawdown.toFixed(2)}%`} color="text-red-400" />
            <StatCard label="Total Trades" value={`${result.totalTrades}`} />
            <StatCard label="Win Rate" value={`${result.winRate.toFixed(1)}%`} />
        </div>

        {/* Equity Curve Chart Section */}
        <div className="w-full h-64 p-4 border-b border-gray-700 bg-gray-900">
             <div className="text-xs text-gray-400 mb-2 uppercase font-bold">Equity Curve</div>
             <div ref={chartContainerRef} className="w-full h-full" />
        </div>

        <main className="overflow-y-auto px-4 pb-4 mt-2">
          <div className="text-xs text-gray-400 mb-2 uppercase font-bold">Trade Ledger</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-700/50 sticky top-0">
                    <tr>
                        <th className="p-2 text-left font-semibold text-gray-300">Ticker</th>
                        <th className="p-2 text-left font-semibold text-gray-300">Entry Date</th>
                        <th className="p-2 text-right font-semibold text-gray-300">Entry Price</th>
                        <th className="p-2 text-right font-semibold text-gray-300">Shares</th>
                        <th className="p-2 text-left font-semibold text-gray-300">Exit Date</th>
                        <th className="p-2 text-right font-semibold text-gray-300">Exit Price</th>
                        <th className="p-2 text-right font-semibold text-gray-300">Trade RoI</th>
                        <th className="p-2 text-right font-semibold text-gray-300">P/L (₹)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {result.trades.map((trade, index) => {
                        const tradeRoIColor = trade.tradeRoI > 0 ? 'text-emerald-400' : 'text-red-400';
                        const tradeRoISign = trade.tradeRoI > 0 ? '+' : '';

                        const pnlColor = trade.pnl > 0 ? 'text-emerald-400' : 'text-red-400';
                        
                        return (
                            <tr key={index} className="hover:bg-gray-700/30">
                                <td className="p-2 whitespace-nowrap font-bold text-cyan-400">{trade.ticker}</td>
                                <td className="p-2 whitespace-nowrap">{trade.entryDate}</td>
                                <td className="p-2 whitespace-nowrap text-right">₹{trade.entryPrice.toFixed(2)}</td>
                                <td className="p-2 whitespace-nowrap text-right">{trade.shares.toLocaleString()}</td>
                                <td className="p-2 whitespace-nowrap">{trade.exitDate}</td>
                                <td className="p-2 whitespace-nowrap text-right">₹{trade.exitPrice.toFixed(2)}</td>
                                <td className={`p-2 whitespace-nowrap text-right font-medium ${tradeRoIColor}`}>{`${tradeRoISign}${trade.tradeRoI.toFixed(2)}%`}</td>
                                <td className={`p-2 whitespace-nowrap text-right font-medium ${pnlColor}`}>{pnlFormatter.format(trade.pnl)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BacktestDetailsModal;