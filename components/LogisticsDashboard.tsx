import React, { useState, useEffect } from 'react';
import { fetchLogisticsAnalysis } from '../services/geminiService';
import { Loader } from './Loader';
import { RefreshCwIcon, LinkIcon } from './Icons';
import type { LogisticsAnalysis, MapLocation } from '../types';

const LogisticsDashboard: React.FC = () => {
    const [query, setQuery] = useState("Crude Oil Tanker movements and bottlenecks");
    const [data, setData] = useState<LogisticsAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [loadingMsg, setLoadingMsg] = useState("INITIALIZING SATELLITE LINK...");

    const handleSearch = async () => {
        setLoading(true);
        setLoadingMsg("INITIALIZING SATELLITE LINK...");
        const result = await fetchLogisticsAnalysis(query);
        setData(result);
        setLastUpdated(new Date());
        setLoading(false);
    };

    useEffect(() => {
        // Initial load
        handleSearch();
    }, []);

    // Rotate loading messages to keep user engaged
    useEffect(() => {
        if (!loading) return;
        
        const msgs = [
            "SCANNING GLOBAL SHIPPING ROUTES...",
            "QUERYING PORT CONGESTION DATA...",
            "TRIANGULATING KEY CHOKEPOINTS...",
            "ANALYZING GOOGLE MAPS GROUNDING...",
            "GENERATING STRATEGIC OUTLOOK..."
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % msgs.length;
            setLoadingMsg(msgs[i]);
        }, 2500);
        
        return () => clearInterval(interval);
    }, [loading]);

    const getOutlookColor = (outlook: string) => {
        if (outlook === 'Bullish') return 'text-bb-green border-bb-green';
        if (outlook === 'Bearish') return 'text-bb-red border-bb-red';
        return 'text-bb-muted border-bb-muted';
    };

    return (
        <div className="p-6 font-mono h-full overflow-y-auto bg-bb-black">
            <header className="mb-6 border-b border-bb-orange pb-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-bb-orange uppercase tracking-wider">>> GLOBAL SUPPLY CHAIN TRACKER</h2>
                        <p className="text-bb-muted text-xs mt-1">REAL-TIME COMMODITY LOGISTICS & CHOKEPOINT MONITORING</p>
                    </div>
                    {data && (
                        <div className={`px-4 py-2 border-2 ${getOutlookColor(data.outlook)}`}>
                            <span className="text-xs text-bb-muted block">AI OUTLOOK (OIL)</span>
                            <span className="text-xl font-bold uppercase">{data.outlook}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-grow bg-bb-panel border border-bb-border text-bb-text px-4 py-2 focus:border-bb-orange outline-none text-sm font-mono uppercase"
                        placeholder="ENTER COMMODITY OR REGION (E.G., 'LNG TANKERS SUEZ CANAL')..."
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-bb-orange text-bb-black px-6 py-2 font-bold uppercase hover:bg-white transition-colors disabled:opacity-50 text-sm flex items-center"
                    >
                        {loading ? <Loader className="w-4 h-4 mr-2" /> : <RefreshCwIcon className="w-4 h-4 mr-2" />}
                        {loading ? 'SCANNING...' : 'SCAN'}
                    </button>
                </div>
            </header>

            {loading && !data && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader className="w-16 h-16 text-bb-orange mb-4" />
                    <p className="text-bb-orange text-sm animate-pulse uppercase">{loadingMsg}</p>
                </div>
            )}

            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    
                    {/* Main Analysis Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-bb-panel border border-bb-blue p-6 relative">
                            <h3 className="text-sm font-bold text-bb-blue uppercase mb-4 border-b border-bb-border pb-2">>> INTELLIGENCE SUMMARY</h3>
                            <div className="prose prose-invert max-w-none">
                                <p className="text-bb-text text-sm leading-7 whitespace-pre-line">
                                    {data.analysisText}
                                </p>
                            </div>
                            <div className="mt-4 text-[10px] text-bb-muted text-right">
                                LAST UPDATED: {lastUpdated?.toLocaleTimeString()}
                            </div>
                        </div>

                        {/* Simulated Map Visualization (Conceptual) */}
                        <div className="bg-bb-black border border-bb-border h-64 relative overflow-hidden flex items-center justify-center">
                             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-bb-blue via-bb-black to-bb-black"></div>
                             
                             {/* Abstract Grid Map */}
                             <div className="w-full h-full grid grid-cols-12 grid-rows-6 gap-1 p-2 opacity-30">
                                {Array.from({ length: 72 }).map((_, i) => (
                                    <div key={i} className={`border border-bb-border ${Math.random() > 0.9 ? 'bg-bb-orange animate-pulse' : ''}`}></div>
                                ))}
                             </div>
                             
                             <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-bb-orange text-xs font-bold bg-bb-black px-2 py-1 border border-bb-orange">
                                    [ MAP DATA RENDERING ]
                                </p>
                             </div>
                        </div>
                    </div>

                    {/* Detected Locations / Grounding Data */}
                    <div className="bg-bb-dark border border-bb-border p-4">
                        <h3 className="text-sm font-bold text-bb-orange uppercase mb-4 border-b border-bb-border pb-2">>> ACTIVE HOTSPOTS (DETECTED)</h3>
                        
                        {data.detectedLocations.length > 0 ? (
                            <ul className="space-y-3">
                                {data.detectedLocations.map((loc, idx) => (
                                    <li key={idx} className="group">
                                        <a 
                                            href={loc.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="block bg-bb-black border border-bb-border p-3 hover:border-bb-blue transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-white group-hover:text-bb-blue">{loc.title}</span>
                                                <LinkIcon className="w-3 h-3 text-bb-muted group-hover:text-bb-blue" />
                                            </div>
                                            <div className="flex items-center text-[10px] text-bb-muted">
                                                <span className="w-2 h-2 rounded-full bg-bb-red mr-2 animate-pulse"></span>
                                                ACTIVITY DETECTED
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-bb-muted text-xs italic p-4 text-center border border-bb-border border-dashed">
                                NO SPECIFIC GEOLOCATION DATA RETURNED BY SATELLITE FEED.
                            </div>
                        )}

                        <div className="mt-6 p-3 bg-bb-black border border-bb-border">
                            <h4 className="text-[10px] font-bold text-bb-muted uppercase mb-2">Tracking Logic</h4>
                            <p className="text-[10px] text-bb-muted leading-relaxed">
                                System uses Google Maps Grounding to identify coordinates of reported tanker congestion, strategic strait blockages, and refinery outages reported in live news wires.
                            </p>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default LogisticsDashboard;