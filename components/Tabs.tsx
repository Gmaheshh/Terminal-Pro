import React from 'react';
import type { TabType } from '../types';

interface TabsProps {
  tabs: TabType[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <nav className="flex overflow-x-auto custom-scrollbar py-1 space-x-1" aria-label="Tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`
            whitespace-nowrap px-4 py-2 text-[12px] font-semibold tracking-tight rounded-xl transition-all duration-300
            ${
              activeTab === tab
                ? 'bg-pro-primary text-white shadow-sm shadow-pro-primary/20'
                : 'bg-transparent text-pro-muted hover:text-pro-text hover:bg-pro-bg'
            }
          `}
          aria-current={activeTab === tab ? 'page' : undefined}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

export default Tabs;