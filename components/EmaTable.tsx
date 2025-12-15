import React, { useState, useMemo } from 'react';
import type { Column, EmaSignalResult } from '../types';
import { ArrowDownIcon, ArrowUpIcon } from './Icons';

interface EmaTableProps {
  columns: Column<EmaSignalResult>[];
  data: EmaSignalResult[];
}

const EmaTable: React.FC<EmaTableProps> = ({ columns, data }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'ascending' | 'descending' }>({
    key: 'RSI', // Default sort
    direction: 'descending',
  });

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const getSortValue = (item: EmaSignalResult, key: string): string | number => {
          switch (key) {
            case 'Stock': return item.ticker;
            case 'Price': return item.price;
            case 'Signal': {
                const rankMap: Record<string, number> = { "BUY": 0, "SELL": 1, "HOLD": 2 };
                const aSignal = a.signal.split(" ")[0] as keyof typeof rankMap;
                const bSignal = b.signal.split(" ")[0] as keyof typeof rankMap;
                return rankMap[aSignal] || 2;
            }
            case 'EMA9': return item.ema9;
            case 'EMA13': return item.ema13;
            case 'MACD': return item.macd;
            case 'MACD Signal': return item.macdSignal;
            case 'RSI': return item.rsi;
            case 'ATR': return item.atr;
            case 'StochRSI': return item.stochRsi;
            default: return 0;
          }
        };

        const aValue = getSortValue(a, sortConfig.key);
        const bValue = getSortValue(b, sortConfig.key);
        
        if (sortConfig.key === 'Signal') {
             if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
             if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
             return 0;
        }

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
    if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="w-3 h-3 ml-1" />;
    return <ArrowDownIcon className="w-3 h-3 ml-1" />;
  }

  const getSignalRowStyle = (signal: EmaSignalResult['signal']) => {
    if (signal.startsWith('BUY')) return 'bg-emerald-500/10';
    if (signal.startsWith('SELL')) return 'bg-red-500/10';
    return '';
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            {columns.map((column, index) => (
              <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                {column.sortable ? (
                  <button onClick={() => requestSort(column.header)} className="flex items-center hover:text-white transition-colors focus:outline-none">
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
        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
          {sortedData.length > 0 ? sortedData.map((item, rowIndex) => (
            <tr key={rowIndex} className={`transition-colors ${getSignalRowStyle(item.signal)} hover:bg-gray-700/50`}>
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : (item as any)[column.accessor]}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-10 text-gray-500">
                No stocks match the criteria for this view.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmaTable;
