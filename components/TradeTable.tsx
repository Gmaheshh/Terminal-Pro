import React, { useState, useMemo } from 'react';
import type { Trade } from '../types';
import { ArrowDownIcon, ArrowUpIcon } from './Icons';

interface TradeTableProps {
  trades: Trade[];
  title: string;
}

const pnlFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const TradeTable: React.FC<TradeTableProps> = ({ trades, title }) => {
    const [sortConfig, setSortConfig] = useState<{ key: keyof Trade | 'tradeRoI' | 'pnl' | null; direction: 'ascending' | 'descending' }>({
        key: 'pnl',
        direction: 'descending',
    });

    const sortedTrades = useMemo(() => {
        let sortableTrades = [...trades];
        if (sortConfig.key) {
            sortableTrades.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof Trade];
                const bValue = b[sortConfig.key as keyof Trade];

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
                
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }

                return 0;
            });
        }
        return sortableTrades;
    }, [trades, sortConfig]);

    const requestSort = (key: keyof Trade | 'tradeRoI' | 'pnl') => {
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

    const headers: { key: keyof Trade | 'tradeRoI' | 'pnl'; label: string; isNumeric?: boolean }[] = [
        { key: 'ticker', label: 'TICKER' },
        { key: 'entryDate', label: 'IN DATE' },
        { key: 'entryPrice', label: 'IN PRICE', isNumeric: true },
        { key: 'exitDate', label: 'OUT DATE' },
        { key: 'exitPrice', label: 'OUT PRICE', isNumeric: true },
        { key: 'tradeRoI', label: 'ROI %', isNumeric: true },
        { key: 'pnl', label: 'P/L', isNumeric: true },
    ];
    
    return (
        <div className="border border-bb-border bg-bb-black font-mono">
            <h3 className="p-2 text-xs font-bold text-bb-orange bg-bb-dark border-b border-bb-orange uppercase tracking-wider">{title} <span className="text-bb-muted">[{trades.length}]</span></h3>
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full text-xs">
                    <thead className="bg-bb-dark sticky top-0">
                        <tr>
                            {headers.map(header => (
                                <th key={header.key} className={`p-2 font-bold text-bb-muted border-b border-bb-border ${header.isNumeric ? 'text-right' : 'text-left'}`}>
                                    <button onClick={() => requestSort(header.key)} className={`flex items-center hover:text-white transition-colors focus:outline-none w-full ${header.isNumeric ? 'justify-end' : 'justify-start'}`}>
                                        {header.label}
                                        {getSortIcon(header.key)}
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-bb-border">
                        {sortedTrades.length > 0 ? sortedTrades.map((trade, index) => {
                            const pnlColor = trade.pnl > 0 ? 'text-bb-green' : 'text-bb-red';
                            return (
                                <tr key={index} className="hover:bg-bb-panel transition-colors">
                                    <td className="p-2 whitespace-nowrap font-bold text-bb-blue">{trade.ticker}</td>
                                    <td className="p-2 whitespace-nowrap text-bb-muted">{trade.entryDate}</td>
                                    <td className="p-2 whitespace-nowrap text-right text-bb-text">{trade.entryPrice.toFixed(2)}</td>
                                    <td className="p-2 whitespace-nowrap text-bb-muted">{trade.exitDate}</td>
                                    <td className="p-2 whitespace-nowrap text-right text-bb-text">{trade.exitPrice.toFixed(2)}</td>
                                    <td className={`p-2 whitespace-nowrap text-right font-bold ${pnlColor}`}>{`${trade.tradeRoI > 0 ? '+' : ''}${trade.tradeRoI.toFixed(2)}%`}</td>
                                    <td className={`p-2 whitespace-nowrap text-right font-bold ${pnlColor}`}>{pnlFormatter.format(trade.pnl)}</td>
                                </tr>
                            );
                        }) : (
                             <tr>
                                <td colSpan={headers.length} className="text-center py-4 text-bb-muted italic">
                                    NO RECORDS
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TradeTable;