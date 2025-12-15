import React, { useState } from 'react';
import type { Sentiment, TechnicalInsight, SignalFactors } from '../types';
import { XIcon, LinkIcon, BrainCircuitIcon, ListIcon } from './Icons';
import { Loader } from './Loader';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string | null;
  sentiment: Sentiment | null;
  technicalThesis: TechnicalInsight | null;
  factors?: SignalFactors; // Optional factor data passed in
  activeTab: 'sentiment' | 'thesis';
  setActiveTab: (tab: 'sentiment' | 'thesis') => void;
  isLoading: boolean;
}

const ProgressBar: React.FC<{ label: string, value: number, colorClass: string }> = ({ label, value, colorClass }) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs font-mono uppercase mb-1">
            <span className="text-bb-muted">{label}</span>
            <span className="text-white font-bold">{value}%</span>
        </div>
        <div className="w-full bg-bb-black h-2 border border-bb-border">
            <div 
                className={`h-full ${colorClass} transition-all duration-500 ease-out`} 
                style={{ width: `${value}%` }}
            />
        </div>
    </div>
);

const AnalysisModal: React.FC<AnalysisModalProps> = ({ 
    isOpen, 
    onClose, 
    ticker, 
    sentiment, 
    technicalThesis, 
    factors,
    activeTab, 
    setActiveTab, 
    isLoading 
}) => {
  if (!isOpen) return null;

  const getSentimentColor = (val: string) => {
    switch (val) {
      case 'Bullish': return 'text-bb-green';
      case 'Bearish': return 'text-bb-red';
      case 'Neutral': return 'text-bb-text';
      default: return 'text-bb-orange';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-mono"
      onClick={onClose}
    >
      <div
        className="bg-bb-black w-full max-w-2xl border-2 border-bb-orange shadow-[0_0_20px_rgba(255,153,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-bb-orange text-bb-black flex justify-between items-center px-3 py-1 font-bold">
          <span>AI_ANALYSIS_MATRIX_V2.0</span>
          <button onClick={onClose} className="hover:bg-bb-black hover:text-bb-orange px-1 transition-colors">
            [X]
          </button>
        </div>
        
        <div className="flex border-b border-bb-border">
            <button 
                onClick={() => setActiveTab('sentiment')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === 'sentiment' ? 'bg-bb-panel text-bb-orange' : 'text-bb-muted hover:text-white'}`}
            >
                <span className="mr-2">MACRO SENTIMENT</span>
                {activeTab === 'sentiment' && <span className="text-bb-orange">●</span>}
            </button>
            <button 
                onClick={() => setActiveTab('thesis')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === 'thesis' ? 'bg-bb-panel text-bb-orange' : 'text-bb-muted hover:text-white'}`}
            >
                <span className="mr-2">QUANT THESIS</span>
                {activeTab === 'thesis' && <span className="text-bb-orange">●</span>}
            </button>
        </div>

        <div className="p-6 min-h-[300px]">
          <div className="border-b border-bb-border pb-4 mb-4 flex justify-between items-end">
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Target: <span className="text-bb-blue">{ticker}</span></h2>
              {isLoading && <span className="text-bb-orange text-xs animate-pulse">PROCESSING DATA STREAM...</span>}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader className="w-12 h-12 text-bb-orange" />
                <p className="mt-4 text-bb-orange text-xs blink">RUNNING NEURAL NETWORKS...</p>
            </div>
          ) : (
            <>
                {activeTab === 'sentiment' && sentiment && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center space-x-4 p-3 bg-bb-dark border border-bb-border">
                            <span className="text-xs text-bb-muted uppercase">Market Consensus:</span>
                            <span className={`text-xl font-bold uppercase ${getSentimentColor(sentiment.sentiment)}`}>
                            {sentiment.sentiment}
                            </span>
                        </div>
                        
                        <div className="bg-bb-panel border border-bb-border p-4">
                            <h3 className="text-xs font-bold text-bb-orange mb-2 uppercase">>> EXECUTIVE SUMMARY</h3>
                            <p className="text-bb-text text-sm leading-relaxed uppercase">{sentiment.summary}</p>
                        </div>

                        {sentiment.sources && sentiment.sources.length > 0 && (
                            <div>
                            <h3 className="text-xs font-bold text-bb-muted mb-2 uppercase">>> INTEL SOURCES</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {sentiment.sources.map((source, index) => (
                                <li key={index} className="truncate">
                                    <a 
                                    href={source.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center text-xs text-bb-blue hover:underline hover:text-white transition-colors"
                                    >
                                    <LinkIcon className="w-3 h-3 mr-1" />
                                    <span className="truncate">{source.title}</span>
                                    </a>
                                </li>
                                ))}
                            </ul>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'thesis' && (
                    <div className="space-y-6 animate-fade-in">
                         {technicalThesis && (
                            <div className="flex items-center space-x-4 p-3 bg-bb-dark border border-bb-border justify-between">
                                <div>
                                    <span className="text-xs text-bb-muted uppercase mr-2">Tech Outlook:</span>
                                    <span className={`text-xl font-bold uppercase ${getSentimentColor(technicalThesis.outlook)}`}>
                                        {technicalThesis.outlook}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-bb-muted uppercase block">Confidence</span>
                                    <span className="text-white font-bold font-mono">{technicalThesis.confidenceScore}%</span>
                                </div>
                            </div>
                         )}

                        {/* FACTOR ATTRIBUTION VISUALIZATION */}
                        {factors && (
                            <div className="bg-bb-panel border border-bb-border p-4">
                                <h3 className="text-xs font-bold text-bb-orange mb-3 uppercase">>> SIGNAL DNA DECONSTRUCTION</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                    <ProgressBar label="Momentum Velocity" value={factors.momentum} colorClass="bg-blue-500" />
                                    <ProgressBar label="Volume Conviction" value={factors.volume} colorClass="bg-orange-500" />
                                    <ProgressBar label="Trend Persistence" value={factors.trend} colorClass="bg-purple-500" />
                                    <ProgressBar label="Volatility Expansion" value={factors.volatility} colorClass="bg-red-500" />
                                </div>
                                <div className="mt-2 pt-2 border-t border-bb-border text-[10px] text-bb-muted flex justify-between">
                                    <span>DOMINANT FACTOR: <span className="text-white font-bold">{factors.dominantFactor}</span></span>
                                    <span>FACTOR SCORE: {Math.round((factors.momentum + factors.volume + factors.trend + factors.volatility) / 4)}/100</span>
                                </div>
                            </div>
                        )}

                        {technicalThesis && (
                            <>
                                <div className="bg-bb-panel border border-bb-border p-4 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-1 opacity-20">
                                        <BrainCircuitIcon className="w-16 h-16 text-bb-orange" />
                                     </div>
                                     <h3 className="text-xs font-bold text-bb-orange mb-2 uppercase">>> ALGORITHMIC THESIS</h3>
                                     <p className="text-white text-sm leading-relaxed font-mono">
                                        "{technicalThesis.thesis}"
                                     </p>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-bb-muted mb-2 uppercase">>> FACTOR CONFLUENCE</h3>
                                    <ul className="space-y-2">
                                        {technicalThesis.keyFactors.map((factor, i) => (
                                            <li key={i} className="flex items-start text-xs text-bb-text">
                                                <span className="text-bb-orange mr-2">[{i+1}]</span>
                                                {factor}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;