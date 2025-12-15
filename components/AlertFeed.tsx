import React from 'react';
import type { SignalAlert } from '../types';
import { RefreshCwIcon } from './Icons';
import { Loader } from './Loader';

interface AlertFeedProps {
    alerts: SignalAlert[];
    loading: boolean;
    onRefresh: () => void;
}

const AlertFeed: React.FC<AlertFeedProps> = ({ alerts, loading, onRefresh }) => {
    
    const getImpactStyle = (impact: string) => {
        switch (impact) {
            case 'CONFIRMING':
                return 'border-l-4 border-bb-green bg-bb-green/10';
            case 'THREATENING':
                return 'border-l-4 border-bb-red bg-bb-red/10 animate-pulse-fast';
            default:
                return 'border-l-4 border-bb-muted bg-bb-panel';
        }
    };

    const getImpactLabel = (impact: string) => {
         switch (impact) {
            case 'CONFIRMING': return <span className="text-bb-green font-bold">>> CONFLUENCE</span>;
            case 'THREATENING': return <span className="text-bb-red font-bold">>> DIVERGENCE DETECTED</span>;
            default: return <span className="text-bb-muted">>> NOTE</span>;
        }
    };

    return (
        <div className="fixed bottom-12 left-4 z-40 w-[400px] max-h-[400px] overflow-hidden flex flex-col font-mono text-xs shadow-2xl border border-bb-border bg-bb-black hidden xl:flex">
            <div className="bg-bb-dark p-2 border-b border-bb-orange flex justify-between items-center">
                <span className="font-bold text-bb-orange uppercase tracking-wider">INTEL_ENGINE // SIGNAL_ALERTS</span>
                <button 
                    onClick={onRefresh} 
                    disabled={loading}
                    className="hover:text-white text-bb-muted transition-colors"
                >
                    {loading ? <Loader className="w-3 h-3" /> : <RefreshCwIcon className="w-3 h-3" />}
                </button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-2">
                {alerts.length === 0 && !loading && (
                    <div className="text-center py-8 text-bb-muted italic">
                        NO CONFLICTING EVENTS DETECTED.
                    </div>
                )}
                
                {loading && alerts.length === 0 && (
                    <div className="p-4 text-center text-bb-orange">
                        <span className="blink">SCANNING EVENT HORIZON...</span>
                    </div>
                )}

                {alerts.map((alert, idx) => (
                    <div key={idx} className={`p-3 border border-bb-border/50 ${getImpactStyle(alert.impact)} transition-all hover:bg-opacity-20`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-white text-sm">{alert.ticker}</span>
                            <span className="text-[10px] text-bb-muted">{alert.timestamp}</span>
                        </div>
                        
                        <div className="mb-2">
                            <span className="text-[10px] uppercase tracking-wide bg-black px-1 border border-bb-border rounded text-bb-text">
                                SIGNAL: {alert.signalDirection}
                            </span>
                            <span className="mx-1 text-bb-muted">|</span>
                             {getImpactLabel(alert.impact)}
                        </div>

                        <div className="mb-1 font-bold text-bb-text uppercase">
                            {alert.event}
                        </div>
                        <div className="text-bb-muted leading-tight">
                            "{alert.reason}"
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlertFeed;