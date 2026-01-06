import React, { useMemo } from 'react';
import type { Sentiment, TechnicalInsight, SignalFactors } from '../types';
import { LinkIcon } from './Icons';
import { Loader } from './Loader';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string | null;
  sentiment: Sentiment | null;
  technicalThesis: TechnicalInsight | null;
  factors?: SignalFactors; 
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

  // Filter sources to find official NSE/BSE or corporate links
  const officialSources = useMemo(() => {
      if (!sentiment?.sources) return [];
      const keywords = ['nseindia', 'bseindia', 'corporate', 'investor', 'filing', 'quarterly', 'result', 'pdf'];
      return sentiment.sources.filter(s => 
          keywords.some(k => s.uri.toLowerCase().includes(k) || s.title.toLowerCase().includes(k))
      );
  }, [sentiment]);

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
          <span>AI_ANALYSIS_MATRIX_V3.1_FILING_SYNC</span>
          <button onClick={onClose} className="hover:bg-bb-black hover:text-bb-orange px-1 transition-colors">
            [X]
          </button>
        </div>
        
        <div className="flex border-b border-bb-border">
            <button 
                onClick={() => setActiveTab('sentiment')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === 'sentiment' ? 'bg-bb-panel text-bb-orange' : 'text-bb-muted hover:text-white'}`}
            >
                <span className="mr-2">MACRO & FILINGS</span>
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
              {isLoading && <span className="text-bb-orange text-xs animate-pulse">ANALYZING QUARTERLY REPORTS...</span>}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader className="w-12 h-12 text-bb-orange" />
                <p className="mt-4 text-bb-orange text-xs blink">PROBING EXCHANGE FILINGS...</p>
            </div>
          ) : (
            <>
                {activeTab === 'sentiment' && sentiment && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center space-x-4 p-3 bg-bb-dark border border-bb-border">
                            <span className="text-xs text-bb-muted uppercase">Consensus:</span>
                            <span className={`text-xl font-bold uppercase ${getSentimentColor(sentiment.sentiment)}`}>
                            {sentiment.sentiment}
                            </span>
                        </div>
                        
                        <div className="bg-bb-panel border border-bb-border p-4">
                            <h3 className="text-xs font-bold text-bb-orange mb-2 uppercase">>> DISCLOSURE SUMMARY</h3>
                            <p className="text-bb-text text-sm leading-relaxed uppercase">{sentiment.summary}</p>
                        </div>

                        {officialSources.length > 0 && (
                            <div className="bg-bb-black border border-bb-blue/30 p-4">
                                <h3 className="text-[10px] font-bold text-bb-blue mb-3 uppercase tracking-tighter">>> DETECTED CORPORATE REPORTS & FILINGS</h3>
                                <div className="space-y-2">
                                    {officialSources.map((source, idx) => (
                                        <a 
                                            key={idx} 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center text-[11px] text-bb-text hover:text-bb-blue transition-colors group"
                                        >
                                            <LinkIcon className="w-3 h-3 mr-2 group-hover:scale-110" />
                                            <span className="truncate">{source.title}</span>
                                            <span className="ml-2 text-[9px] text-bb-blue font-bold opacity-0 group-hover:opacity-100">[SOURCE]</span>
                                        </a>
                                    ))}
                                </div>
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

                        {factors && (
                            <div className="bg-bb-panel border border-bb-border p-4">
                                <h3 className="text-xs font-bold text-bb-orange mb-3 uppercase">>> SIGNAL DNA DECONSTRUCTION</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                    <ProgressBar label="Momentum Velocity" value={factors.momentum} colorClass="bg-blue-500" />
                                    <ProgressBar label="Volume Conviction" value={factors.volume} colorClass="bg-orange-500" />
                                    <ProgressBar label="Trend Persistence" value={factors.trend} colorClass="bg-purple-500" />
                                    <ProgressBar label="Institutional Score" value={factors.institutional} colorClass="bg-bb-green" />
                                </div>
                                <div className="mt-2 pt-2 border-t border-bb-border text-[10px] text-bb-muted flex justify-between">
                                    <span>DOMINANT FACTOR: <span className="text-white font-bold">{factors.dominantFactor}</span></span>
                                    <span>FACTOR SCORE: {Math.round((factors.momentum + factors.volume + factors.trend + factors.volatility + factors.institutional) / 5)}/100</span>
                                </div>
                            </div>
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