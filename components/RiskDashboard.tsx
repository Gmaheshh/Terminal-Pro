import React from 'react';
import type { RiskAnalysis } from '../types';

interface RiskDashboardProps {
    risk: RiskAnalysis | null;
}

const Gauge: React.FC<{ value: number, label: string, color: string, subText?: string }> = ({ value, label, color, subText }) => (
    <div className="bg-bb-panel border border-bb-border p-4 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="relative w-32 h-16 overflow-hidden mb-2">
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-bb-border"></div>
            <div 
                className={`absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] ${color} origin-bottom transition-transform duration-1000`}
                style={{ transform: `rotate(${(Math.min(value, 100) / 100) * 180 - 180}deg)` }}
            ></div>
        </div>
        <span className="text-2xl font-bold font-mono text-white">{value.toFixed(1)}%</span>
        <span className="text-xs text-bb-muted uppercase tracking-wider mt-1">{label}</span>
        {subText && <span className="text-[10px] text-bb-orange mt-1">{subText}</span>}
    </div>
);

const RiskDashboard: React.FC<RiskDashboardProps> = ({ risk }) => {
    if (!risk) return null;

    const currencyFormatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CRITICAL': return 'bg-bb-red text-black animate-pulse';
            case 'CAUTION': return 'bg-bb-orange text-black';
            default: return 'bg-bb-green text-black';
        }
    };

    return (
        <div className="p-6 font-mono h-full overflow-y-auto">
            <header className="mb-6 flex justify-between items-end border-b border-bb-border pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-bb-orange uppercase tracking-wider">>> RISK CONTROL DESK</h2>
                    <p className="text-bb-muted text-xs mt-1">REAL-TIME PORTFOLIO STRESS TEST SIMULATION</p>
                </div>
                <div className={`px-4 py-2 text-xl font-bold uppercase border-2 border-black ${getStatusColor(risk.status)}`}>
                    STATUS: {risk.status}
                </div>
            </header>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-bb-dark border border-bb-border p-4">
                    <div className="text-xs text-bb-muted uppercase mb-1">Total Simulated Exposure</div>
                    <div className="text-2xl text-white font-bold">{currencyFormatter.format(risk.totalExposure)}</div>
                    <div className="text-[10px] text-bb-blue mt-1">BASE CAPITAL: {currencyFormatter.format(risk.totalCapital)}</div>
                </div>
                <div className="bg-bb-dark border border-bb-border p-4">
                     <div className="text-xs text-bb-muted uppercase mb-1">Exposure Ratio</div>
                     <div className={`text-2xl font-bold ${risk.exposureRatio > 1 ? 'text-bb-red' : 'text-bb-green'}`}>
                        {(risk.exposureRatio * 100).toFixed(1)}%
                     </div>
                     <div className="w-full bg-gray-800 h-1 mt-2">
                        <div className={`h-full ${risk.exposureRatio > 1 ? 'bg-bb-red' : 'bg-bb-green'}`} style={{ width: `${Math.min(risk.exposureRatio * 100, 100)}%` }}></div>
                     </div>
                </div>
                 <div className="bg-bb-dark border border-bb-border p-4">
                     <div className="text-xs text-bb-muted uppercase mb-1">Value at Risk (Daily)</div>
                     <div className="text-2xl text-bb-orange font-bold">{currencyFormatter.format(risk.varDaily)}</div>
                     <div className="text-[10px] text-bb-muted mt-1">95% CONFIDENCE INTERVAL</div>
                </div>
                <div className="bg-bb-dark border border-bb-border p-4">
                     <div className="text-xs text-bb-muted uppercase mb-1">Concentration Alert</div>
                     <div className="text-xl text-white font-bold truncate">{risk.maxSinglePositionTicker}</div>
                     <div className={`text-sm font-bold ${risk.maxSinglePositionRisk > 25 ? 'text-bb-red' : 'text-bb-green'}`}>
                        {risk.maxSinglePositionRisk.toFixed(1)}% of Portfolio
                     </div>
                </div>
            </div>

            {/* Gauges Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Gauge 
                    value={risk.concentration.defensive} 
                    label="Defensive Allocation" 
                    color="border-bb-blue" 
                    subText="LOW VOL (<1.5% ATR)"
                />
                 <Gauge 
                    value={risk.concentration.cyclical} 
                    label="Cyclical Allocation" 
                    color="border-bb-green"
                    subText="MID VOL (1.5-2.5% ATR)"
                />
                 <Gauge 
                    value={risk.concentration.speculative} 
                    label="Speculative Allocation" 
                    color="border-bb-red"
                    subText="HIGH VOL (>2.5% ATR)"
                />
            </div>

            {/* Bottom Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-bb-panel border border-bb-border p-4">
                    <h3 className="text-sm font-bold text-bb-orange uppercase mb-4 border-b border-bb-border pb-2">>> STRATEGY OVERLAP MATRIX</h3>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-bb-text">CORRELATION COEFFICIENT (PROXY)</span>
                        <span className="text-xl font-bold text-white">{risk.strategyOverlap.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-bb-black h-4 rounded-full overflow-hidden border border-bb-border">
                        <div 
                            className={`h-full ${risk.strategyOverlap > 40 ? 'bg-bb-red' : 'bg-bb-blue'} striped-bar`} 
                            style={{ width: `${risk.strategyOverlap}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-bb-muted mt-3 leading-relaxed">
                        High overlap (>40%) indicates multiple algorithms are triggering on the same assets. 
                        While this confirms high conviction, it creates systemic failure points if the trend reverses.
                    </p>
                </div>

                <div className="bg-bb-panel border border-bb-border p-4">
                    <h3 className="text-sm font-bold text-bb-orange uppercase mb-4 border-b border-bb-border pb-2">>> RISK MANAGER RECOMMENDATION</h3>
                    <div className="p-4 bg-bb-black border-l-4 border-bb-orange">
                        <p className="text-sm text-bb-text font-bold uppercase leading-relaxed">
                            "{risk.recommendation}"
                        </p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                        <div className="flex justify-between border-b border-bb-border py-1">
                            <span className="text-bb-muted">LEVERAGE CHECK:</span>
                            <span className={risk.exposureRatio > 1 ? 'text-bb-red' : 'text-bb-green'}>{risk.exposureRatio > 1 ? 'FAILED' : 'PASSED'}</span>
                        </div>
                        <div className="flex justify-between border-b border-bb-border py-1">
                            <span className="text-bb-muted">DIVERSITY CHECK:</span>
                             <span className={risk.maxSinglePositionRisk > 25 ? 'text-bb-red' : 'text-bb-green'}>{risk.maxSinglePositionRisk > 25 ? 'FAILED' : 'PASSED'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .striped-bar {
                    background-image: linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);
                    background-size: 1rem 1rem;
                }
            `}</style>
        </div>
    );
};

export default RiskDashboard;