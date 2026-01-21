
import React, { useState, useEffect } from 'react';
import type { OpenAlgoConfig, OpenAlgoOrder, ProcessedStock } from '../types';
import { checkOpenAlgoConnection, placeOpenAlgoOrder, ConnectionResult } from '../services/openAlgoService';
import { RefreshCwIcon, BrainCircuitIcon, LinkIcon } from './Icons';

interface ForwardTesterProps {
    processedStocks: ProcessedStock[];
}

const ForwardTester: React.FC<ForwardTesterProps> = ({ processedStocks }) => {
    const [config, setConfig] = useState<OpenAlgoConfig>({
        apiUrl: 'http://127.0.0.1:5000',
        apikey: '',
        isSandbox: true,
        isActive: false
    });

    const [connResult, setConnResult] = useState<ConnectionResult | null>(null);
    const [orderLogs, setOrderLogs] = useState<OpenAlgoOrder[]>([]);
    const [diagLogs, setDiagLogs] = useState<string[]>(["[SYS] Terminal Initialized."]);
    const [sentTickers] = useState(new Set<string>()); 

    const addDiag = (msg: string) => {
        setDiagLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    const checkConnection = async () => {
        setConnResult(null);
        addDiag(`[NET] Probing bridge at ${config.apiUrl}...`);
        const res = await checkOpenAlgoConnection(config.apiUrl);
        setConnResult(res);
        if (res.ok) {
            addDiag(`[SYS] Connection established. Status: 200 OK`);
        } else {
            addDiag(`[ERR] Bridge unreachable. Reason: ${res.error || 'OFFLINE'}`);
        }
    };

    useEffect(() => {
        checkConnection();
    }, [config.apiUrl]);

    const sendTestOrder = async () => {
        if (!connResult?.ok) {
            addDiag(`[ERR] Cannot send test. Bridge is disconnected.`);
            return;
        }

        addDiag(`[TX] Sending test signal for RELIANCE...`);
        const testOrder: OpenAlgoOrder = {
            id: 'TEST-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
            timestamp: new Date().toLocaleTimeString(),
            ticker: 'RELIANCE',
            action: 'BUY',
            quantity: 1,
            strategy: 'CONNECTION_TEST',
            price: 0,
            status: 'PENDING'
        };

        setOrderLogs(prev => [testOrder, ...prev]);
        
        const res = await placeOpenAlgoOrder(
            { ...config, isActive: true }, 
            'RELIANCE', 'BUY', 1, 'CONNECTION_TEST'
        );

        if (res.status === 'SENT') {
            addDiag(`[OK] Signal accepted by OpenAlgo.`);
        } else {
            addDiag(`[REJ] Bridge rejected signal: ${res.response}`);
        }

        setOrderLogs(prev => prev.map(o => o.id === testOrder.id ? { ...o, ...res } : o));
    };

    useEffect(() => {
        if (!config.isActive || !connResult?.ok) return;

        processedStocks.forEach(stock => {
            const lastDate = stock.data.historical[stock.data.historical.length - 1].date;
            const signalKey = `${stock.ticker}-${lastDate}`;

            if (sentTickers.has(signalKey)) return;

            let action: 'BUY' | 'SELL' | null = null;
            let strategy = '';

            if (stock.signals.vwlmBuySignal) {
                action = 'BUY';
                strategy = 'VWLM_Alpha';
            } else if (stock.signals.volumeSignal === 'Spike' && stock.signals.trendSignal === 'Uptrend') {
                action = 'BUY';
                strategy = 'Vol_Breakout';
            }

            if (action) {
                const qty = stock.signals.suggestedShares || 1;
                const newOrder: OpenAlgoOrder = {
                    id: Math.random().toString(36).substr(2, 9).toUpperCase(),
                    timestamp: new Date().toLocaleTimeString(),
                    ticker: stock.ticker,
                    action: action,
                    quantity: qty,
                    strategy: strategy,
                    price: stock.data.currentPrice,
                    status: 'PENDING'
                };

                addDiag(`[TX] Propagating ${action} signal for ${stock.ticker}...`);
                setOrderLogs(prev => [newOrder, ...prev]);
                sentTickers.add(signalKey);

                placeOpenAlgoOrder(config, stock.ticker, action, qty, strategy)
                    .then(res => {
                        setOrderLogs(prev => prev.map(o => o.id === newOrder.id ? { ...o, ...res } : o));
                    });
            }
        });
    }, [processedStocks, config.isActive, connResult]);

    const isConnected = connResult?.ok;
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isMismatched = isHttps && config.apiUrl.startsWith('http:');

    return (
        <div className="p-6 font-mono h-full overflow-y-auto bg-bb-black space-y-6">
            <header className="border-b border-bb-orange pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-bb-orange uppercase tracking-wider">>> FORWARD_TESTING_BRIDGE</h2>
                        <p className="text-bb-muted text-[10px] mt-1 italic uppercase tracking-tighter">Real-Time Algorithmic Execution Hub</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center px-3 py-1 border text-[10px] font-bold uppercase transition-all ${isConnected ? 'bg-bb-green/20 border-bb-green text-bb-green shadow-[0_0_10px_rgba(0,255,0,0.2)]' : 'bg-bb-red/20 border-bb-red text-bb-red'}`}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-bb-green animate-pulse' : 'bg-bb-red'}`}></div>
                            {connResult === null ? 'PROBING...' : isConnected ? 'BRIDGE_LINK_ESTABLISHED' : 'BRIDGE_DISCONNECTED'}
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Configuration & Security Wizard */}
                <div className="lg:col-span-4 space-y-4">
                    
                    {isMismatched && !isConnected && (
                        <div className="bg-bb-panel border-2 border-bb-red p-4 space-y-3 shadow-[0_0_20px_rgba(255,51,51,0.2)]">
                            <h3 className="text-xs font-bold text-bb-red uppercase flex items-center blink">
                                ⚠️ SECURITY UNLOCK REQUIRED
                            </h3>
                            <div className="text-[10px] text-bb-text leading-relaxed">
                                Chrome is blocking the link to your local PC. Follow these steps:
                                <ol className="mt-2 list-decimal pl-4 space-y-2">
                                    <li>In the browser URL bar, click the <strong className="text-bb-blue">Lock Icon 🔒</strong> on the left.</li>
                                    <li>Select <strong className="text-bb-blue">"Site Settings"</strong>.</li>
                                    <li>Scroll to <strong className="text-white">"Insecure Content"</strong> and set it to <strong className="text-bb-green">"Allow"</strong>.</li>
                                    <li>Return here and <strong className="text-bb-orange">Refresh (Cmd+R)</strong> the page.</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    <div className={`bg-bb-panel border ${isMismatched ? 'border-bb-orange animate-pulse' : 'border-bb-border'} p-5 space-y-4 transition-colors`}>
                        <h3 className="text-xs font-bold text-white uppercase border-b border-bb-border pb-2 flex items-center">
                            <BrainCircuitIcon className="w-4 h-4 mr-2" /> Protocol Settings
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] text-bb-muted uppercase mb-1 block">Local Bridge URL</label>
                                <input 
                                    type="text" 
                                    value={config.apiUrl} 
                                    onChange={(e) => setConfig({...config, apiUrl: e.target.value})}
                                    className="w-full bg-bb-black border border-bb-border text-bb-blue text-xs p-2 outline-none focus:border-bb-orange"
                                    placeholder="http://127.0.0.1:5000"
                                />
                                <p className="text-[9px] text-bb-muted mt-1 italic">Use '127.0.0.1' instead of 'localhost' for better reliability.</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-bb-muted uppercase mb-1 block">OpenAlgo API Key</label>
                                <input 
                                    type="password" 
                                    value={config.apikey} 
                                    onChange={(e) => setConfig({...config, apikey: e.target.value})}
                                    className="w-full bg-bb-black border border-bb-border text-bb-text text-xs p-2 outline-none focus:border-bb-orange"
                                    placeholder="Enter API Key..."
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <span className="text-[10px] text-bb-muted uppercase tracking-tighter">Account Mode:</span>
                                <button 
                                    onClick={() => setConfig({...config, isSandbox: !config.isSandbox})}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase border transition-all ${config.isSandbox ? 'border-bb-blue text-bb-blue bg-bb-blue/10' : 'border-bb-red text-bb-red bg-bb-red/10'}`}
                                >
                                    {config.isSandbox ? 'INTERNAL_PAPER' : 'LIVE_EXCHANGE'}
                                </button>
                            </div>

                            <button 
                                onClick={() => setConfig({...config, isActive: !config.isActive})}
                                disabled={!isConnected}
                                className={`w-full py-3 text-xs font-bold uppercase transition-all border ${config.isActive ? 'bg-bb-red text-bb-black border-bb-red shadow-[0_0_15px_rgba(255,51,51,0.3)]' : 'bg-bb-green text-bb-black border-bb-green shadow-[0_0_15px_rgba(0,255,0,0.3)]'} disabled:opacity-30`}
                            >
                                {config.isActive ? 'DEACTIVATE_AUTO_TRANSMIT' : 'ACTIVATE_SYNC'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-bb-dark border border-bb-border p-4 flex flex-col h-32 overflow-hidden">
                        <h4 className="text-[9px] font-bold text-bb-muted uppercase mb-1 border-b border-bb-border pb-1">Network Diagnostics</h4>
                        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px] space-y-0.5">
                            {diagLogs.map((log, i) => (
                                <div key={i} className={log.includes('[ERR]') ? 'text-bb-red' : log.includes('[OK]') ? 'text-bb-green' : 'text-bb-muted'}>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Transmission Ledger */}
                <div className="lg:col-span-8 flex flex-col h-[600px] border border-bb-border bg-bb-dark">
                    <div className="bg-bb-panel px-4 py-2 border-b border-bb-border flex justify-between items-center">
                        <h3 className="text-xs font-bold text-bb-orange uppercase tracking-wider">📦 Transmission Ledger</h3>
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={sendTestOrder}
                                disabled={!isConnected}
                                className="text-[9px] font-bold text-bb-blue hover:underline uppercase disabled:opacity-30"
                            >
                                [ SEND_TEST_RELIANCE ]
                            </button>
                            <button onClick={checkConnection} className="text-bb-muted hover:text-white transition-colors">
                                <RefreshCwIcon className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {orderLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-2">
                                <LinkIcon className="w-8 h-8 text-bb-muted/20" />
                                <div className="text-bb-muted text-[10px] uppercase italic tracking-widest">
                                    Awaiting Upstream Signal Propagation...
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left text-[10px] border-collapse">
                                <thead className="bg-bb-black text-bb-muted uppercase sticky top-0 border-b border-bb-border z-10">
                                    <tr>
                                        <th className="p-3 font-normal">ID</th>
                                        <th className="p-3 font-normal">Ticker</th>
                                        <th className="p-3 font-normal">Signal</th>
                                        <th className="p-3 font-normal">Qty</th>
                                        <th className="p-3 font-normal">Strategy</th>
                                        <th className="p-3 font-normal text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bb-border/30">
                                    {orderLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-bb-panel/30 transition-colors">
                                            <td className="p-3 text-bb-muted">{log.id}</td>
                                            <td className="p-3 font-bold text-bb-blue">{log.ticker}</td>
                                            <td className={`p-3 font-bold ${log.action === 'BUY' ? 'text-bb-green' : 'text-bb-red'}`}>{log.action}</td>
                                            <td className="p-3">{log.quantity}</td>
                                            <td className="p-3 text-bb-orange">{log.strategy}</td>
                                            <td className="p-3 text-right">
                                                <div className="group relative inline-block">
                                                    <span className={`px-2 py-0.5 rounded-sm font-bold text-[8px] cursor-help ${
                                                        log.status === 'SENT' ? 'bg-bb-green text-black' :
                                                        log.status === 'FAILED' ? 'bg-bb-red text-white' :
                                                        log.status === 'REJECTED' ? 'bg-bb-orange text-black' :
                                                        'bg-bb-panel text-bb-muted'
                                                    }`}>
                                                        {log.status}
                                                    </span>
                                                    {log.response && (
                                                        <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-50 bg-bb-black border border-bb-border p-2 w-48 shadow-xl text-[9px] text-white">
                                                            {log.response}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForwardTester;
