
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchStockData, Tickers } from './services/stockDataService';
import { calculateIndicators, generateSignals } from './services/technicalAnalysisService';
import { getSentiment, getTechnicalInsight } from './services/geminiService';
import { runPortfolioSimulation } from './services/backtestingService';
import { detectMarketRegime } from './services/marketRegimeService';
import { generateSignalAlerts } from './services/intelligenceEngine';
import type { ProcessedStock, Sentiment, TabType, PortfolioBacktestResult, Column, StockData, TechnicalInsight, MarketRegime, SignalFactors, SignalAlert } from './types';
import { TABS, VOLUME_TREND_COLUMNS, PORTFOLIO_SIMULATION_COLUMNS, VWLM_COLUMNS } from './constants';
import Dashboard from './components/Dashboard';
import AnalysisModal from './components/SentimentModal';
import { PortfolioSimulationDashboard } from './components/BacktestDashboard';
import BacktestDetailsModal from './components/BacktestDetailsModal';
import StockTable from './components/StockTable';
import StockChart from './components/StockChart';
import UserManual from './components/UserManual';
import StrategyBacktester from './components/StrategyBacktester';
import NewsDashboard from './components/NewsDashboard';
import DerivativesDashboard from './components/DerivativesDashboard';
import { Loader } from './components/Loader';
import LoadingGame from './components/LoadingGame';
import TickerTape from './components/TickerTape';
import AlertFeed from './components/AlertFeed';

