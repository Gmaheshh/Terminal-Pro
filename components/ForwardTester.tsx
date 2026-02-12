
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { 
    ProcessedStock, PaperAccount, PaperOrder, 
    PaperTrade, PaperPosition
} from '../types';
import { simulateFill, updatePosition } from '../services/paperTradingService';
import { loadPaperState, savePaperState, clearPaperState } from '../services/persistenceService';
import { RefreshCwIcon, TrashIcon } from './Icons';

interface ForwardTesterProps {
    processedStocks: ProcessedStock[];
}

const RISK_PER_TRADE_INR = 2000; 

const ForwardTester: React.FC<ForwardTesterProps> = ({ processedStocks }) => {
    const [activeSubTab, setActiveSubTab] = useState<'TERMINAL' | 'POSITIONS' | 'ORDERBOOK' | 'HISTORY'>('TERMINAL');
    const [autoTransmit, setAutoTransmit] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    // --- PAPER TRADING STATE ---
    const [account, setAccount] = useState<PaperAccount>({
        startingCapital: 100000,
        cashBalance: 100000,
        usedMargin: 0,
        totalEquity: 100000,
        lastUpdated: new Date().toLocaleTimeString()
    });

    const [orders, setOrders] = useState<PaperOrder[]>([]);
    const [trades, setTrades] = useState<PaperTrade[]>([]);
    const [positions, setPositions] = useState<PaperPosition[]>([]);
    const [diagLogs, setDiagLogs] = useState<string[]>([]);
    const [processedSignals, setProcessedSignals] = useState<Set<string>>(new Set());

    // --- HYDRATION ---
    useEffect(() => {
        const saved = loadPaperState();
        if (saved) {
            if (saved.account) setAccount(saved.account);
            setOrders(saved.orders);
            setTrades(saved.trades);
            setPositions(saved.positions);
            setDiagLogs(saved.logs);

            const signals = new Set<string>();
            saved.orders.forEach((o: PaperOrder) => {
                if (o.strategy !== 'MANUAL_ENTRY') {
                    const datePart = o.timestamp.split(' ')[0].includes('-') ? o.timestamp.split(' ')[0] : 'LEGACY';
                    signals.add(`${o.ticker}-${datePart}`);
                }
            });
            setProcessedSignals(signals);
        }
        setIsHydrated(true);
    }, []);

    // --- PERSISTENCE SYNC ---
    useEffect(() => {
        if (!isHydrated) return;
        savePaperState({
            account,
            orders,
            trades,
            positions,
            logs: diagLogs
        });
    }, [account, orders, trades, positions, diagLogs, isHydrated]);

    const addDiag = (msg: string) => {
        setDiagLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
    };

    // --- LATEST MARKET DATES (2-DAY WINDOW) ---
    const latestMarketDates = useMemo(() => {
        if (processedStocks.length === 0) return new Set<string>();
        const allDates = new Set<string>();
        processedStocks.forEach(s => {
            s.data.historical.slice(-5).forEach(h => allDates.add(h.date));
        });
        const sorted = Array.from(allDates).sort().reverse();
        return new Set(sorted.slice(0, 2)); 
    }, [processedStocks]);

    // --- EXECUTION SIMULATOR & AUTO-EXIT MONITOR ---
    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Simulate Order Fills
            setOrders(prevOrders => {
                let updated = false;
                const nextOrders = prevOrders.map(order => {
                    if (order.status !== 'CONFIRMED') return order;
                    const stock = processedStocks.find(s => s.ticker === order.ticker);
                    if (!stock) return order;

                    const fill = simulateFill(order, stock.data.currentPrice, 5); 
                    if (fill) {
                        updated = true;
                        handleFill(order, fill);
                        return { ...order, status: 'FILLED' as const };
                    }
                    return order;
                });
                return updated ? nextOrders : prevOrders;
            });

            // 2. Monitor Positions for Exits (SL, TP, Signal Reversal)
            setPositions(prev => prev.map(pos => {
                const stock = processedStocks.find(s => s.ticker === pos.ticker);
                if (!stock) return pos;

                const currentPrice = stock.data.currentPrice;
                const upnl = (currentPrice - pos.avgPrice) * pos.quantity;

                // Auto-Exit Logic (Matches Backtest)
                if (autoTransmit && pos.quantity > 0) {
                    let exitTriggered = false;
                    let exitReason = "";

                    if (pos.stopLoss && currentPrice <= pos.stopLoss) {
                        exitTriggered = true;
                        exitReason = "SL_HIT";
                    } else if (pos.target && currentPrice >= pos.target) {
                        exitTriggered = true;
                        exitReason = "TP_HIT";
                    } else if (pos.strategy === 'VWLM_ALPHA' && stock.signals.vwlmSellSignal) {
                        exitTriggered = true;
                        exitReason = "SIGNAL_REVERSAL";
                    }

                    if (exitTriggered) {
                        placeExitOrder(pos.ticker, pos.quantity, exitReason);
                        // We mark as reducing to prevent duplicate exit orders
                        return { ...pos, lastPrice: currentPrice, unrealizedPnl: upnl, quantity: 0 }; 
                    }
                }

                return { ...pos, lastPrice: currentPrice, unrealizedPnl: upnl };
            }).filter(p => p.quantity !== 0));

        }, 1000);
        return () => clearInterval(interval);
    }, [processedStocks, autoTransmit]);

    const handleFill = (order: PaperOrder, fill: PaperTrade) => {
        setTrades(prev => [fill, ...prev]);
        setPositions(prev => {
            const existing = prev.find(p => p.ticker === fill.ticker);
            const updated = updatePosition(existing, fill);
            
            // If it's a new entry (Long), attach the SL/TP from the original order
            if (!existing && fill.action === 'BUY') {
                updated.stopLoss = order.stopLoss;
                updated.target = order.target;
                updated.strategy = order.strategy;
            }

            if (updated.quantity === 0) return prev.filter(p => p.ticker !== fill.ticker);
            if (existing) return prev.map(p => p.ticker === fill.ticker ? updated : p);
            return [...prev, updated];
        });
        addDiag(`[FILL] ${fill.ticker} ${fill.action} ${fill.quantity} @ ₹${fill.price.toFixed(2)}`);
    };

    const placeNewOrder = (ticker: string, qty: number, strategy: string = 'MANUAL_ENTRY', signalDate: string = '', sl?: number, tp?: number) => {
        const id = 'ORD-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        const newOrder: PaperOrder = {
            id, ticker, action: 'BUY', quantity: qty, orderType: 'MARKET', 
            status: 'CONFIRMED', 
            timestamp: `${signalDate || new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString()}`, 
            strategy,
            stopLoss: sl,
            target: tp
        };
        setOrders(prev => [newOrder, ...prev]);
        addDiag(`[ORDER] Routing ${ticker} LONG (${strategy})...`);
    };

    const placeExitOrder = (ticker: string, qty: number, reason: string) => {
        const id = 'ORD-EXIT-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        const newOrder: PaperOrder = {
            id, ticker, action: 'SELL', quantity: qty, orderType: 'MARKET', 
            status: 'CONFIRMED', 
            timestamp: new Date().toLocaleTimeString(), 
            strategy: `EXIT_${reason}`
        };
        setOrders(prev => [newOrder, ...prev]);
        addDiag(`[AUTO-EXIT] ${ticker} Liquidated: ${reason}`);
    };

    // --- AUTO-SIGNAL PROCESSOR (LONG ONLY + 2-DAY WINDOW) ---
    useEffect(() => {
        if (!autoTransmit || latestMarketDates.size === 0) return;
        
        processedStocks.forEach(stock => {
            const sig = stock.signals;
            const ind = stock.indicators;
            const lastIdx = stock.data.historical.length - 1;
            const lastData = stock.data.historical[lastIdx];

            const signalDates = [sig.vwlmBuySignalDate, sig.volumeSpikeSignalDate].filter(d => d && latestMarketDates.has(d));

            if (signalDates.length === 0) return;

            const activeDate = signalDates[0];
            const signalKey = `${stock.ticker}-${activeDate}`;
            if (processedSignals.has(signalKey)) return;

            let strategy = "";
            if (sig.vwlmBuySignal && sig.vwlmBuySignalDate === activeDate) strategy = "VWLM_ALPHA";
            else if (sig.volumeSignal === 'Spike' && sig.volumeSpikeSignalDate === activeDate && sig.trendSignal === 'Uptrend') strategy = "VOL_BREAKOUT";

            if (strategy) {
                const atr7 = ind.atr7[lastIdx] || 1;
                const stopLossMult = strategy === "VOL_BREAKOUT" ? 2.5 : 2.0;
                const tpMult = strategy === "VOL_BREAKOUT" ? 3.0 : 4.0; // 1:3 for Vol, 4xATR for VWLM
                
                const entryPrice = lastData.close;
                const stopLoss = entryPrice - (stopLossMult * atr7);
                const riskPerShare = entryPrice - stopLoss;
                const target = strategy === "VOL_BREAKOUT" ? entryPrice + (riskPerShare * 3) : entryPrice + (tpMult * atr7);
                
                if (riskPerShare > 0) {
                    const qty = Math.floor(RISK_PER_TRADE_INR / riskPerShare) || 1;
                    setProcessedSignals(prev => new Set(prev).add(signalKey));
                    placeNewOrder(stock.ticker, qty, strategy, activeDate, stopLoss, target);
                    addDiag(`[AUTO] 2-Day Signal Captured: ${stock.ticker} @ ${activeDate}`);
                }
            }
        });
    }, [processedStocks, autoTransmit, latestMarketDates, processedSignals]);

    const totalPnL = useMemo(() => {
        const realized = positions.reduce((acc, p) => acc + p.realizedPnl, 0);
        const unrealized = positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
        return { realized, unrealized, total: realized + unrealized };
    }, [positions]);

    const handleReset = () => {
        if (confirm(">> WARNING: WIPE PERSISTENT PAPER LEDGER?")) clearPaperState();
    };

    return (
        <div className="flex flex-col h-full bg-bb-black font-mono">
            {/* Header */}
            <div className="bg-bb-panel border-b border-bb-border p-4 flex justify-between items-center shrink-0">
                <div className="flex space-x-10">
                    <Stat label="PERSISTENT EQUITY" value={`₹${(account.startingCapital + totalPnL.total).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color="text-white" />
                    <Stat label="REALIZED P&L" value={`₹${totalPnL.realized.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color={totalPnL.realized >= 0 ? 'text-bb-green' : 'text-bb-red'} />
                    <Stat label="UNREALIZED" value={`₹${totalPnL.unrealized.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color={totalPnL.unrealized >= 0 ? 'text-bb-green' : 'text-bb-red'} />
                    <Stat label="AUTO_EXIT" value={autoTransmit ? "ACTIVE" : "PAUSED"} color={autoTransmit ? "text-bb-green" : "text-bb-red"} />
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={handleReset} className="p-2 border border-bb-red text-bb-red hover:bg-bb-red hover:text-black transition-all">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-bb-muted uppercase">ENGINE: <span className="text-bb-green">AUTO_SYNC_MOD</span></span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex bg-bb-dark border-b border-bb-border">
                {['TERMINAL', 'POSITIONS', 'ORDERBOOK', 'HISTORY'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveSubTab(tab as any)}
                        className={`px-8 py-3 text-[10px] font-bold uppercase transition-all border-r border-bb-border ${activeSubTab === tab ? 'bg-bb-orange text-black' : 'text-bb-muted hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                {activeSubTab === 'TERMINAL' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-4 space-y-4">
                             <div className="bg-bb-panel border border-bb-border p-4 shadow-xl">
                                <h3 className="text-[10px] font-bold text-bb-orange uppercase mb-4 tracking-widest border-b border-bb-border pb-2 flex justify-between">
                                    <span>>> MANUAL_OVERRIDE</span>
                                    <span className="text-bb-muted font-normal text-[8px]">LONG_ONLY</span>
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[9px] text-bb-muted uppercase block mb-1">Ticker</label>
                                        <input type="text" placeholder="E.G. RELIANCE" className="w-full bg-bb-black border border-bb-border p-2 text-xs uppercase text-bb-blue outline-none focus:border-bb-orange" id="manual_ticker" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-bb-muted uppercase block mb-1">Quantity</label>
                                        <input type="number" placeholder="10" className="w-full bg-bb-black border border-bb-border p-2 text-xs text-white outline-none focus:border-bb-orange" id="manual_qty" />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const t = (document.getElementById('manual_ticker') as HTMLInputElement).value.toUpperCase();
                                            const q = parseInt((document.getElementById('manual_qty') as HTMLInputElement).value);
                                            if(t && q) placeNewOrder(t, q);
                                        }}
                                        className="w-full bg-bb-green/10 border border-bb-green text-bb-green font-bold py-3 hover:bg-bb-green hover:text-black transition-all uppercase text-[10px]"
                                    >EXECUTE BUY ORDER</button>
                                </div>
                             </div>

                             <div className="bg-bb-dark border border-bb-border p-4 h-64 flex flex-col">
                                <h4 className="text-[9px] font-bold text-bb-muted uppercase mb-2 border-b border-bb-border pb-1">Engine Log</h4>
                                <div className="flex-1 overflow-y-auto text-[9px] space-y-1.5 custom-scrollbar">
                                    {diagLogs.map((log, i) => (
                                        <div key={i} className={log.includes('[FILL]') ? 'text-bb-green' : log.includes('[AUTO]') ? 'text-bb-blue' : log.includes('[AUTO-EXIT]') ? 'text-bb-orange' : 'text-bb-muted'}>
                                            {log}
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>

                        <div className="lg:col-span-8 bg-bb-panel border border-bb-border p-6 flex flex-col justify-between">
                             <div>
                                <h3 className="text-[10px] font-bold text-bb-blue uppercase mb-4 tracking-widest">>> AUTO_EXIT_CRITERIA</h3>
                                <p className="text-[11px] text-bb-text uppercase leading-relaxed mb-6 opacity-70">
                                    This engine mirrors the <span className="text-bb-orange font-bold">BACKTEST_PROTOCOL</span>. When Auto-Sync is engaged, positions will close automatically under three conditions: 
                                    (1) Price touches the 2.5x/2.0x ATR Stop Loss, (2) Price touches the Profit Target, or (3) A Strategy Reversal signal occurs.
                                </p>
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="bg-bb-black border border-bb-border p-4 text-center">
                                        <span className="text-[8px] text-bb-muted block mb-1 uppercase">Exit Type A</span>
                                        <span className="text-xs text-bb-red font-bold">SL (ATR-BASED)</span>
                                    </div>
                                    <div className="bg-bb-black border border-bb-border p-4 text-center">
                                        <span className="text-[8px] text-bb-muted block mb-1 uppercase">Exit Type B</span>
                                        <span className="text-xs text-bb-green font-bold">TP (1:3 RISK)</span>
                                    </div>
                                    <div className="bg-bb-black border border-bb-border p-4 text-center">
                                        <span className="text-[8px] text-bb-muted block mb-1 uppercase">Exit Type C</span>
                                        <span className="text-xs text-bb-blue font-bold">SIGNAL_FLIP</span>
                                    </div>
                                </div>
                             </div>

                             <button 
                                onClick={() => setAutoTransmit(!autoTransmit)}
                                className={`w-full py-6 font-bold border-2 uppercase transition-all tracking-[0.3em] ${autoTransmit ? 'bg-bb-red/20 border-bb-red text-bb-red shadow-[0_0_20px_rgba(255,0,0,0.2)]' : 'bg-bb-green/20 border-bb-green text-bb-green shadow-[0_0_20px_rgba(0,255,0,0.2)]'}`}
                             >
                                {autoTransmit ? '>> HALT AUTO-SYNC <<' : '>> ENGAGE AUTO-SYNC <<'}
                             </button>
                        </div>
                    </div>
                )}

                {activeSubTab === 'POSITIONS' && (
                    <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-bb-dark text-bb-muted border-b border-bb-border uppercase sticky top-0">
                            <tr>
                                <th className="p-4 font-normal">Instrument</th>
                                <th className="p-4 text-right font-normal">Qty</th>
                                <th className="p-4 text-right font-normal">Stop Loss</th>
                                <th className="p-4 text-right font-normal">Target</th>
                                <th className="p-4 text-right font-normal">P&L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-bb-border/30">
                            {positions.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-bb-muted uppercase italic">No Open Exposure</td></tr>
                            ) : positions.map(pos => (
                                <tr key={pos.ticker} className="hover:bg-bb-panel/50">
                                    <td className="p-4 font-bold text-bb-blue">{pos.ticker}</td>
                                    <td className="p-4 text-right font-bold text-bb-green">{pos.quantity}</td>
                                    <td className="p-4 text-right text-bb-red">₹{pos.stopLoss?.toFixed(2) || '-'}</td>
                                    <td className="p-4 text-right text-bb-green">₹{pos.target?.toFixed(2) || '-'}</td>
                                    <td className={`p-4 text-right font-bold ${pos.unrealizedPnl >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>
                                        ₹{pos.unrealizedPnl.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeSubTab === 'ORDERBOOK' && (
                    <table className="w-full text-left text-[11px] border-collapse">
                         <thead className="bg-bb-dark text-bb-muted border-b border-bb-border uppercase sticky top-0">
                            <tr>
                                <th className="p-4 font-normal">Order ID</th>
                                <th className="p-4 font-normal">Instrument</th>
                                <th className="p-4 font-normal text-right">Qty</th>
                                <th className="p-4 font-normal text-right">Strategy</th>
                                <th className="p-4 text-right font-normal">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-bb-border/30">
                            {orders.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-bb-muted uppercase italic">Order Queue Empty</td></tr>
                            ) : orders.map(order => (
                                <tr key={order.id} className="hover:bg-bb-panel/50">
                                    <td className="p-4 text-bb-muted">{order.id}</td>
                                    <td className="p-4 font-bold text-white">{order.ticker}</td>
                                    <td className="p-4 text-right text-bb-green">{order.quantity}</td>
                                    <td className="p-4 text-right text-bb-blue">{order.strategy}</td>
                                    <td className="p-4 text-right">
                                        <span className={`px-2 py-0.5 border text-[9px] font-bold ${
                                            order.status === 'FILLED' ? 'border-bb-green text-bb-green bg-bb-green/10' :
                                            'border-bb-orange text-bb-orange bg-bb-orange/10'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeSubTab === 'HISTORY' && (
                    <table className="w-full text-left text-[11px] border-collapse">
                         <thead className="bg-bb-dark text-bb-muted border-b border-bb-border uppercase sticky top-0">
                            <tr>
                                <th className="p-4 font-normal">Trade ID</th>
                                <th className="p-4 font-normal">Time</th>
                                <th className="p-4 font-normal">Instrument</th>
                                <th className="p-4 text-right font-normal">Price</th>
                                <th className="p-4 text-right font-normal">Charges</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-bb-border/30">
                            {trades.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-bb-muted uppercase italic">No Trade History</td></tr>
                            ) : trades.map(trade => (
                                <tr key={trade.id} className="hover:bg-bb-panel/50">
                                    <td className="p-4 text-bb-muted">{trade.id}</td>
                                    <td className="p-4 text-bb-muted">{trade.timestamp}</td>
                                    <td className="p-4 font-bold text-white">{trade.ticker}</td>
                                    <td className="p-4 text-right">₹{trade.price.toFixed(2)}</td>
                                    <td className="p-4 text-right text-bb-red">₹{trade.charges.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const Stat: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
    <div className="flex flex-col">
        <span className="text-[8px] text-bb-muted uppercase tracking-tighter mb-0.5">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
);

export default ForwardTester;
