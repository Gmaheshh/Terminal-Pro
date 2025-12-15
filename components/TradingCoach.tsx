import React, { useState, useEffect } from 'react';
import type { PortfolioBacktestResult, CoachInsight } from '../types';
import { generateCoachingInsight } from '../services/geminiService';
import { BrainCircuitIcon } from './Icons';
import { Loader } from './Loader';

interface TradingCoachProps {
    results: PortfolioBacktestResult[];
}

const TraitBar: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
    <div className="mb-4">
        <div className="flex justify-between text-xs font-mono uppercase mb-1">
            <span className="text-bb-muted">{label}</span>
            <span className="text-white font-bold">{value}/100</span>
        </div>
        <div className="w-full bg-bb-black h-3 border border-bb-border rounded-full overflow-hidden">
            <div 
                className={`h-full ${color} transition-all duration-1000 ease-out`} 
                style={{ width: `${value}%` }}
            />
        </div>
    </div>
);

const TradingCoach: React.FC<TradingCoachProps> = ({ results }) => {
    const [selectedStrategy, setSelectedStrategy] = useState<string>(results[0]?.strategy || "");
    const [insight, setInsight] = useState<CoachInsight | null>(null);
    const [loading, setLoading] = useState(false);

    // Auto-select first strategy on load
    useEffect(() => {
        if (results.length > 0 && !selectedStrategy) {
            setSelectedStrategy(results[0].strategy);
        }
    }, [results]);

    useEffect(() => {
        const fetchInsight = async () => {
            const targetResult = results.find(r => r.strategy === selectedStrategy && r.period === '5Y');
            
            if (targetResult) {
                setLoading(true);
                const data = await generateCoachingInsight(targetResult);
                setInsight(data);
                setLoading(false);
            }
        };

        if (selectedStrategy) {
            fetchInsight();
        }
    }, [selectedStrategy, results]);

    if (results.length === 0) {
        return <div className="p-8 text-center text-bb-muted italic">Run a simulation first to enable coaching.</div>;
    }

    return (
        <div className="p-6 font-mono h-full overflow-y-auto">
            <header className="mb-8 border-b border-bb-orange pb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-bb-orange uppercase tracking-wider flex items-center">
                        <BrainCircuitIcon className="w-6 h-6 mr-2" />
                        Psyche-Alpha Coach
                    </h2>
                    <p className="text-bb-muted text-xs mt-1">BEHAVIORAL FINANCE & PERFORMANCE PSYCHOLOGY</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-bb-muted uppercase">Select Track Record:</span>
                    <select 
                        value={selectedStrategy}
                        onChange={(e) => setSelectedStrategy(e.target.value)}
                        className="bg-bb-black border border-bb-border text-bb-text text-xs p-2 focus:border-bb-orange outline-none"
                    >
                        {Array.from(new Set(results.map(r => r.strategy))).map(strat => (
                            <option key={strat} value={strat}>{strat}</option>
                        ))}
                    </select>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader className="w-12 h-12 text-bb-orange mb-4" />
                    <p className="text-bb-orange text-sm animate-pulse">ANALYZING TRADING PATTERNS & BIASES...</p>
                </div>
            ) : insight ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                    
                    {/* Left Column: Archetype & Stats */}
                    <div className="space-y-6">
                        <div className="bg-bb-panel border border-bb-blue p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10 text-9xl font-bold text-bb-blue pointer-events-none">
                                ?
                            </div>
                            <h3 className="text-xs font-bold text-bb-blue uppercase mb-2">>> TRADER ARCHETYPE DETECTED</h3>
                            <h1 className="text-4xl font-bold text-white mb-4 uppercase tracking-widest">{insight.traderArchetype}</h1>
                            
                            <div className="bg-bb-black/50 p-4 rounded border border-bb-border">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-bb-muted">MENTAL CAPITAL SCORE</span>
                                    <span className={`text-xl font-bold ${insight.mentalCapitalScore > 70 ? 'text-bb-green' : 'text-bb-red'}`}>
                                        {insight.mentalCapitalScore}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 h-1">
                                    <div 
                                        className={`h-full ${insight.mentalCapitalScore > 70 ? 'bg-bb-green' : 'bg-bb-red'}`} 
                                        style={{ width: `${insight.mentalCapitalScore}%` }} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-bb-black border border-bb-border p-6">
                            <h3 className="text-xs font-bold text-bb-orange uppercase mb-4 border-b border-bb-border pb-2">>> PSYCHOMETRIC PROFILE</h3>
                            <TraitBar label="Discipline (Adherence to Plan)" value={insight.psychologicalTraits.discipline} color="bg-cyan-500" />
                            <TraitBar label="Patience (Entry Timing)" value={insight.psychologicalTraits.patience} color="bg-purple-500" />
                            <TraitBar label="Risk Management (Sizing)" value={insight.psychologicalTraits.riskMgmt} color="bg-orange-500" />
                            <TraitBar label="Consistency (Variance)" value={insight.psychologicalTraits.consistency} color="bg-emerald-500" />
                        </div>
                    </div>

                    {/* Right Column: Feedback */}
                    <div className="space-y-6">
                        <div className="bg-bb-panel border border-bb-red p-6">
                            <h3 className="text-xs font-bold text-bb-red uppercase mb-4 blink">>> DETECTED COGNITIVE BIASES</h3>
                            <div className="flex flex-wrap gap-2">
                                {insight.detectedBiases.map((bias, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-bb-red/20 text-bb-red border border-bb-red text-xs font-bold uppercase">
                                        ⚠️ {bias}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-bb-black border border-bb-border p-6 flex-grow">
                            <h3 className="text-xs font-bold text-bb-green uppercase mb-4 border-b border-bb-border pb-2">>> COACH'S ACTIONABLE FEEDBACK</h3>
                            <div className="prose prose-invert max-w-none">
                                <p className="text-sm leading-relaxed text-bb-text font-mono border-l-2 border-bb-green pl-4">
                                    "{insight.actionableFeedback}"
                                </p>
                            </div>
                        </div>

                         <div className="bg-bb-dark border border-bb-border p-4 text-xs text-bb-muted">
                            <h4 className="font-bold text-bb-orange mb-2 uppercase">>> COACHING LOGIC EXPLAINED</h4>
                            <p>This module analyzes win/loss streaks, drawdown recovery time, and PnL variance to approximate human behavioral flaws in algorithmic execution.</p>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="text-center py-20 text-bb-muted">Select a strategy to begin assessment.</div>
            )}
        </div>
    );
};

export default TradingCoach;