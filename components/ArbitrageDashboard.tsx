
import React, { useMemo, useState } from 'react';
import type { Column, ArbitrageOpportunity } from '../types';
import { ArrowDownIcon, ArrowUpIcon } from './Icons';

interface ArbitrageDashboardProps {
    data: ArbitrageOpportunity[];
    columns: Column<ArbitrageOpportunity>[];
}

const ArbitrageDashboard: React.FC<ArbitrageDashboardProps> = ({ data, columns }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'ascending' | 'descending' }>({
        key: 'Spread %',
        direction: 'descending',
    });

    const sortedData = useMemo(() => {
        let sortableData = [...data];
        if (sortConfig.key !== null) {
            sortableData.sort((a, b) => {
                const getSortValue = (item: ArbitrageOpportunity, key: string) => {
                    switch (key) {
                        case 'Ticker': return item.ticker;
                        case 'NSE Price': return item.nsePrice;
                        case 'BSE Price': return item.bsePrice;
                        case 'Spread': return item.spread;
                        case 'Spread %': return Math.abs(item.spreadPct);
                        default: return 0;
                    }
                };

                const aValue = getSortValue(a, sortConfig.key);
                const bValue = getSortValue(b, sortConfig.key);

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
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
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="w-3 h-3 ml-1 text-bb-orange" /> : <ArrowDownIcon className="w-3 h-3 ml-1 text-bb-orange" />;
    };

    const signalOpps = useMemo(() => data.filter(d => d.signal !== 'NEUTRAL'), [data]);

    return (
        <div className="font-mono h-full flex flex-col">
            <div className="p-4 bg-bb-panel border-b border-bb-border shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-bb-orange uppercase tracking-wider">>> DUAL-EXCHANGE ARBITRAGE SCANNER</h2>
                        <p className="text-bb-muted text-xs mt-1">REAL-TIME PRICE SPREAD MONITORING: NSE (INDIA) vs BSE (INDIA)</p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-bb-muted mb-1 uppercase">Active Opps Detected</div>
                        <div className="text-2xl font-bold text-bb-green">{signalOpps.length}</div>
                    </div>
                </div>
                
                <div className="mt-4 flex space-x-4">
                    <div className="px-3 py-1 bg-bb-black border border-bb-border text-[10px] text-bb-muted">
                        THRESHOLD: <span className="text-bb-orange font-bold">0.15%</span>
                    </div>
                    <div className="px-3 py-1 bg-bb-black border border-bb-border text-[10px] text-bb-muted">
                        LATENCY: <span className="text-bb-blue font-bold">REAL-TIME (SYNCED)</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse">
                    <thead className="bg-bb-dark sticky top-0 z-10">
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
                            <tr key={rowIndex} className={`hover:bg-bb-panel transition-colors group ${item.signal !== 'NEUTRAL' ? 'bg-bb-orange/5' : ''}`}>
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
                                <td colSpan={columns.length} className="text-center py-20 text-bb-muted font-mono uppercase">
                                    // NO DUAL-EXCHANGE LIQUIDITY DETECTED //
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-bb-dark border-t border-bb-border shrink-0 text-[10px] text-bb-muted leading-relaxed">
                <p className="font-bold text-bb-blue mb-1 uppercase tracking-tighter">System Logic Trace:</p>
                <p>
                    Dual-Exchange Arbitrage occurs when a security is priced differently across NSE (.NS) and BSE (.BO). 
                    Strategy triggers a BUY on the undervalued exchange and a SELL on the overvalued exchange. 
                    Calculations account for fractional basis point slippage. High-latency risk: 
                    Execution must be instantaneous to capture spread alpha before convergence.
                </p>
            </div>
        </div>
    );
};

export default ArbitrageDashboard;
