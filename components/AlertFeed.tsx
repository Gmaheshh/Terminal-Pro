import React from 'react';
import type { SignalAlert } from '../types';
import { RefreshCwIcon, XIcon } from './Icons';
import { Loader } from './Loader';

interface AlertFeedProps {
    alerts: SignalAlert[];
    loading: boolean;
    onRefresh: () => void;
    onClose?: () => void;
}

const AlertFeed: React.FC<AlertFeedProps> = ({ alerts, loading, onRefresh, onClose }) => {
    
    const getImpactStyle = (impact: string) => {
        switch (impact) {
            case 'CONFIRMING':
                return 'border-l-4 border-pro-green bg-pro-green/5';
            case 'THREATENING':
                return 'border-l-4 border-pro-red bg-pro-red/5';
            default:
                return 'border-l-4 border-pro-muted bg-pro-surface';
        }
    };

    const getImpactLabel = (impact: string) => {
         switch (impact) {
            case 'CONFIRMING': return <span className="text-pro-green font-bold text-[10px]">CONFLUENCE DETECTED</span>;
            case 'THREATENING': return <span className="text-pro-red font-bold text-[10px]">RISK DIVERGENCE</span>;
            default: return <span className="text-pro-muted text-[10px]">NEUTRAL EVENT</span>;
        }
    };

    return (
        <div className="fixed bottom-14 left-6 z-[60] w-[380px] max-h-[450px] overflow-hidden flex flex-col font-sans shadow-heavy border border-pro-border bg-white rounded-2xl hidden xl:flex">
            <div className="bg-pro-surface px-4 py-3 border-b border-pro-border flex justify-between items-center">
                <span className="font-extrabold text-pro-text text-xs uppercase tracking-widest">Neural Alert Stream</span>
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={onRefresh} 
                        disabled={loading}
                        className="p-1 hover:bg-pro-primary/10 text-pro-muted hover:text-pro-primary transition-all rounded-lg"
                        title="Refresh Intelligence Scan"
                    >
                        {loading ? <Loader className="w-3.5 h-3.5" /> : <RefreshCwIcon className="w-3.5 h-3.5" />}
                    </button>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-pro-red/10 text-pro-muted hover:text-pro-red transition-all rounded-lg"
                            title="Dismiss Popup"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 p-3 space-y-3">
                {alerts.length === 0 && !loading && (
                    <div className="text-center py-12 text-pro-muted text-xs font-medium italic opacity-60">
                        NO CONFLICTING EVENTS IN CURRENT CYCLE.
                    </div>
                )}
                
                {loading && alerts.length === 0 && (
                    <div className="p-10 text-center flex flex-col items-center">
                        <Loader className="w-8 h-8 text-pro-primary mb-3" />
                        <span className="text-[10px] font-bold text-pro-primary uppercase tracking-[0.2em] animate-pulse">Scanning Global Feeds...</span>
                    </div>
                )}

                {alerts.map((alert, idx) => (
                    <div key={idx} className={`p-4 border border-pro-border rounded-xl shadow-sm transition-all hover:scale-[1.02] ${getImpactStyle(alert.impact)}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-black text-pro-text text-sm tracking-tight">{alert.ticker}</span>
                            <span className="text-[10px] font-bold text-pro-muted uppercase">{alert.timestamp}</span>
                        </div>
                        
                        <div className="mb-3 flex items-center space-x-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${alert.signalDirection === 'LONG' ? 'bg-pro-green/10 text-pro-green' : 'bg-pro-red/10 text-pro-red'}`}>
                                {alert.signalDirection}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-pro-border"></span>
                             {getImpactLabel(alert.impact)}
                        </div>

                        <div className="mb-1 font-extrabold text-pro-text text-xs uppercase leading-tight">
                            {alert.event}
                        </div>
                        <div className="text-pro-muted text-[11px] font-medium leading-relaxed">
                            "{alert.reason}"
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-pro-surface p-2 text-center border-t border-pro-border">
                 <span className="text-[8px] font-black text-pro-muted uppercase tracking-[0.3em]">Institutional Risk Guard ACTIVE</span>
            </div>
        </div>
    );
};

export default AlertFeed;