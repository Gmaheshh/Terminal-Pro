import React, { useState, useMemo } from 'react';
import type { EmaSignalResult } from '../types';
import { EMA_DASHBOARD_COLUMNS } from '../constants';
import EmaTable from './EmaTable';

interface EmaDashboardProps {
  data: EmaSignalResult[];
}

const EmaDashboard: React.FC<EmaDashboardProps> = ({ data }) => {
  const [showOnlySignals, setShowOnlySignals] = useState(true);

  const filteredData = useMemo(() => {
    if (showOnlySignals) {
      return data.filter(d => d.signal !== 'HOLD');
    }
    return data;
  }, [data, showOnlySignals]);

  const columns = useMemo(() => EMA_DASHBOARD_COLUMNS(), []);

  return (
    <div>
        <div className="p-4 bg-gray-800 border-b border-t border-gray-700 flex items-center justify-between">
            <div>
                 <h3 className="font-semibold text-gray-200">EMA Crossover Dashboard</h3>
                 <p className="text-sm text-gray-400">Signals based on EMA 9/13 crossover, MACD, and RSI momentum.</p>
            </div>
            <div className="flex items-center">
                <label htmlFor="signal-toggle" className="mr-3 text-sm font-medium text-gray-300">Show only BUY/SELL</label>
                <button
                    type="button"
                    className={`${showOnlySignals ? 'bg-cyan-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
                    role="switch"
                    aria-checked={showOnlySignals}
                    onClick={() => setShowOnlySignals(!showOnlySignals)}
                    id="signal-toggle"
                >
                    <span
                        aria-hidden="true"
                        className={`${showOnlySignals ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                </button>
            </div>
        </div>
        <EmaTable columns={columns} data={filteredData} />
    </div>
  );
};

export default EmaDashboard;
