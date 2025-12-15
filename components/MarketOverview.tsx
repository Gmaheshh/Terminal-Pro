import React from 'react';
import type { MarketRegime } from '../types';

const MarketOverview: React.FC<{ regime: MarketRegime | null }> = ({ regime }) => {
    if (!regime) return null;

    const getRegimeColor = (type: string) => {
        switch (type) {
            case 'TRENDING': return 'text-bb-green';
            case 'RISK_OFF': return 'text-bb-red';
            case 'HIGH_VOLATILITY': return 'text-bb-orange';
            case 'RANGE_BOUND': return 'text-bb-blue';
            default: return 'text-bb-muted';
        }
    };

    const getRegimeBg = (type: string) => {
         switch (type) {
            case 'TRENDING': return 'bg-bb-green/20 border-bb-green';
            case 'RISK_OFF': return 'bg-bb-red/20 border-bb-red';
            case 'HIGH_VOLATILITY': return 'bg-bb-orange/20 border-bb-orange';
            case 'RANGE_BOUND': return 'bg-bb-blue/20 border-bb-blue';
            default: return 'bg-bb-panel border-bb-border';
        }
    };

    return (
        <div className="flex items-center h-full mr-4 border-r border-bb-border pr-4 py-1">
             <div className={`flex flex-col justify-center px-3 py-1 border h-full mr-4 ${getRegimeBg(regime.type)}`}>
                <span className="text-[9px] text-bb-muted uppercase font-bold tracking-widest">Market Regime</span>
                <span className={`text-sm font-bold uppercase ${getRegimeColor(regime.type)}`}>
                    {regime.type.replace('_', ' ')}
                </span>
            </div>

            <div className="flex space-x-6 text-[10px] font-mono">
                 <div className="flex flex-col justify-center">
                    <span className="text-bb-muted uppercase">Volatility (ATR%)</span>
                    <span className={regime.avgVolatility > 2.0 ? 'text-bb-red font-bold' : 'text-bb-text'}>
                        {regime.avgVolatility.toFixed(2)}%
                    </span>
                </div>
                
                 <div className="flex flex-col justify-center">
                    <span className="text-bb-muted uppercase">Trend (Avg ADX)</span>
                    <span className={regime.avgAdx > 25 ? 'text-bb-green font-bold' : 'text-bb-text'}>
                        {regime.avgAdx.toFixed(2)}
                    </span>
                </div>

                <div className="flex flex-col justify-center">
                    <span className="text-bb-muted uppercase">Breadth (>SMA50)</span>
                    <span className={regime.breadthSma50 > 50 ? 'text-bb-green font-bold' : 'text-bb-red font-bold'}>
                        {regime.breadthSma50.toFixed(1)}%
                    </span>
                </div>
                
                <div className="flex flex-col justify-center w-32 hidden lg:flex">
                     <span className="text-bb-muted uppercase">Guidance</span>
                     <span className="text-bb-blue truncate">{regime.description}</span>
                </div>
            </div>
        </div>
    );
};

export default MarketOverview;