// Removed redundant declare global to avoid conflict with predefined AIStudio type.

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing GP Alpha Terminal...');
  const [processedStocks, setProcessedStocks] = useState<ProcessedStock[]>([]);
  const [portfolioSimResults, setPortfolioSimResults] = useState<PortfolioBacktestResult[]>([]);
  const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('Volume/Trend');
  const [commandValue, setCommandValue] = useState('');
  
  const [hasPaidKey, setHasPaidKey] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisActiveTab, setAnalysisActiveTab] = useState<'sentiment' | 'thesis'>('sentiment');
  const [modalTicker, setModalTicker] = useState<string | null>(null);
  
  const [sentimentData, setSentimentData] = useState<Sentiment | null>(null);
  const [thesisData, setThesisData] = useState<TechnicalInsight | null>(null);
  const [modalFactors, setModalFactors] = useState<SignalFactors | undefined>(undefined);

  const [signalAlerts, setSignalAlerts] = useState<SignalAlert[]>([]);
  const [isAlertsLoading, setIsAlertsLoading] = useState(false);
  const [isAlertsVisible, setIsAlertsVisible] = useState(true);

  const [sentiments, setSentiments] = useState<Record<string, Sentiment>>({});
  const [theses, setTheses] = useState<Record<string, TechnicalInsight>>({});
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
  const [modalBacktestData, setModalBacktestData] = useState<PortfolioBacktestResult | null>(null);

  const [hoveredStock, setHoveredStock] = useState<ProcessedStock | null>(null);

  // Check for paid key on mount
  useEffect(() => {
    const checkKey = async () => {
      // Use any cast to check for existence of aistudio if the global interface is not yet picked up by TS
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasPaidKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectApiKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasPaidKey(true);
      // Immediately retry some logic or simply refresh UI
      scanStocks();
    }
  };

  const scanStocks = useCallback(async () => {
    setLoading(true);
    setErrorCount(0);
    setProcessedStocks([]);
    setPortfolioSimResults([]);
    
    const stocksWithIndicators: Omit<ProcessedStock, 'signals'>[] = [];
    
    // Fetch benchmark first
    setLoadingMessage(`> SYNCING MARKET BENCHMARK (NIFTY 50)...`);
    const niftyBenchmark = await fetchStockData('^NSEI').catch(() => null);

    const batchSize = 15; 
    for (let i = 0; i < Tickers.length; i += batchSize) {
        const batchTickers = Tickers.slice(i, i + batchSize);
        setLoadingMessage(`> PROCESSING DATA BLOCK ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(Tickers.length / batchSize)} [${i + 1}-${Math.min(i + batchSize, Tickers.length)}]`);

        const fetchDataPromises = batchTickers.map(ticker => fetchStockData(ticker).catch(() => null));

        const fetchedBatchResults = await Promise.all(fetchDataPromises);

        for (let j = 0; j < fetchedBatchResults.length; j++) {
            const nseData = fetchedBatchResults[j] as StockData | null;
            const originalTicker = batchTickers[j];

            if (nseData) {
                const indicators = calculateIndicators(nseData.historical);
                stocksWithIndicators.push({ ticker: originalTicker, data: nseData, indicators });
            }
        }

        if (i + batchSize < Tickers.length) {
            await new Promise(resolve => setTimeout(resolve, 150));
        }
    }
    
    setLoadingMessage(`> RUNNING ALGORITHMIC SIGNAL ENGINES...`);
    
    const finalProcessedStocks = stocksWithIndicators.map(stock => {
      const signals = generateSignals(stock.indicators, stock.data.historical);
      return { ...stock, signals };
    });

    const simResults = runPortfolioSimulation(finalProcessedStocks, niftyBenchmark || undefined);
    const detectedRegime = detectMarketRegime(finalProcessedStocks);

    setMarketRegime(detectedRegime);
    setPortfolioSimResults(simResults);
    setProcessedStocks(finalProcessedStocks);
    setLoading(false);
    
    runIntelligenceScan(finalProcessedStocks);
  }, []);

  const runIntelligenceScan = async (stocks: ProcessedStock[]) => {
      setIsAlertsLoading(true);
      const alerts = await generateSignalAlerts(stocks);
      setSignalAlerts(alerts);
      setIsAlertsLoading(false);
  };

  useEffect(() => {
    scanStocks();
  }, [scanStocks]);

  const handleFetchAnalysis = useCallback(async (ticker: string, type: 'sentiment' | 'thesis') => {
    setModalTicker(ticker);
    setAnalysisActiveTab(type);
    setIsAnalysisModalOpen(true);
    
    setSentimentData(sentiments[ticker] || null);
    setThesisData(theses[ticker] || null);
    
    const stock = processedStocks.find(s => s.ticker === ticker);
    setModalFactors(stock?.signals.factors);

    if (type === 'sentiment' && sentiments[ticker]) return;
    if (type === 'thesis' && theses[ticker]) return;

    setIsAnalysisLoading(true);

    try {
        if (type === 'sentiment') {
            const result = await getSentiment(ticker);
            setSentimentData(result);
            setSentiments(prev => ({ ...prev, [ticker]: result }));
        } else {
            if (stock) {
                const result = await getTechnicalInsight(ticker, stock.indicators, stock.signals);
                setThesisData(result);
                setTheses(prev => ({ ...prev, [ticker]: result }));
            }
        }
    } catch (error: any) {
      console.error(`Failed to fetch ${type}:`, error);
      if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
          // If we hit 429, suggest selecting a paid key
          setErrorCount(prev => prev + 1);
      }
    } finally {
      setIsAnalysisLoading(false);
    }
  }, [processedStocks, sentiments, theses]);

  useEffect(() => {
    if (isAnalysisModalOpen && modalTicker) {
        handleFetchAnalysis(modalTicker, analysisActiveTab);
    }
  }, [analysisActiveTab, isAnalysisModalOpen, modalTicker, handleFetchAnalysis]);


  const closeAnalysisModal = () => {
    setIsAnalysisModalOpen(false);
    setModalTicker(null);
  };

  const handleShowBacktestDetails = useCallback((result: PortfolioBacktestResult) => {
    setModalBacktestData(result);
    setIsBacktestModalOpen(true);
  }, []);
  
  const closeBacktestModal = () => {
    setIsBacktestModalOpen(false);
    setModalBacktestData(null);
  };

  const handleCommandChange = (val: string) => {
      setCommandValue(val);
      const upperVal = val.toUpperCase();
      
      if (upperVal === 'NEWS') setActiveTab('Recent News');
      else if (upperVal === 'SIM' || upperVal === 'PORT') setActiveTab('Portfolio Simulation');
      else if (upperVal === 'STRAT' || upperVal === 'BACK') setActiveTab('Strategy Backtester');
      else if (upperVal === 'HELP' || upperVal === 'MAN') setActiveTab('User Manual');
      else if (upperVal === 'VOL') setActiveTab('Volume/Trend');
      else if (upperVal === 'VWLM') setActiveTab('VWLM');
      else if (upperVal === 'OPT' || upperVal === 'DER') setActiveTab('Derivatives Desk');
      else if (upperVal === 'ALERTS' || upperVal === 'INTEL') setIsAlertsVisible(true);
  };

  const filteredData = useMemo(() => {
    let data = processedStocks;
    
    switch(activeTab) {
        case 'Volume/Trend':
            data = processedStocks.filter(s => s.signals.volumeSignal === 'Spike' && (s.signals.trendSignal === 'Uptrend' || s.signals.trendSignal === 'Downtrend'));
            break;
        case 'VWLM':
            data = processedStocks.filter(s => s.signals.vwlmBuySignal || s.signals.vwlmSellSignal);
            break;
    }

    if (commandValue.length > 0) {
        const search = commandValue.toUpperCase();
        const keywords = ['NEWS', 'SIM', 'PORT', 'STRAT', 'BACK', 'HELP', 'MAN', 'VOL', 'VWLM', 'OPT', 'DER', 'ALERTS', 'INTEL'];
        if (!keywords.includes(search)) {
             data = data.filter(s => s.ticker.includes(search));
        }
    }

    return data;
  }, [processedStocks, activeTab, commandValue]);

  const columns = useMemo(() => {
    switch(activeTab) {
      case 'Volume/Trend': return VOLUME_TREND_COLUMNS(handleFetchAnalysis, sentiments);
      case 'VWLM': return VWLM_COLUMNS(handleFetchAnalysis);
      case 'Portfolio Simulation': return PORTFOLIO_SIMULATION_COLUMNS(handleShowBacktestDetails);
      default: 
        return [];
    }
  }, [activeTab, handleFetchAnalysis, handleShowBacktestDetails, sentiments]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bb-black text-bb-text font-mono">
        <Loader className="w-16 h-16 text-bb-orange" />
        <p className="text-lg mt-6 font-bold tracking-widest text-bb-orange animate-pulse">{loadingMessage}</p>
        <div className="mt-10 w-full max-w-2xl border border-bb-border bg-bb-panel p-1">
          <LoadingGame />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Portfolio Simulation':
        return <PortfolioSimulationDashboard columns={columns as Column<PortfolioBacktestResult>[]} data={portfolioSimResults} />;
      case 'Strategy Backtester':
        return <StrategyBacktester results={portfolioSimResults} />;
      case 'Derivatives Desk':
        return <DerivativesDashboard stocks={processedStocks} />;
      case 'User Manual':
        return <UserManual />;
      case 'Recent News':
        return <NewsDashboard processedStocks={processedStocks} />;
      default:
        return (
          <StockTable 
            columns={columns as Column<ProcessedStock>[]} 
            data={filteredData} 
            activeTab={activeTab} 
            onHover={setHoveredStock}
          />
        );
    }
  };

  return (
    <div className="h-screen bg-bb-black text-bb-text flex flex-col overflow-hidden selection:bg-bb-orange selection:text-bb-black">
      <Dashboard
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalScanned={Tickers.length}
        errors={errorCount}
        onRefresh={scanStocks}
        stocks={processedStocks}
        regime={marketRegime}
        commandValue={commandValue}
        onCommandChange={handleCommandChange}
        hasPaidKey={hasPaidKey}
        onSelectApiKey={handleSelectApiKey}
      >
        <div className="h-full overflow-auto custom-scrollbar">
            {renderContent()}
        </div>
      </Dashboard>
      
      <TickerTape stocks={processedStocks} />
      
      {isAlertsVisible && (
        <AlertFeed 
          alerts={signalAlerts} 
          loading={isAlertsLoading} 
          onRefresh={() => runIntelligenceScan(processedStocks)}
          onClose={() => setIsAlertsVisible(false)}
        />
      )}

      {hoveredStock && !['Portfolio Simulation', 'Strategy Backtester', 'User Manual', 'Recent News', 'Derivatives Desk'].includes(activeTab) && (
        <div className="fixed bottom-12 right-4 z-50 w-[450px] h-[300px] bg-bb-black border border-bb-orange shadow-[0_0_15px_rgba(255,153,0,0.15)] animate-fade-in hidden lg:block">
           <div className="bg-bb-orange text-bb-black px-2 py-1 text-xs font-mono font-bold flex justify-between items-center">
              <span>CHART: {hoveredStock.ticker}</span>
              <span>[LIVE]</span>
           </div>
           <div className="w-full h-[calc(100%-24px)] p-1">
               <StockChart data={hoveredStock.data.historical} ticker={hoveredStock.ticker} />
           </div>
        </div>
      )}

      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={closeAnalysisModal}
        ticker={modalTicker}
        sentiment={sentimentData}
        technicalThesis={thesisData}
        factors={modalFactors}
        activeTab={analysisActiveTab}
        setActiveTab={setAnalysisActiveTab}
        isLoading={isAnalysisLoading}
        onUpgradeRequested={handleSelectApiKey}
      />
      <BacktestDetailsModal 
        isOpen={isBacktestModalOpen}
        onClose={closeBacktestModal}
        result={modalBacktestData}
      />
    </div>
  );
};

export default App;
