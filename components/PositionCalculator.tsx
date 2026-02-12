import React, { useState, useMemo, useEffect } from 'react';
import type { ProcessedStock } from '../types';
import { InfoIcon, BrainCircuitIcon } from './Icons';

interface PositionCalculatorProps {
    stocks: ProcessedStock[];
    defaultAccountSize?: number;
}

const PositionCalculator: React.FC<PositionCalculatorProps> = ({ stocks, defaultAccountSize = 1000000 }) => {
    const [selectedTicker, setSelectedTicker] = useState<string>('');
    const [accountSize, setAccountSize] = useState<number>(defaultAccountSize);
    const [riskPct, setRiskPct] = useState<number>(2);
    const [maxPosPct, setMaxPosPct] = useState<number>(25);
    const [entryPrice, setEntryPrice] = useState<number>(0);
    const [stopLoss, setStopLoss] = useState<number>(0);
    const [target, setTarget] = useState<number>(0);

    useEffect(() => {
        if (!selectedTicker) return;
        const stock = stocks.find(s => s.ticker === selectedTicker);
        if (stock) {
            setEntryPrice(stock.data.currentPrice);
            setStopLoss(stock.signals.stopLoss);
            setTarget(stock.signals.target);
        }
    }, [selectedTicker, stocks]);

    const calculation = useMemo(() => {
        if (entryPrice <= 0 || stopLoss <= 0 || entryPrice === stopLoss) return null;

        const riskPerShare = Math.abs(entryPrice - stopLoss);
        const totalRiskAmount = (accountSize * riskPct) / 100;
        let quantity = Math.floor(totalRiskAmount / riskPerShare);
        const maxCapitalAllocation = (accountSize * maxPosPct) / 100;
        const rawCapitalRequired = quantity * entryPrice;
        
        let capApplied = false;
        if (rawCapitalRequired > maxCapitalAllocation) {
            quantity = Math.floor(maxCapitalAllocation / entryPrice);
            capApplied = true;
        }

        const totalInvestment = quantity * entryPrice;
        const actualRisk = quantity * riskPerShare;
        const potentialReward = quantity * Math.abs(target - entryPrice);
        const rrRatio = riskPerShare > 0 ? (Math.abs(target - entryPrice) / riskPerShare).toFixed(2) : '0';

        const brokerage = Math.min(20, totalInvestment * 0.0003) * 2;
        const stt = totalInvestment * 0.001; 
        const transactionCharges = totalInvestment * 0.0000345 * 2;
        const estTotalCharges = (brokerage + stt + transactionCharges) * 1.18;

        return {
            quantity,
            totalInvestment,
            actualRisk,
            potentialReward,
            rrRatio,
            estTotalCharges,
            capApplied,
            portfolioWeight: (totalInvestment / accountSize) * 100
        };
    }, [accountSize, riskPct, maxPosPct, entryPrice, stopLoss, target]);

    return (
        <div className="p-10 font-sans h-full overflow-y-auto bg-pro-bg">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-pro-text tracking-tight">Risk Planner</h2>
                    <p className="text-pro-muted text-sm font-medium mt-1">Calibrate your sizing based on conviction and capital constraints.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl shadow-soft border border-pro-border flex items-center">
                    <span className="w-2 h-2 rounded-full bg-pro-green mr-2"></span>
                    <span className="text-[11px] font-bold text-pro-text uppercase tracking-widest">Logic: ATR-Dynamic</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Inputs */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-pro-border p-8 rounded-[2.5rem] shadow-soft space-y-6">
                        <div className="space-y-5">
                            <Input label="Total Portfolio (₹)" value={accountSize} onChange={setAccountSize} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Risk per Trade (%)" value={riskPct} onChange={setRiskPct} step={0.1} />
                                <Input label="Max Exposure (%)" value={maxPosPct} onChange={setMaxPosPct} step={1} />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-pro-border">
                            <div className="mb-5">
                                <label className="block text-[11px] font-bold text-pro-muted uppercase mb-2 ml-1">Asset Override</label>
                                <select 
                                    value={selectedTicker}
                                    onChange={(e) => setSelectedTicker(e.target.value)}
                                    className="w-full bg-pro-bg border border-pro-border rounded-2xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-pro-primary/10 outline-none"
                                >
                                    <option value="">Manual Entry</option>
                                    {stocks.map(s => <option key={s.ticker} value={s.ticker}>{s.ticker}</option>)}
                                </select>
                            </div>
                            <div className="space-y-4">
                                <Input label="Entry (₹)" value={entryPrice} onChange={setEntryPrice} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Stop Loss (₹)" value={stopLoss} onChange={setStopLoss} color="text-pro-red" />
                                    <Input label="Target (₹)" value={target} onChange={setTarget} color="text-pro-green" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Outcomes */}
                <div className="lg:col-span-8">
                    {calculation ? (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <ResultCard label="Recommended Units" value={calculation.quantity.toString()} sub="Exact Size" color="text-pro-primary" />
                                <ResultCard label="Required Capital" value={`₹${calculation.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub="Total Value" />
                                <ResultCard label="Risk Reward" value={`${calculation.rrRatio}:1`} sub="Efficiency" color={Number(calculation.rrRatio) >= 2 ? 'text-pro-green' : 'text-pro-text'} />
                            </div>

                            <div className="bg-white border border-pro-border rounded-[3rem] p-10 shadow-heavy relative overflow-hidden">
                                {calculation.capApplied && (
                                    <div className="absolute top-0 left-0 right-0 bg-pro-red/5 px-6 py-2.5 text-center">
                                        <span className="text-[11px] font-bold text-pro-red uppercase tracking-widest">
                                            Constraint Triggered: Capped at {maxPosPct}% Capital
                                        </span>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
                                    <div className="space-y-8">
                                        <div>
                                            <span className="text-[11px] font-bold text-pro-muted uppercase tracking-widest block mb-5">Financial Exposure</span>
                                            <div className="space-y-4">
                                                <MetricRow label="Cash Risk (at SL)" value={`₹${calculation.actualRisk.toFixed(2)}`} color="text-pro-red" />
                                                <MetricRow label="Est. Net Profit (at TP)" value={`₹${calculation.potentialReward.toFixed(2)}`} color="text-pro-green" />
                                                <MetricRow label="Execution Costs" value={`₹${calculation.estTotalCharges.toFixed(2)}`} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center space-y-8">
                                        <div className="p-8 bg-pro-bg rounded-[2rem] border border-pro-border">
                                            <span className="text-[11px] font-bold text-pro-muted uppercase block mb-2">Net Expectancy</span>
                                            <span className="text-3xl font-bold text-pro-text">₹{(calculation.potentialReward - calculation.estTotalCharges).toLocaleString()}</span>
                                        </div>
                                        
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[11px] font-bold text-pro-muted uppercase">Concentration</span>
                                                <span className="text-sm font-bold">{calculation.portfolioWeight.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-pro-bg rounded-full overflow-hidden border border-pro-border">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${calculation.portfolioWeight > 25 ? 'bg-pro-red' : 'bg-pro-primary'}`}
                                                    style={{ width: `${Math.min(calculation.portfolioWeight, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-pro-border rounded-[3rem] opacity-40">
                             <p className="text-sm font-semibold text-pro-muted uppercase tracking-widest">Awaiting Parameter Entry...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Input: React.FC<{ label: string, value: number, onChange: (v: number) => void, color?: string, step?: number }> = ({ label, value, onChange, color = 'text-pro-text', step = 0.01 }) => (
    <div>
        <label className="block text-[11px] font-bold text-pro-muted uppercase mb-2 ml-1">{label}</label>
        <input 
            type="number" 
            value={value || ''}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`w-full bg-pro-bg border border-pro-border rounded-2xl px-4 py-3 text-sm font-semibold ${color} focus:ring-2 focus:ring-pro-primary/10 focus:border-pro-primary outline-none transition-all`}
        />
    </div>
);

const ResultCard: React.FC<{ label: string, value: string, sub: string, color?: string }> = ({ label, value, sub, color = 'text-pro-text' }) => (
    <div className="bg-white border border-pro-border p-8 rounded-[2rem] shadow-soft text-center hover:border-pro-primary/20 transition-colors">
        <span className="text-[11px] text-pro-muted uppercase font-bold tracking-widest block mb-2">{label}</span>
        <span className={`text-2xl font-bold ${color} tracking-tight block mb-1`}>{value}</span>
        <span className="text-[10px] text-pro-muted font-semibold uppercase">{sub}</span>
    </div>
);

const MetricRow: React.FC<{ label: string, value: string, color?: string }> = ({ label, value, color = 'text-pro-text' }) => (
    <div className="flex justify-between items-center py-2">
        <span className="text-[13px] font-medium text-pro-muted">{label}</span>
        <span className={`text-[13px] font-bold ${color}`}>{value}</span>
    </div>
);

export default PositionCalculator;