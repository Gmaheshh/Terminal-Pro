import React from 'react';
import type { TabType } from '../types';

interface TabsProps {
  tabs: TabType[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <nav className="flex overflow-x-auto custom-scrollbar" aria-label="Tabs">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`
            whitespace-nowrap py-2 px-4 font-mono text-xs uppercase tracking-wider transition-colors focus:outline-none border-r border-bb-border
            ${
              activeTab === tab
                ? 'bg-bb-orange text-bb-black font-bold'
                : 'bg-bb-black text-bb-muted hover:text-bb-orange hover:bg-bb-panel'
            }
          `}
          aria-current={activeTab === tab ? 'page' : undefined}
        >
          {index + 1}. {tab}
        </button>
      ))}
    </nav>
  );
};

export default Tabs;