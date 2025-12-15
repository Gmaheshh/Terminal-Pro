import React, { useState, useMemo } from 'react';
import type { Column, PortfolioBacktestResult } from '../types';
import { ArrowDownIcon, ArrowUpIcon } from './Icons';

interface PortfolioSimulationDashboardProps {
  columns: Column<PortfolioBacktestResult>[];
  data: PortfolioBacktestResult[];
}

export const PortfolioSimulationDashboard: React.FC<PortfolioSimulationDashboardProps> = ({ columns, data }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'ascending' | 'descending' }>({
    key: 'Total Return',
    direction: 'descending',
  });

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const getSortValue = (result: PortfolioBacktestResult, key: string) => {
          switch (key) {
            case 'Strategy': return result.strategy;
            case 'Period': 
              const periodOrder = { '1Y': 1, '3Y': 2, '5Y': 3, '10Y': 4 };
              return periodOrder[result.period] || 0;
            case 'Final': return result.finalCapital;
            case 'Return': return result.totalReturn;
            case 'Trades': return result.totalTrades;
            case 'Win %': return result.winRate;
            default: return 0;
          }
        };

        const aValue = getSortValue(a, sortConfig.key);
        const bValue = getSortValue(b, sortConfig.key);

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
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
    if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="w-3 h-3 ml-1 text-bb-orange" />;
    return <ArrowDownIcon className="w-3 h-3 ml-1 text-bb-orange" />;
  }

  return (
    <div className="w-full font-mono">
      <div className="p-4 text-bb-text text-xs bg-bb-panel border-b border-bb-border">
        <h3 className="font-bold text-bb-orange mb-2 uppercase">>> SIMULATION PROTOCOL RESULTS</h3>
        <p className="max-w-4xl leading-relaxed text-bb-muted">
            Executing 3 distinct trading algorithms over variable historical periods. Initial Seed: 100k INR. 
            Risk Model: Fixed Fractional (2% Equity). Max Drawdown Limit: N/A. Position Cap: 25%.
        </p>
      </div>
      <table className="w-full border-collapse">
        <thead className="bg-bb-dark">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-2 text-left text-xs font-bold text-bb-orange uppercase tracking-wider border-b border-bb-orange border-r border-bb-border last:border-r-0"
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
            <tr key={`${item.strategy}-${item.period}-${rowIndex}`} className="hover:bg-bb-panel transition-colors">
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-4 py-2 whitespace-nowrap text-xs text-bb-text border-r border-bb-border last:border-r-0">
                  {typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : (item as any)[column.accessor]}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-10 text-bb-muted uppercase">
                // AWAITING DATA STREAM //
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};