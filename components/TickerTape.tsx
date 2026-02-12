import React from 'react';
import type { ProcessedStock } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';

interface TickerTapeProps {
  stocks: ProcessedStock[];
}

const TickerTape: React.FC<TickerTapeProps> = ({ stocks }) => {
  if (stocks.length === 0) return null;

  // Duplicate list to ensure smooth infinite scroll
  const displayStocks = [...stocks, ...stocks];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-pro-card border-t border-pro-border z-[60] flex items-center overflow-hidden font-sans text-xs select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <div className="flex items-center animate-marquee whitespace-nowrap">
        {displayStocks.map((stock, idx) => {
           const prevClose = stock.data.historical[stock.data.historical.length - 2]?.close || stock.data.currentPrice;
           const change = stock.data.currentPrice - prevClose;
           const percentChange = (change / prevClose) * 100;
           const isUp = change >= 0;
           const color = isUp ? 'text-pro-green' : 'text-pro-red';
           const Icon = isUp ? ArrowUpIcon : ArrowDownIcon;

           return (
             <div key={`${stock.ticker}-${idx}`} className="flex items-center mx-6 space-x-3">
                <span className="font-bold text-pro-text">{stock.ticker}</span>
                <span className="text-pro-muted font-mono">{stock.data.currentPrice.toFixed(2)}</span>
                <div className={`flex items-center font-bold ${color}`}>
                    <Icon className="w-3 h-3 mr-1" />
                    <span>{Math.abs(percentChange).toFixed(2)}%</span>
                </div>
                <span className="w-px h-4 bg-pro-border mx-2"></span>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default TickerTape;