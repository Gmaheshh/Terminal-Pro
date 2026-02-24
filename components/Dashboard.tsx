import React, { useState, useEffect } from 'react';
import type { TabType, ProcessedStock, MarketRegime } from '../types';
import Tabs from './Tabs';
import MarketOverview from './MarketOverview';
import { RefreshCwIcon, LogOutIcon } from './Icons';
import { CATEGORIES, CATEGORY_MAP, MainCategory } from '../constants';

interface DashboardProps {
  activeCategory: MainCategory;
  setActiveCategory: (cat: MainCategory) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  totalScanned: number;
  errors: number;
  onRefresh: () => void;
  children: React.ReactNode;
  stocks: ProcessedStock[];
  regime: MarketRegime | null;
  commandValue: string;
  onCommandChange: (val: string) => void;
  userName?: string;
  onLogout: () => void;
  isKiteAuthenticated?: boolean;
  onKiteLogin?: () => void;
  onKiteLogout?: () => void;
  kiteUser?: any;
}

const Dashboard: React.FC<DashboardProps> = ({
  activeCategory,
  setActiveCategory,
  activeTab,
  setActiveTab,
  totalScanned,
  errors,
  onRefresh,
  children,
  stocks,
  regime,
  commandValue,
  onCommandChange,
  userName,
  onLogout,
  isKiteAuthenticated,
  onKiteLogin,
  onKiteLogout,
  kiteUser
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCatLabel = (cat: MainCategory) => {
      if (cat === 'Intelligence Hub') return '01. Intelligence (Morning News)';
      if (cat === 'Investing Tree') return '02. Investing (Wealth)';
      if (cat === 'Trading Tree') return '03. Trading (Active)';
      return cat;
  };

  return (
    <div className="flex flex-col h-screen bg-pro-bg overflow-hidden font-sans">
      {/* Primary Institutional Header */}
      <header className="bg-white border-b border-pro-border/60 px-8 py-3 flex-shrink-0 z-50">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <div className="flex items-center cursor-pointer group" onClick={() => setActiveCategory('Home')}>
              <h1 className="text-xl font-black tracking-tighter uppercase flex items-center">
                <span className="text-pro-red">PRA</span>
                <span className="text-pro-green">-GATI</span>
              </h1>
            </div>

            <nav className="hidden lg:flex items-center space-x-1">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg transition-all duration-300 whitespace-nowrap ${
                            activeCategory === cat 
                            ? 'bg-pro-primary text-white shadow-md' 
                            : 'text-pro-muted hover:text-pro-text hover:bg-pro-bg'
                        }`}
                    >
                        {getCatLabel(cat)}
                    </button>
                ))}
            </nav>
          </div>

          <div className="flex items-center space-x-8">
            <div className="hidden xl:block">
              <MarketOverview regime={regime} />
            </div>
            
            <div className="flex items-center space-x-3 pl-6 border-l border-pro-border/60">
              {/* Zerodha Kite Integration Button */}
              {isKiteAuthenticated ? (
                <div className="flex items-center space-x-2 bg-pro-green/10 px-3 py-1.5 rounded-xl border border-pro-green/20">
                  <div className="w-2 h-2 bg-pro-green rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-pro-green uppercase tracking-wider">Kite: {kiteUser?.user_name || 'Connected'}</span>
                  <button onClick={onKiteLogout} className="ml-2 text-pro-muted hover:text-pro-red transition-colors">
                    <LogOutIcon className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onKiteLogin}
                  className="flex items-center space-x-2 bg-[#ff5722] hover:bg-[#e64a19] text-white px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                >
                  <img src="https://kite.zerodha.com/static/images/kite-logo.svg" className="w-3 h-3 invert" alt="" />
                  <span>Connect Kite</span>
                </button>
              )}

              <button onClick={onRefresh} className="p-2 text-pro-muted hover:text-pro-primary hover:bg-pro-primary/5 rounded-xl transition-all" title="Refresh Matrix">
                <RefreshCwIcon className="w-4 h-4" />
              </button>
              <button onClick={onLogout} className="p-2 text-pro-muted hover:text-pro-red hover:bg-pro-red/5 rounded-xl transition-all" title="Logout">
                <LogOutIcon className="w-4 h-4" />
              </button>
              <div className="text-right hidden sm:block pl-4">
                <div className="text-[10px] font-black text-pro-text font-mono uppercase tracking-tighter">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-Navigation */}
      {activeCategory !== 'Home' && CATEGORY_MAP[activeCategory].length > 0 && (
          <div className="bg-white border-b border-pro-border/40 px-8 py-1 flex-shrink-0">
            <div className="max-w-[1800px] mx-auto flex items-center justify-between">
              <Tabs tabs={CATEGORY_MAP[activeCategory]} activeTab={activeTab} setActiveTab={setActiveTab} />
              <div className="flex items-center bg-pro-bg rounded-xl px-4 py-1.5 border border-pro-border">
                <svg className="w-3.5 h-3.5 text-pro-muted mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/></svg>
                <input 
                    type="text" 
                    value={commandValue}
                    onChange={(e) => onCommandChange(e.target.value)}
                    placeholder="QUERY MATRIX..."
                    className="bg-transparent border-none text-[10px] font-black text-pro-text focus:outline-none w-40 placeholder:text-pro-muted/50 uppercase tracking-widest"
                />
              </div>
            </div>
          </div>
      )}

      {/* Main Action Surface */}
      <main className="flex-1 overflow-hidden p-6 relative">
        <div className="max-w-[1800px] mx-auto h-full">
          <div className="bg-white rounded-[3rem] border border-pro-border shadow-soft h-full flex flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;