import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchStockData, Tickers } from './services/stockDataService';
import { calculateIndicators, generateSignals } from './services/technicalAnalysisService';
import { getSentiment, getTechnicalInsight } from './services/geminiService';
import { runPortfolioSimulation } from './services/backtestingService';
import { detectMarketRegime } from './services/marketRegimeService';
import { generateSignalAlerts } from './services/intelligenceEngine';
import { calculatePortfolioRisk } from './services/riskEngine'; // Import Risk Engine
import type { ProcessedStock, Sentiment, TabType, PortfolioBacktestResult, Column, StockData, TechnicalInsight, MarketRegime, SignalFactors, SignalAlert, RiskAnalysis } from './types';
import { TABS, VOLUME_TREND_COLUMNS, SHORT_TERM_CROSSOVER_COLUMNS, PORTFOLIO_SIMULATION_COLUMNS, VWLM_COLUMNS, VWLM_INTRADAY_COLUMNS } from './constants';
import Dashboard from './components/Dashboard';
import AnalysisModal from './components/SentimentModal';
import { PortfolioSimulationDashboard } from './components/BacktestDashboard';
import BacktestDetailsModal from './components/BacktestDetailsModal';
import StockTable from './components/StockTable';
import StockChart from './components/StockChart';
import UserManual from './components/UserManual';
import StrategyBacktester from './components/StrategyBacktester';
import NewsDashboard from './components/NewsDashboard';
import { Loader } from './components/Loader';
import LoadingGame from './components/LoadingGame';
import TickerTape from './components/TickerTape';
import AlertFeed from './components/AlertFeed';
import RiskDashboard from './components/RiskDashboard';
import TradingCoach from './components/TradingCoach'; // Import Coach

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Terminal...');
  const [processedStocks, setProcessedStocks] = useState<ProcessedStock[]>([]);
  const [portfolioSimResults, setPortfolioSimResults] = useState<PortfolioBacktestResult[]>([]);
  const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null); // Risk State
  const [errorCount, setErrorCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('Volume/Trend');
  const [commandValue, setCommandValue] = useState('');
  
  // Analysis Modal State
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisActiveTab, setAnalysisActiveTab] = useState<'sentiment' | 'thesis'>('sentiment');
  const [modalTicker, setModalTicker] = useState<string | null>(null);
  
  const [sentimentData, setSentimentData] = useState<Sentiment | null>(null);
  const [thesisData, setThesisData] = useState<TechnicalInsight | null>(null);
  
  // New: Store factors for modal
  const [modalFactors, setModalFactors] = useState<SignalFactors | undefined>(undefined);

  // Intelligence Engine State
  const [signalAlerts, setSignalAlerts] = useState<SignalAlert[]>([]);
  const [isAlertsLoading, setIsAlertsLoading] = useState(false);

  // Caching mechanism for session
  const [sentiments, setSentiments] = useState<Record<string, Sentiment>>({});
  const [theses, setTheses] = useState<Record<string, TechnicalInsight>>({});
  
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
  const [modalBacktestData, setModalBacktestData] = useState<PortfolioBacktestResult | null>(null);

  // New state for chart hover
  const [hoveredStock, setHoveredStock] = useState<ProcessedStock | null>(null);

  const scanStocks = useCallback(async () => {
    setLoading(true);
    setErrorCount(0);
    setProcessedStocks([]);
    setPortfolioSimResults([]);
    setRiskAnalysis(null);
    
    // Step 1: Fetch data and calculate indicators for all stocks
    const stocksWithIndicators: Omit<ProcessedStock, 'signals'>[] = [];
    
    // Increased Batch Size for "Maximum stocks" requirement
    const batchSize = 25;
    for (let i = 0; i < Tickers.length; i += batchSize) {
        const batchTickers = Tickers.slice(i, i + batchSize);
        setLoadingMessage(`> PROCESSING DATA BLOCK ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(Tickers.length / batchSize)} [${i + 1}-${Math.min(i + batchSize, Tickers.length)}]`);

        const fetchDataPromises = batchTickers.map(ticker => 
            fetchStockData(ticker).catch(err => ({ ticker, error: err.message }))
        );
        const fetchedBatchResults = await Promise.all(fetchDataPromises);

        const validStocksData = fetchedBatchResults.filter(stockOrError => {
            if ('error' in stockOrError) {
                setErrorCount(prev => prev + 1);
                return false;
            }
            if (stockOrError.currentPrice < 35 || stockOrError.historical.length < 252) { // Ensure enough data for 200 EMA
                return false; 
            }
            return true;
        }) as StockData[]; 

        const processedBatch = validStocksData.map(data => {
            const indicators = calculateIndicators(data.historical);
            return { ticker: data.ticker, data, indicators };
        });

        stocksWithIndicators.push(...processedBatch);

        if (i + batchSize < Tickers.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    // Step 2: Generate signals and run backtest with the fixed strategy
    setLoadingMessage(`> RUNNING ALGORITHMIC SIGNAL ENGINES...`);
    await new Promise(resolve => setTimeout(resolve, 50)); 
    
    const finalProcessedStocks = stocksWithIndicators.map(stock => {
      const signals = generateSignals(stock.indicators, stock.data.historical);
      return { ...stock, signals };
    });

    const simResults = runPortfolioSimulation(finalProcessedStocks);
    
    // Step 3: Detect Global Market Regime
    const detectedRegime = detectMarketRegime(finalProcessedStocks);
    setMarketRegime(detectedRegime);

    // Step 4: Calculate Risk
    const risk = calculatePortfolioRisk(finalProcessedStocks);
    setRiskAnalysis(risk);

    setPortfolioSimResults(simResults);
    setProcessedStocks(finalProcessedStocks);
    setLoading(false);
    
    // Step 5: Run Intelligence Engine (Async to not block UI)
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
    
    // Reset current view data
    setSentimentData(sentiments[ticker] || null);
    setThesisData(theses[ticker] || null);
    
    // Set Factors from local state
    const stock = processedStocks.find(s => s.ticker === ticker);
    setModalFactors(stock?.signals.factors);

    // If data already exists in cache, don't fetch
    if (type === 'sentiment' && sentiments[ticker]) return;
    if (type === 'thesis' && theses[ticker]) return;

    setIsAnalysisLoading(true);

    try {
        if (type === 'sentiment') {
            const result = await getSentiment(ticker);
            setSentimentData(result);
            setSentiments(prev => ({ ...prev, [ticker]: result }));
        } else {
            // Find the stock data to pass to AI
            if (stock) {
                const result = await getTechnicalInsight(ticker, stock.indicators, stock.signals);
                setThesisData(result);
                setTheses(prev => ({ ...prev, [ticker]: result }));
            }
        }
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
    } finally {
      setIsAnalysisLoading(false);
    }
  }, [processedStocks, sentiments, theses]);

  // Handle switching tabs inside the modal triggers a fetch if needed
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

  // Command Bar Logic
  const handleCommandChange = (val: string) => {
      setCommandValue(val);
      const upperVal = val.toUpperCase();
      
      // Check for navigation commands
      if (upperVal === 'NEWS') setActiveTab('Recent News');
      else if (upperVal === 'SIM' || upperVal === 'PORT') setActiveTab('Portfolio Simulation');
      else if (upperVal === 'STRAT' || upperVal === 'BACK') setActiveTab('Strategy Backtester');
      else if (upperVal === 'HELP' || upperVal === 'MAN') setActiveTab('User Manual');
      else if (upperVal === 'VOL') setActiveTab('Volume/Trend');
      else if (upperVal === 'VWLM') setActiveTab('VWLM');
      else if (upperVal === 'RISK') setActiveTab('Risk Desk');
      else if (upperVal === 'COACH') setActiveTab('AI Coach');
  };

  const filteredData = useMemo(() => {
    let data = processedStocks;
    
    // Apply Tab Filters
    switch(activeTab) {
        case 'Volume/Trend':
            data = processedStocks.filter(s => s.signals.volumeSignal === 'Spike' && (s.signals.trendSignal === 'Uptrend' || s.signals.trendSignal === 'Downtrend'));
            break;
        case 'Short-term Crossover':
            data = processedStocks.filter(s => s.signals.shortTermCrossBuySignal || s.signals.shortTermCrossSellSignal);
            break;
        case 'VWLM':
            data = processedStocks.filter(s => s.signals.vwlmBuySignal || s.signals.vwlmSellSignal);
            break;
        case 'VWLM Intraday':
            data = processedStocks.filter(s => s.signals.vwlmIntradayBuySignal || s.signals.vwlmIntradaySellSignal);
            break;
    }

    // Apply Command Bar Search Filter
    if (commandValue.length > 0) {
        const search = commandValue.toUpperCase();
        // Don't filter if it matches a known command exactly (to avoid empty screen when typing 'NEWS')
        if (!['NEWS', 'SIM', 'PORT', 'STRAT', 'BACK', 'HELP', 'MAN', 'VOL', 'VWLM', 'RISK', 'COACH'].includes(search)) {
             data = data.filter(s => s.ticker.includes(search));
        }
    }

    return data;
  }, [processedStocks, activeTab, commandValue]);

  const columns = useMemo(() => {
    switch(activeTab) {
      case 'Volume/Trend': return VOLUME_TREND_COLUMNS(handleFetchAnalysis, sentiments);
      case 'Short-term Crossover': return SHORT_TERM_CROSSOVER_COLUMNS(handleFetchAnalysis);
      case 'VWLM': return VWLM_COLUMNS(handleFetchAnalysis);
      case 'VWLM Intraday': return VWLM_INTRADAY_COLUMNS(handleFetchAnalysis);
      case 'Portfolio Simulation': return PORTFOLIO_SIMULATION_COLUMNS(handleShowBacktestDetails);
      case 'Strategy Backtester':
      case 'User Manual': 
      case 'Recent News':
      case 'Risk Desk':
      case 'AI Coach':
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
      case 'User Manual':
        return <UserManual />;
      case 'Recent News':
        return <NewsDashboard processedStocks={processedStocks} />;
      case 'Risk Desk':
        return <RiskDashboard risk={riskAnalysis} />;
      case 'AI Coach':
        return <TradingCoach results={portfolioSimResults} />;
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
      >
        <div className="h-full overflow-auto custom-scrollbar">
            {renderContent()}
        </div>
      </Dashboard>
      
      {/* Ticker Tape */}
      <TickerTape stocks={processedStocks} />
      
      {/* Alerts Feed Widget - Intelligence Engine Output */}
      <AlertFeed 
         alerts={signalAlerts} 
         loading={isAlertsLoading} 
         onRefresh={() => runIntelligenceScan(processedStocks)}
      />

      {/* Fixed Chart Panel - Styled as Floating Terminal */}
      {hoveredStock && !['Portfolio Simulation', 'Strategy Backtester', 'User Manual', 'Recent News', 'Risk Desk', 'AI Coach'].includes(activeTab) && (
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
        factors={modalFactors} // Pass factors
        activeTab={analysisActiveTab}
        setActiveTab={setAnalysisActiveTab}
        isLoading={isAnalysisLoading}
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