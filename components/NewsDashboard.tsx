import React, { useState, useEffect, useMemo } from 'react';
import type { ProcessedStock, NewsResult, NewsItem } from '../types';
import { fetchMarketNews } from '../services/newsService';
import { Loader } from './Loader';
import { LinkIcon, RefreshCwIcon } from './Icons';

interface NewsDashboardProps {
    processedStocks: ProcessedStock[];
}

const NewsDashboard: React.FC<NewsDashboardProps> = ({ processedStocks }) => {
    const [newsData, setNewsData] = useState<NewsResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTickersOfInterest = () => {
        // Prioritize stocks with signals
        const signaledStocks = processedStocks.filter(s => 
            s.signals.volumeSignal === 'Spike' || 
            s.signals.vwlmBuySignal
        );
        
        if (signaledStocks.length > 0) {
            const shuffled = [...signaledStocks].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 8).map(s => s.ticker);
        }

        const shuffled = [...processedStocks].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 8).map(s => s.ticker);
    };

    const loadNews = async () => {
        setLoading(true);
        setError(null);
        try {
            const tickers = getTickersOfInterest();
            if (tickers.length === 0) {
                setError("NO TARGETS FOR NEWS SCAN.");
                setLoading(false);
                return;
            }
            const data = await fetchMarketNews(tickers);
            setNewsData(data);
        } catch (err) {
            setError("NEWS FEED CONNECTION FAILED.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (processedStocks.length > 0 && !newsData && !loading) {
            loadNews();
        }
    }, [processedStocks]);

    // Importance Sorting Algorithm
    const sortedItems = useMemo(() => {
        if (!newsData) return [];
        
        return [...newsData.items].sort((a, b) => {
            const getScore = (item: NewsItem) => {
                let score = 0;
                const text = (item.title + item.summary).toUpperCase();
                
                // High priority keywords
                if (text.includes('EARNINGS') || text.includes('QUARTERLY')) score += 10;
                if (text.includes('REGULATORY') || text.includes('RBI') || text.includes('SEBI')) score += 12;
                if (text.includes('ACQUISITION') || text.includes('MERGER') || text.includes('M&A')) score += 8;
                if (text.includes('DIVIDEND') || text.includes('SPLIT')) score += 5;
                if (text.includes('CRITICAL') || text.includes('WARNING')) score += 15;
                
                // Sentiment weight
                if (item.sentiment !== 'Neutral') score += 3;
                
                return score;
            };
            
            return getScore(b) - getScore(a);
        });
    }, [newsData]);

    return (
        <div className="p-8 font-sans h-full overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 border-b border-pro-border pb-6">
                <div>
                    <h2 className="text-2xl font-black text-pro-text uppercase tracking-tight">Market News Wire</h2>
                    <p className="text-pro-muted text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Institutional sentiment & real-time exchange disclosures</p>
                </div>
                <button 
                    onClick={loadNews}
                    disabled={loading}
                    className="flex items-center px-5 py-2.5 bg-pro-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                    {loading ? <Loader className="w-3 h-3 mr-2" /> : <RefreshCwIcon className="w-3 h-3 mr-2" />}
                    {loading ? 'SYNCING...' : 'FORCE REFRESH'}
                </button>
            </div>

            {error && (
                <div className="bg-pro-red/10 border border-pro-red/20 text-pro-red p-4 mb-6 rounded-xl text-xs font-bold uppercase">
                    [SYSTEM_ERROR] {error}
                </div>
            )}

            {loading && !newsData && (
                <div className="flex flex-col items-center justify-center py-40">
                    <Loader className="w-12 h-12 text-pro-primary mb-4" />
                    <span className="text-[10px] font-black text-pro-primary uppercase tracking-[0.3em] animate-pulse">Establishing Neural Link...</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {sortedItems.map((item, idx) => (
                    <div key={idx} className="group bg-pro-surface border border-pro-border rounded-2xl p-6 hover:bg-white hover:shadow-soft hover:border-pro-primary/30 transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden">
                        {idx === 0 && (
                            <div className="absolute top-0 right-0 px-3 py-1 bg-pro-accent text-pro-text text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm">
                                High Importance
                            </div>
                        )}
                        <div className="md:w-32 flex-shrink-0 flex flex-col justify-center">
                            <span className="text-[10px] font-black text-pro-muted uppercase mb-1">Exchange Date</span>
                            <span className="text-xs font-bold text-pro-text">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex-grow">
                             <div className="flex items-center space-x-3 mb-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                    item.sentiment === 'Bullish' ? 'bg-pro-green/10 text-pro-green border-pro-green/20' :
                                    item.sentiment === 'Bearish' ? 'bg-pro-red/10 text-pro-red border-pro-red/20' :
                                    'bg-pro-surface text-pro-muted border-pro-border'
                                }`}>
                                    {item.sentiment}
                                </span>
                                <h3 className="text-base font-black text-pro-text group-hover:text-pro-primary transition-colors tracking-tight uppercase">{item.title}</h3>
                             </div>
                             <p className="text-[13px] text-pro-muted leading-relaxed font-medium mb-4">{item.summary}</p>
                             <div className="flex flex-wrap gap-2 pt-4 border-t border-pro-border/40">
                                {item.relatedTickers.map(t => (
                                    <span key={t} className="text-[10px] font-black text-pro-primary bg-pro-primary/5 px-2 py-0.5 rounded border border-pro-primary/10">
                                        ${t}
                                    </span>
                                ))}
                             </div>
                        </div>
                    </div>
                ))}
            </div>

            {newsData?.sources && newsData.sources.length > 0 && (
                <div className="mt-16 pt-10 border-t border-pro-border">
                    <h4 className="text-[10px] font-black text-pro-muted uppercase mb-6 tracking-widest flex items-center">
                        <LinkIcon className="w-3.5 h-3.5 mr-2" /> Exchange Source Validation
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {newsData.sources.map((source, idx) => (
                            <a 
                                key={idx}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-3 bg-pro-surface border border-pro-border rounded-xl text-[10px] text-pro-muted font-bold hover:text-pro-primary hover:border-pro-primary/30 transition-all shadow-sm"
                            >
                                <LinkIcon className="w-3 h-3 mr-2 opacity-50" />
                                <span className="truncate uppercase">{source.title}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsDashboard;
