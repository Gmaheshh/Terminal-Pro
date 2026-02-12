import React, { useState, useMemo } from 'react';
import type { Column, PortfolioBacktestResult } from '../types';
import { ArrowDownIcon, ArrowUpIcon, InfoIcon } from './Icons';

interface PortfolioSimulationDashboardProps {
  columns: Column<PortfolioBacktestResult>[];
  data: PortfolioBacktestResult[];
  capital: number;
  onCapitalChange: (val: number) => void;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="relative group/tip inline-block ml-1">
        <InfoIcon className="w-2.5 h-2.5 text-bb-muted/50 cursor-help hover:text-bb-orange transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-bb-orange text-bb-black text-[8px] font-bold uppercase leading-tight shadow-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-50">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-bb-orange"></div>
        </div>
    </div>
);

export const PortfolioSimulationDashboard: React.FC<PortfolioSimulationDashboardProps> = ({ columns, data, capital, onCapitalChange }) => {
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

  const getTooltipForHeader = (header: string) => {
    switch (header) {
        case 'Return': return "Total % profit or loss calculated over the simulation period.";
        case 'Win %': return "Percentage of successful trades vs total simulated entries.";
        case 'Final': return "Estimated account value at the end of simulation.";
        default: return null;
    }
  };

  return (
    <div className="w-full font-mono">
      <div className="p-4 text-bb-text text-xs bg-bb-panel border-b border-bb-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-bold text-bb-orange mb-1 uppercase">>> BACKTEST PROTOCOL RESULTS</h3>
          <p className="max-w-4xl leading-relaxed text-bb-muted">
              Executing algorithmic trading models vs. passive market benchmarks. 
              Goal: Outperform market alpha with risk-managed entries.
          </p>
        </div>
        
        <div className="flex flex-col items-end">
          <label className="text-[9px] font-bold text-bb-muted uppercase mb-1">Simulated Capital (INR)</label>
          <div className="flex items-center space-x-2">
            {[100000, 500000, 1000000].map(val => (
              <button 
                key={val}
                onClick={() => onCapitalChange(val)}
                className={`px-2 py-1 text-[9px] font-bold border transition-all ${capital === val ? 'bg-bb-orange text-black border-bb-orange' : 'text-bb-muted border-bb-border hover:border-white'}`}
              >
                {val / 100000}L
              </button>
            ))}
            <input 
              type="number" 
              value={capital}
              onChange={(e) => onCapitalChange(Number(e.target.value))}
              className="bg-bb-black border border-bb-border text-bb-orange font-bold px-3 py-1 text-xs w-24 outline-none focus:border-bb-orange transition-colors"
              placeholder="Custom..."
            />
          </div>
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead className="bg-bb-dark">
          <tr>
            {columns.map((column, index) => {
              const tip = getTooltipForHeader(column.header);
              return (
                <th
                  key={index}
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-bold text-bb-orange uppercase tracking-wider border-b border-bb-orange border-r border-bb-border last:border-r-0"
                >
                  <div className="flex items-center">
                    {column.sortable ? (
                    <button onClick={() => requestSort(column.header)} className="flex items-center hover:text-white transition-colors focus:outline-none flex-grow">
                        {column.header}
                        {getSortIcon(column.header)}
                    </button>
                    ) : (
                    <span>{column.header}</span>
                    )}
                    {tip && <Tooltip text={tip} />}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-bb-black divide-y divide-bb-border">
          {sortedData.length > 0 ? sortedData.map((item, rowIndex) => (
            <tr 
                key={`${item.strategy}-${item.period}-${rowIndex}`} 
                className={`hover:bg-bb-panel transition-colors ${item.isBenchmark ? 'bg-bb-blue/5 border-l-4 border-l-bb-blue' : ''}`}
            >
              {columns.map((column, colIndex) => {
                const isStrategyCol = column.header === 'Strategy';
                return (
                    <td key={colIndex} className="px-4 py-2 whitespace-nowrap text-xs text-bb-text border-r border-bb-border last:border-r-0">
                      {isStrategyCol && item.isBenchmark ? (
                          <span className="text-bb-blue font-bold tracking-tighter">BENCHMARK (PASSIVE)</span>
                      ) : (
                        typeof column.accessor === 'function'
                            ? column.accessor(item)
                            : (item as any)[column.accessor]
                      )}
                    </td>
                );
              })}
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