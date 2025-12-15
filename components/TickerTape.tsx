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
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-bb-dark border-t border-bb-orange z-[60] flex items-center overflow-hidden font-mono text-xs select-none">
      <div className="flex items-center animate-marquee whitespace-nowrap">
        {displayStocks.map((stock, idx) => {
           const prevClose = stock.data.historical[stock.data.historical.length - 2]?.close || stock.data.currentPrice;
           const change = stock.data.currentPrice - prevClose;
           const percentChange = (change / prevClose) * 100;
           const isUp = change >= 0;
           const color = isUp ? 'text-bb-green' : 'text-bb-red';
           const Icon = isUp ? ArrowUpIcon : ArrowDownIcon;

           return (
             <div key={`${stock.ticker}-${idx}`} className="flex items-center mx-4 space-x-2 border-r border-bb-border pr-4">
                <span className="font-bold text-bb-blue">{stock.ticker}</span>
                <span className="text-white">{stock.data.currentPrice.toFixed(2)}</span>
                <div className={`flex items-center ${color}`}>
                    <Icon className="w-3 h-3 mr-1" />
                    <span>{Math.abs(percentChange).toFixed(2)}%</span>
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default TickerTape;