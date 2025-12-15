import React, { useState, useMemo } from 'react';
import type { Column, ProcessedStock } from '../types';
import { ArrowDownIcon, ArrowUpIcon } from './Icons';

interface StockTableProps {
  columns: Column<ProcessedStock>[];
  data: ProcessedStock[];
  activeTab: string;
  onHover?: (stock: ProcessedStock | null) => void;
}

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
            case 'ATR': return stock.indicators.atr[stock.indicators.atr.length - 1] || 0;
            case 'RVOL': return stock.indicators.rvol[stock.indicators.rvol.length - 1] || 0;
            case 'Volatility %': return stock.indicators.volatilityPct[stock.indicators.volatilityPct.length - 1] || 0;
            case 'ADX': return stock.indicators.adx[stock.indicators.adx.length - 1] || 0;
            case 'RSI': return stock.indicators.rsi[stock.indicators.rsi.length - 1] || 0;
            case 'Signal Strength (Xt)': return stock.signals.vwlmStrength || 0;
            case 'Shares': return stock.signals.suggestedShares || 0;
            case 'Spike Date': return stock.signals.volumeSpikeSignalDate;
            case 'Crossover Date': return stock.signals.shortTermCrossBuySignalDate || stock.signals.shortTermCrossSellSignalDate || '';
            case 'Signal Date': return stock.signals.vwlmBuySignalDate || stock.signals.vwlmSellSignalDate || '';
            case 'SMA 20': return stock.indicators.sma20[stock.indicators.sma20.length - 1] || 0;
            case 'SMA 50': return stock.indicators.sma50[stock.indicators.sma50.length - 1] || 0;
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
  
  const getSortIcon = (key: string | number | symbol) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="w-3 h-3 ml-1 text-bb-orange" />;
    return <ArrowDownIcon className="w-3 h-3 ml-1 text-bb-orange" />;
  }

  const getRowClass = (item: ProcessedStock, activeTab: string): string => {
      // In terminal mode, we use text colors or small indicators mostly, but subtlest background tint can work
      return '';
  }

  return (
    <div className="w-full">
      <table className="w-full border-collapse">
        <thead className="bg-bb-dark sticky top-0 z-10 shadow-sm">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-2 text-left text-xs font-mono font-bold text-bb-orange uppercase tracking-wider border-b border-bb-orange border-r border-bb-border last:border-r-0"
              >
                {column.sortable ? (
                  <button onClick={() => requestSort(column.header)} className="flex items-center hover:text-white transition-colors focus:outline-none w-full">
                    {column.header}
                    {getSortIcon(column.header)}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-bb-black divide-y divide-bb-border">
          {sortedData.length > 0 ? sortedData.map((item, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={`${getRowClass(item, activeTab)} hover:bg-bb-panel transition-colors cursor-pointer group`}
              onMouseEnter={() => onHover && onHover(item)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-4 py-1.5 whitespace-nowrap text-xs font-mono text-bb-text border-r border-bb-border last:border-r-0 group-hover:text-white">
                  {typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : (item as any)[column.accessor]}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-10 text-bb-muted font-mono uppercase">
                // No Data Found //
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;