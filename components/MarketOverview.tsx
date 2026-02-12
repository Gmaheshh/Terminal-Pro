import React from 'react';
import type { MarketRegime } from '../types';

const MarketOverview: React.FC<{ regime: MarketRegime | null }> = ({ regime }) => {
    if (!regime) return null;

    const getRegimeColor = (type: string) => {
        switch (type) {
            case 'TRENDING': return 'text-pro-green';
            case 'RISK_OFF': return 'text-pro-red';
            case 'HIGH_VOLATILITY': return 'text-pro-accent';
            case 'RANGE_BOUND': return 'text-pro-primary';
            default: return 'text-pro-muted';
        }
    };

    const getRegimeBg = (type: string) => {
         switch (type) {
            case 'TRENDING': return 'bg-pro-green/10 border-pro-green/20';
            case 'RISK_OFF': return 'bg-pro-red/10 border-pro-red/20';
            case 'HIGH_VOLATILITY': return 'bg-pro-accent/10 border-pro-accent/20';
            case 'RANGE_BOUND': return 'bg-pro-primary/10 border-pro-primary/20';
            default: return 'bg-pro-surface border-pro-border';
        }
    };

    return (
        <div className="flex items-center space-x-6">
             <div className={`flex flex-col justify-center px-4 py-1.5 border rounded-xl ${getRegimeBg(regime.type)}`}>
                <span className="text-[9px] text-pro-muted uppercase font-bold tracking-widest leading-none mb-1">Market Regime</span>
                <span className={`text-xs font-extrabold uppercase ${getRegimeColor(regime.type)}`}>
                    {regime.type.replace('_', ' ')}
                </span>
            </div>

            <div className="hidden md:flex space-x-8">
                 <div className="flex flex-col justify-center">
                    <span className="text-[9px] text-pro-muted uppercase font-bold tracking-tight">Volatility</span>
                    <span className={`text-xs font-bold ${regime.avgVolatility > 2.0 ? 'text-pro-red' : 'text-pro-text'}`}>
                        {regime.avgVolatility.toFixed(2)}%
                    </span>
                </div>
                
                 <div className="flex flex-col justify-center">
                    <span className="text-[9px] text-pro-muted uppercase font-bold tracking-tight">Trend Strength</span>
                    <span className={`text-xs font-bold ${regime.avgAdx > 25 ? 'text-pro-green' : 'text-pro-text'}`}>
                        {regime.avgAdx.toFixed(2)}
                    </span>
                </div>

                <div className="flex flex-col justify-center">
                    <span className="text-[9px] text-pro-muted uppercase font-bold tracking-tight">Market Breadth</span>
                    <span className={`text-xs font-bold ${regime.breadthSma50 > 50 ? 'text-pro-green' : 'text-pro-red'}`}>
                        {regime.breadthSma50.toFixed(1)}%
                    </span>
                </div>
                
                <div className="flex flex-col justify-center max-w-[150px] lg:block hidden border-l border-pro-border pl-6">
                     <span className="text-[9px] text-pro-muted uppercase font-bold tracking-tight">AI Signal</span>
                     <span className="text-[11px] font-medium text-pro-primary truncate block leading-tight">{regime.description}</span>
                </div>
            </div>
        </div>
    );
};

export default MarketOverview;