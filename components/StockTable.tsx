import React, { useState, useMemo } from 'react';
import type { Column, ProcessedStock } from '../types';
import { ArrowDownIcon, ArrowUpIcon, InfoIcon } from './Icons';

interface StockTableProps {
  columns: Column<ProcessedStock>[];
  data: ProcessedStock[];
  activeTab: string;
  onHover?: (stock: ProcessedStock | null, x: number, y: number) => void;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="relative group/tip inline-block ml-1.5">
        <InfoIcon className="w-3.5 h-3.5 text-pro-muted/40 cursor-help hover:text-pro-primary transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-pro-text text-white text-[11px] font-medium leading-relaxed shadow-heavy opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-all duration-300 z-[100] rounded-2xl text-center">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-pro-text"></div>
        </div>
    </div>
);

const StockTable: React.FC<StockTableProps> = ({ columns, data, activeTab, onHover }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'ascending' | 'descending' }>({
    key: null,
    direction: 'ascending',
  });

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const getSortValue = (stock: ProcessedStock, key: string): string | number => {
          switch (key) {
            case 'Ticker': return stock.ticker;
            case 'Price':
            case 'Entry Price': return stock.data.currentPrice;
            case 'SL': return stock.signals.vwlmStopLoss || stock.signals.stopLoss || 0;
            case 'TP': return stock.signals.vwlmTarget || stock.signals.target || 0;
            case 'RVOL': return stock.indicators.rvol[stock.indicators.rvol.length - 1] || 0;
            case 'ADX': return stock.indicators.adx[stock.indicators.adx.length - 1] || 0;
            case 'OI Build': return stock.signals.oiBuild;
            case 'Signal Date': return stock.signals.volumeSpikeSignalDate || stock.signals.vwlmBuySignalDate || '';
            default: return 0;
          }
        };

        const aValue = getSortValue(a, sortConfig.key);
        const bValue = getSortValue(b, sortConfig.key);

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
           if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
           if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="w-3.5 h-3.5 ml-1 text-pro-primary" /> : <ArrowDownIcon className="w-3.5 h-3.5 ml-1 text-pro-primary" />;
  }

  const handleMouseMove = (e: React.MouseEvent, item: ProcessedStock) => {
      if (onHover) onHover(item, e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
      if (onHover) onHover(null, 0, 0);
  };

  return (
    <div className="w-full flex-1 overflow-auto custom-scrollbar">
      <table className="w-full border-collapse">
        <thead className="bg-white sticky top-0 z-20">
          <tr className="border-b border-pro-border">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-8 py-5 text-left text-[11px] font-bold text-pro-muted uppercase tracking-[0.1em] whitespace-nowrap"
              >
                <div className="flex items-center">
                  {column.sortable ? (
                    <button onClick={() => requestSort(column.header)} className="flex items-center hover:text-pro-primary transition-colors focus:outline-none">
                      {column.header}
                      {getSortIcon(column.header)}
                    </button>
                  ) : (
                    <span>{column.header}</span>
                  )}
                  {column.tooltip && <Tooltip text={column.tooltip} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-pro-border/40">
          {sortedData.length > 0 ? sortedData.map((item, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="hover:bg-pro-bg/50 transition-all duration-200 cursor-pointer"
              onMouseMove={(e) => handleMouseMove(e, item)}
              onMouseLeave={handleMouseLeave}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-8 py-5 whitespace-nowrap text-[13px] font-medium text-pro-text">
                  {typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : (item as any)[column.accessor]}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-32 text-pro-muted font-medium text-[13px] italic opacity-50">
                Synchronizing market streams...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;