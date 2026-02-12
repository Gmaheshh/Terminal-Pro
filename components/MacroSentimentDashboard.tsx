import React, { useState, useEffect, useRef } from 'react';
import { getMacroSentimentStream, getMacroDeepDive } from '../services/geminiService';
import { Loader } from './Loader';
import { RefreshCwIcon, LinkIcon, BrainCircuitIcon } from './Icons';
import type { MacroSentimentResult, MacroSectorSentiment, SearchSource, MacroDeepDive } from '../types';
import MacroDeepDiveModal from './MacroDeepDiveModal';

const MacroSentimentDashboard: React.FC = () => {
    const [rawText, setRawText] = useState("");
    const [sources, setSources] = useState<SearchSource[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [parsedData, setParsedData] = useState<MacroSentimentResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const terminalRef = useRef<HTMLDivElement>(null);

    // Deep Dive State
    const [deepDiveOpen, setDeepDiveOpen] = useState(false);
    const [deepDiveLoading, setDeepDiveLoading] = useState(false);
    const [deepDiveData, setDeepDiveData] = useState<MacroDeepDive | null>(null);
    const [selectedItem, setSelectedItem] = useState<{label: string, desc: string} | null>(null);

    const handleDeepDive = async (item: MacroSectorSentiment) => {
        setSelectedItem({ label: item.label, desc: item.description });
        setDeepDiveOpen(true);
        setDeepDiveLoading(true);
        setDeepDiveData(null);
        try {
            const data = await getMacroDeepDive(item.description, item.label);
            setDeepDiveData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setDeepDiveLoading(false);
        }
    };

    const loadMacroStream = async () => {
        setIsStreaming(true);
        setError(null);
        setRawText("");
        setSources([]);
        setParsedData(null);
        
        let fullContent = "";
        const allSources = new Set<string>();
        const uniqueSources: SearchSource[] = [];

        try {
            const stream = await getMacroSentimentStream();
            for await (const chunk of stream) {
                fullContent += chunk.text;
                setRawText(fullContent);
                
                chunk.sources.forEach(s => {
                    if (!allSources.has(s.uri)) {
                        allSources.add(s.uri);
                        uniqueSources.push(s);
                    }
                });
                setSources([...uniqueSources]);
                
                if (terminalRef.current) {
                    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
                }
            }
            
            parseMacroResult(fullContent, uniqueSources);
        } catch (e: any) {
            setError(`Kernel uplink failed. Retrying...`);
        } finally {
            setIsStreaming(false);
        }
    };

    const parseMacroResult = (text: string, currentSources: SearchSource[]) => {
        const lines = text.split('\n');
        const getSection = (name: string) => {
            const startIndex = lines.findIndex(l => l.includes(name));
            if (startIndex === -1) return [];
            const items = [];
            for (let i = startIndex + 1; i < lines.length; i++) {
                if (lines[i].includes(':') && lines[i].toUpperCase().includes('_')) break;
                if (!lines[i].includes('|')) continue;
                const parts = lines[i].replace(/^[-*]\s*/, '').split('|').map(p => p.trim());
                if (parts.length >= 7) {
                    items.push({
                        label: parts[0],
                        sentiment: parts[1] as any,
                        impactLevel: parts[2] as any,
                        description: parts[3],
                        effects: parts[4],
                        affectedSectors: parts[5].split(',').map(s => s.trim()),
                        impactedStocks: parts[6].split(',').map(s => s.trim())
                    });
                }
            }
            return items;
        };

        const consensusLine = lines.find(l => l.startsWith('CONSENSUS:'));
        const consensus = consensusLine ? consensusLine.replace('CONSENSUS:', '').trim() : "Analysis complete.";

        setParsedData({
            globalEconomy: getSection('GLOBAL_ECONOMY'),
            indianEconomy: getSection('INDIAN_ECONOMY'),
            tradeAndTariffs: getSection('TRADE_TARIFFS'),
            institutionalPulse: getSection('INSTITUTIONS'),
            overallConsensus: consensus,
            sources: currentSources
        });
    };

    useEffect(() => {
        loadMacroStream();
    }, []);

    const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
        const colors = {
            Bullish: 'bg-pro-green/10 text-pro-green border-pro-green/20',
            Bearish: 'bg-pro-red/10 text-pro-red border-pro-red/20',
            Neutral: 'bg-pro-primary/10 text-pro-primary border-pro-primary/20',
        };
        return (
            <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase rounded-lg ${colors[sentiment as keyof typeof colors] || colors.Neutral}`}>
                {sentiment}
            </span>
        );
    };

    const ImpactBadge = ({ level }: { level: string }) => {
        const colors = {
            High: 'text-pro-accent',
            Medium: 'text-pro-text',
            Low: 'text-pro-muted',
        };
        return <span className={`text-[10px] font-black uppercase ${colors[level as keyof typeof colors] || ''}`}>{level} IMPACT</span>;
    };

    const Section = ({ title, items, color }: { title: string, items: MacroSectorSentiment[], color: string }) => (
        <div className="bg-white border border-pro-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <div className={`px-5 py-3 border-b border-pro-border flex items-center justify-between bg-pro-surface`}>
                <h3 className={`text-[11px] font-black uppercase tracking-widest ${color}`}>{title}</h3>
            </div>
            <div className="divide-y divide-pro-border/40">
                {items.length > 0 ? items.map((item, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => handleDeepDive(item)}
                        className="p-5 hover:bg-pro-surface/50 transition-all cursor-pointer group active:scale-[0.99]"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-black text-pro-text uppercase tracking-tight group-hover:text-pro-primary transition-colors">{item.label}</span>
                            <div className="flex items-center space-x-3">
                                <ImpactBadge level={item.impactLevel} />
                                <SentimentBadge sentiment={item.sentiment} />
                            </div>
                        </div>
                        
                        <p className="text-[12px] text-pro-muted font-medium leading-relaxed mb-4">
                            {item.description}
                        </p>

                        <div className="bg-pro-surface/80 p-3 rounded-xl border-l-4 border-pro-primary mb-4 group-hover:border-pro-accent transition-all">
                            <span className="text-[9px] text-pro-primary font-black uppercase block mb-1">Impact Thesis</span>
                            <p className="text-[11px] text-pro-text font-bold uppercase italic">"{item.effects}"</p>
                        </div>

                        <div className="flex items-center justify-between">
                             <div className="flex flex-wrap gap-1.5">
                                {item.impactedStocks.slice(0, 3).map((stock, i) => (
                                    <span key={i} className={`text-[10px] font-black tracking-tight ${item.sentiment === 'Bullish' ? 'text-pro-green' : item.sentiment === 'Bearish' ? 'text-pro-red' : 'text-pro-primary'}`}>
                                        ${stock}
                                    </span>
                                ))}
                                {item.impactedStocks.length > 3 && <span className="text-[9px] text-pro-muted font-bold">+ {item.impactedStocks.length - 3} OTHER</span>}
                             </div>
                             <span className="text-[10px] text-pro-primary font-black opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 uppercase">
                                Deep Dive >>
                             </span>
                        </div>
                    </div>
                )) : (
                    <div className="p-12 text-center text-pro-muted text-[11px] font-bold uppercase tracking-widest opacity-40 italic">
                        Processing Sectoral Data...
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-8 font-sans h-full overflow-y-auto bg-pro-bg">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-pro-text uppercase tracking-tight flex items-center">
                        <BrainCircuitIcon className="w-8 h-8 mr-3 text-pro-primary" />
                        Macro Intelligence Matrix
                    </h2>
                    <p className="text-pro-muted text-xs mt-1 font-bold uppercase tracking-[0.2em]">Real-time correlation mapping for NSE / Global markets</p>
                </div>
                <button 
                    onClick={loadMacroStream}
                    disabled={isStreaming}
                    className="flex items-center px-6 py-3 bg-pro-primary text-white text-xs font-black uppercase rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                    <RefreshCwIcon className={`w-4 h-4 mr-2 ${isStreaming ? 'animate-spin' : ''}`} />
                    {isStreaming ? 'Synthesizing...' : 'Re-Scan Market'}
                </button>
            </header>

            {(isStreaming || (!parsedData && !error)) && (
                <div className="mb-10 bg-white border border-pro-border p-6 rounded-2xl shadow-soft relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-pro-surface">
                        <div className="h-full bg-pro-primary animate-progress" style={{ width: '40%' }}></div>
                    </div>
                    <h3 className="text-[10px] font-black text-pro-muted uppercase mb-4 tracking-widest flex items-center">
                        <span className="w-2 h-2 rounded-full bg-pro-red mr-2 animate-pulse"></span> Neural Link Active
                    </h3>
                    <div 
                        ref={terminalRef}
                        className="h-32 overflow-y-auto text-[11px] text-pro-text font-mono leading-relaxed bg-pro-surface p-4 rounded-xl custom-scrollbar"
                    >
                        {rawText || "Establishing connection to institutional news wires..."}
                        {isStreaming && <span className="inline-block w-2 h-4 bg-pro-primary animate-pulse ml-1"></span>}
                    </div>
                </div>
            )}

            {parsedData && (
                <div className="animate-fade-in space-y-10 pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-pro-primary text-white p-8 rounded-3xl shadow-heavy relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                            <h3 className="text-[10px] font-black uppercase mb-3 tracking-widest opacity-80">Global Consensus Analysis</h3>
                            <p className="text-lg font-bold leading-relaxed uppercase">
                                "{parsedData.overallConsensus}"
                            </p>
                        </div>
                        <div className="bg-white border border-pro-border p-8 rounded-3xl shadow-soft flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[11px] text-pro-muted uppercase font-black tracking-widest">Sentiment Risk Index</span>
                                <span className="text-[10px] text-pro-accent font-black uppercase bg-pro-accent/10 px-2 py-0.5 rounded-lg">Real-Time</span>
                            </div>
                            <div className="w-full h-5 bg-pro-surface rounded-full overflow-hidden relative border border-pro-border">
                                <div className="absolute inset-y-0 left-0 bg-pro-red/20 w-1/3"></div>
                                <div className="absolute inset-y-0 left-1/3 bg-pro-primary/20 w-1/3"></div>
                                <div className="absolute inset-y-0 right-0 bg-pro-green/20 w-1/3"></div>
                                <div className="absolute h-full w-1.5 bg-pro-primary left-1/2 -translate-x-1/2 shadow-xl animate-pulse"></div>
                            </div>
                            <div className="flex justify-between text-[9px] text-pro-muted font-black uppercase mt-2 tracking-widest">
                                <span>Risk-Off</span>
                                <span>Equilibrium</span>
                                <span>Risk-On</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Section title="Global Matrix" items={parsedData.globalEconomy} color="text-pro-primary" />
                        <Section title="Domestic Core" items={parsedData.indianEconomy} color="text-pro-green" />
                        <Section title="Trade & Policy" items={parsedData.tradeAndTariffs} color="text-pro-accent" />
                        <Section title="Institutional Feed" items={parsedData.institutionalPulse} color="text-pro-red" />
                    </div>
                </div>
            )}

            {sources.length > 0 && (
                <div className="mt-20 pt-10 border-t border-pro-border">
                    <h4 className="text-[11px] font-black text-pro-muted uppercase mb-6 tracking-widest flex items-center">
                        <LinkIcon className="w-4 h-4 mr-2" /> Verified Intelligence Grounding:
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {sources.map((source, idx) => (
                            <a 
                                key={idx} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-3 bg-white border border-pro-border rounded-xl text-[10px] text-pro-text font-bold hover:border-pro-primary hover:text-pro-primary transition-all shadow-sm"
                            >
                                <span className="line-clamp-1 uppercase">{source.title}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <MacroDeepDiveModal 
                isOpen={deepDiveOpen}
                onClose={() => setDeepDiveOpen(false)}
                label={selectedItem?.label || ""}
                description={selectedItem?.desc || ""}
                isLoading={deepDiveLoading}
                data={deepDiveData}
            />
        </div>
    );
};

export default MacroSentimentDashboard;