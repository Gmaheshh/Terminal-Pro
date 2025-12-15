import React, { useState, useEffect } from 'react';
import type { TabType, ProcessedStock, MarketRegime } from '../types';
import Tabs from './Tabs';
import MarketOverview from './MarketOverview';

interface DashboardProps {
  tabs: TabType[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  totalScanned: number;
  errors: number;
  onRefresh: () => void;
  children: React.ReactNode;
  stocks: ProcessedStock[];
  regime: MarketRegime | null; // Added prop
  commandValue: string;
  onCommandChange: (val: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  tabs,
  activeTab,
  setActiveTab,
  totalScanned,
  errors,
  onRefresh,
  children,
  stocks,
  regime,
  commandValue,
  onCommandChange
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Bloomberg Header / Command Bar */}
      <header className="bg-bb-dark border-b border-bb-orange shrink-0 flex flex-col">
        
        {/* Top Status Bar */}
        <div className="flex justify-between items-center px-2 py-1 bg-bb-black border-b border-bb-border text-[10px] font-mono text-bb-muted select-none">
             <div className="flex space-x-4">
                 <span>SYS: <span className="text-bb-green">ONLINE</span></span>
                 <span>USER: <span className="text-bb-blue">ADMIN</span></span>
                 <span>DATA_STREAM: <span className="text-bb-orange">LIVE</span></span>
             </div>
             <div className="text-bb-orange font-bold uppercase">
                {time.toLocaleDateString()} &nbsp; {time.toLocaleTimeString()}
             </div>
        </div>

        {/* Command Input Area */}
        <div className="px-4 py-3 flex items-center bg-bb-panel">
             <div className="mr-4 font-bold text-bb-orange font-mono text-sm whitespace-nowrap">
                <span className="animate-pulse mr-1">>></span> COMMAND:
             </div>
             <input 
                type="text" 
                value={commandValue}
                onChange={(e) => onCommandChange(e.target.value)}
                placeholder="Type 'NEWS', 'SIM', or Ticker to Filter..."
                className="w-full bg-bb-black border border-bb-border text-bb-orange font-mono text-sm px-3 py-1 focus:outline-none focus:border-bb-orange uppercase placeholder-bb-muted/50"
                autoFocus
             />
             <div className="ml-4 flex items-center">
                 <button 
                    onClick={onRefresh}
                    className="px-3 py-1 bg-bb-orange text-bb-black font-bold font-mono text-xs hover:bg-white transition-colors"
                 >
                    REFRESH
                 </button>
             </div>
        </div>

        {/* Market Widget & Tabs */}
        <div className="flex items-center bg-bb-black border-b border-bb-border h-12">
            <div className="pl-4 h-full py-1">
                <MarketOverview regime={regime} />
            </div>
            <div className="flex-1 overflow-hidden h-full flex items-center">
                 <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-bb-black pb-8">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20"></div>
        {children}
      </main>
    </div>
  );
};

export default Dashboard;