import React, { useState, useEffect } from 'react';
import type { ProcessedStock, NewsResult } from '../types';
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
            s.signals.shortTermCrossBuySignal || 
            s.signals.vwlmBuySignal
        );
        
        // If we have enough signaled stocks, take a random sample of 5-8
        if (signaledStocks.length > 0) {
            const shuffled = [...signaledStocks].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 8).map(s => s.ticker);
        }

        // Otherwise, take random stocks from the full list
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
        // Initial load only if we have stocks
        if (processedStocks.length > 0 && !newsData && !loading) {
            loadNews();
        }
    }, [processedStocks]);

    return (
        <div className="p-4 font-mono h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-bb-orange pb-2">
                <h2 className="text-lg font-bold text-bb-orange uppercase tracking-wider">>> NEWS WIRE</h2>
                <button 
                    onClick={loadNews}
                    disabled={loading}
                    className="flex items-center px-3 py-1 bg-bb-panel hover:bg-bb-orange hover:text-bb-black border border-bb-border text-xs uppercase font-bold transition-colors"
                >
                    {loading ? <Loader className="w-3 h-3 mr-2" /> : <RefreshCwIcon className="w-3 h-3 mr-2" />}
                    {loading ? 'SYNCING...' : 'FORCE REFRESH'}
                </button>
            </div>

            {error && (
                <div className="bg-bb-red/20 border border-bb-red text-bb-red p-2 mb-4 text-xs font-bold">
                    [ERROR] {error}
                </div>
            )}

            {loading && !newsData && (
                <div className="flex flex-col items-center justify-center py-20 text-bb-orange">
                    <Loader className="w-8 h-8 mb-2" />
                    <span className="text-xs blink">ESTABLISHING UPLINK...</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-1">
                {newsData?.items.map((item, idx) => (
                    <div key={idx} className="group flex flex-col md:flex-row border-b border-bb-border py-3 hover:bg-bb-panel transition-colors px-2">
                        <div className="md:w-32 flex-shrink-0 mb-2 md:mb-0 text-xs text-bb-muted">
                            {new Date().toLocaleDateString()}
                        </div>
                        <div className="flex-grow">
                             <div className="flex items-baseline space-x-2 mb-1">
                                <span className={`text-[10px] font-bold px-1 uppercase ${
                                    item.sentiment === 'Bullish' ? 'bg-bb-green text-bb-black' :
                                    item.sentiment === 'Bearish' ? 'bg-bb-red text-bb-black' :
                                    'bg-bb-muted text-bb-black'
                                }`}>
                                    {item.sentiment}
                                </span>
                                <h3 className="text-sm font-bold text-bb-text group-hover:text-bb-orange cursor-pointer">{item.title}</h3>
                             </div>
                             <p className="text-xs text-bb-muted leading-relaxed uppercase max-w-4xl">{item.summary}</p>
                             <div className="flex flex-wrap gap-2 mt-2">
                                {item.relatedTickers.map(t => (
                                    <span key={t} className="text-[10px] text-bb-blue font-bold">
                                        ${t}
                                    </span>
                                ))}
                             </div>
                        </div>
                    </div>
                ))}
            </div>

            {newsData?.sources && newsData.sources.length > 0 && (
                <div className="mt-8 border-t border-bb-border pt-4">
                    <h4 className="text-xs font-bold text-bb-orange mb-2 uppercase">>> SOURCES</h4>
                    <div className="flex flex-wrap gap-2">
                        {newsData.sources.map((source, idx) => (
                            <a 
                                key={idx}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-[10px] text-bb-muted hover:text-bb-blue hover:underline"
                            >
                                <LinkIcon className="w-3 h-3 mr-1" />
                                {source.title}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsDashboard;