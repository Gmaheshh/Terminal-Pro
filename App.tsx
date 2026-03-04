import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchStockData, Tickers } from './services/stockDataService';
import { calculateIndicators, generateSignals } from './services/technicalAnalysisService';
import { runPortfolioSimulation } from './services/backtestingService';
import { detectMarketRegime } from './services/marketRegimeService';
import { generateSignalAlerts } from './services/intelligenceEngine';
import { clearPaperState } from './services/persistenceService';
import { getComprehensiveAnalysis } from './services/geminiService';
import type { ProcessedStock, TabType, PortfolioBacktestResult, Column, StockData, MarketRegime, SignalAlert, DerivativeStrategy, TechnicalTrade, ComprehensiveAnalysis } from './types';
import { CATEGORIES, CATEGORY_MAP, VOLUME_TREND_COLUMNS, PORTFOLIO_SIMULATION_COLUMNS, VWLM_COLUMNS, MainCategory } from './constants';
import Dashboard from './components/Dashboard';
import AnalysisModal from './components/SentimentModal';
import { PortfolioSimulationDashboard } from './components/BacktestDashboard';
import BacktestDetailsModal from './components/BacktestDetailsModal';
import StockTable from './components/StockTable';
import StrategyBacktester from './components/StrategyBacktester';
import NewsDashboard from './components/NewsDashboard';
import DerivativesDashboard from './components/DerivativesDashboard';
import PayoffVisualizer from './components/PayoffVisualizer';
import PortfolioMaker from './components/PortfolioMaker';
import MacroSentimentDashboard from './components/MacroSentimentDashboard';
import PositionCalculator from './components/PositionCalculator';
import HomeHub from './components/HomeHub';
import { Loader } from './components/Loader';
import LoadingGame from './components/LoadingGame';
import TickerTape from './components/TickerTape';
import AlertFeed from './components/AlertFeed';
import StockChart from './components/StockChart';
import ChatBot from './components/ChatBot';
import LoginSignup from './components/LoginSignup';
import FAQSection from './components/FAQSection';
import CompanyAnalysis from './components/FundamentalDashboard';
import OIAnalyticsDashboard from './components/OIAnalyticsDashboard';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('pragati_session') === 'active';
  });
  const [user, setUser] = useState<{name: string} | null>(() => {
    const saved = localStorage.getItem('pragati_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing PRA-GATI Terminal...');
  const [processedStocks, setProcessedStocks] = useState<ProcessedStock[]>([]);
  const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  
  const [activeCategory, setActiveCategory] = useState<MainCategory>('Home');
  const [activeTab, setActiveTab] = useState<TabType>('Recent News');
  const [commandValue, setCommandValue] = useState('');
  
  const [initialCapital, setInitialCapital] = useState<number>(1000000);
  
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [omniAnalysisData, setOmniAnalysisData] = useState<ComprehensiveAnalysis | null>(null);
  const [modalTicker, setModalTicker] = useState<string | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
  const [modalBacktestData, setModalBacktestData] = useState<PortfolioBacktestResult | null>(null);

  const [executedStrategies, setExecutedStrategies] = useState<DerivativeStrategy[]>([]);
  const [technicalTrades, setTechnicalTrades] = useState<TechnicalTrade[]>([]);

  const [signalAlerts, setSignalAlerts] = useState<SignalAlert[]>([]);
  const [isAlertsLoading, setIsAlertsLoading] = useState(false);
  const [isAlertsVisible, setIsAlertsVisible] = useState(true);

  const [hoveredStock, setHoveredStock] = useState<ProcessedStock | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const portfolioSimResults = useMemo(() => {
    if (processedStocks.length === 0) return [];
    return runPortfolioSimulation(processedStocks, initialCapital);
  }, [processedStocks, initialCapital]);

  const handleLogin = (userData: {name: string}) => {
    localStorage.setItem('pragati_session', 'active');
    localStorage.setItem('pragati_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('pragati_session');
    setIsAuthenticated(false);
    setUser(null);
  };

  const runIntelligenceScan = async (stocks: ProcessedStock[]) => {
      setIsAlertsLoading(true);
      const alerts = await generateSignalAlerts(stocks);
      setSignalAlerts(alerts);
      setIsAlertsLoading(false);
  };

  const scanStocks = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setErrorCount(0);
    setProcessedStocks([]);
    
    const stocksWithIndicators: Omit<ProcessedStock, 'signals'>[] = [];
    const batchSize = 5; // Reduced from 15 to avoid rate limiting
    for (let i = 0; i < Tickers.length; i += batchSize) {
        const batchTickers = Tickers.slice(i, i + batchSize);
        setLoadingMessage(`SYNCING DATA BLOCK ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(Tickers.length / batchSize)}`);
        const fetchDataPromises = batchTickers.map(ticker => fetchStockData(ticker).catch(() => null));
        const fetchedBatchResults = await Promise.all(fetchDataPromises);
        for (let j = 0; j < fetchedBatchResults.length; j++) {
            const nseData = fetchedBatchResults[j] as StockData | null;
            if (nseData) {
                const indicators = calculateIndicators(nseData.historical);
                stocksWithIndicators.push({ ticker: batchTickers[j], data: nseData, indicators: indicators });
            }
        }
        // Increased delay to avoid rate limiting
        if (i + batchSize < Tickers.length) await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const finalProcessedStocks = stocksWithIndicators.map(stock => {
      const signals = generateSignals(stock.indicators, stock.data.historical);
      return { ...stock, signals: signals };
    });

    const detectedRegime = detectMarketRegime(finalProcessedStocks);

    setMarketRegime(detectedRegime);
    setProcessedStocks(finalProcessedStocks);
    setLoading(false);
    runIntelligenceScan(finalProcessedStocks);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
        scanStocks();
    }
  }, [isAuthenticated, scanStocks]);

  const handleOmniAnalysis = useCallback(async (ticker: string) => {
    setModalTicker(ticker);
    setIsAnalysisModalOpen(true);
    setOmniAnalysisData(null);
    setIsAnalysisLoading(true);
    const stock = processedStocks.find(s => s.ticker === ticker);
    if (!stock) { setIsAnalysisLoading(false); return; }
    try {
        const result = await getComprehensiveAnalysis(stock);
        setOmniAnalysisData(result);
    } catch (error: any) {
      console.error("Omni Analysis Failed", error);
    } finally {
      setIsAnalysisLoading(false);
    }
  }, [processedStocks]);

  const handleExecuteTechnicalTrade = (stock: ProcessedStock) => {
      const isVWLM = stock.signals.vwlmBuySignal || stock.signals.vwlmSellSignal;
      const direction = (stock.signals.vwlmSellSignal || stock.signals.trendSignal === 'Downtrend') ? 'SHORT' : 'LONG';
      const trade: TechnicalTrade = {
          ticker: stock.ticker,
          entryPrice: stock.data.currentPrice,
          currentPrice: stock.data.currentPrice,
          stopLoss: isVWLM ? (stock.signals.vwlmStopLoss || 0) : stock.signals.stopLoss,
          target: isVWLM ? (stock.signals.vwlmTarget || 0) : stock.signals.target,
          timestamp: new Date().toLocaleTimeString(),
          direction: direction as 'LONG' | 'SHORT',
          historical: stock.data.historical
      };
      if (!technicalTrades.some(t => t.ticker === trade.ticker)) {
        setTechnicalTrades(prev => [trade, ...prev]);
        setActiveCategory('Trading Tree');
        setActiveTab('Payoff Visualizer');
      }
  };

  const handleCommandChange = (val: string) => {
      setCommandValue(val);
      const upperVal = val.toUpperCase();
      if (upperVal === 'RESET') {
          if (confirm("SYSTEM WARNING: IRREVERSIBLE DATA PURGE REQUESTED?")) clearPaperState();
          setCommandValue('');
          return;
      }
      if (upperVal === 'NEWS') { setActiveCategory('Intelligence Hub'); setActiveTab('Recent News'); }
      else if (upperVal === 'SIM') { setActiveCategory('Trading Tree'); setActiveTab('Backtest Simulation'); }
      else if (upperVal === 'LOGOUT') handleLogout();
  };

  const handleTableHover = (stock: ProcessedStock | null, x: number, y: number) => {
      setHoveredStock(stock);
      setMousePos({ x, y });
  };

  const filteredData = useMemo(() => {
    let data = processedStocks;
    if (activeTab === 'Volume/Trend') data = processedStocks.filter(s => s.signals.volumeSignal === 'Spike');
    else if (activeTab === 'VWLM') data = processedStocks.filter(s => s.signals.vwlmBuySignal || s.signals.vwlmSellSignal);
    if (commandValue.length > 0) {
        const search = commandValue.toUpperCase();
        data = data.filter(s => s.ticker.includes(search));
    }
    return data;
  }, [processedStocks, activeTab, commandValue]);

  const columns = useMemo(() => {
    switch(activeTab) {
      case 'Volume/Trend': return VOLUME_TREND_COLUMNS(handleOmniAnalysis, handleExecuteTechnicalTrade);
      case 'VWLM': return VWLM_COLUMNS(handleOmniAnalysis, handleExecuteTechnicalTrade);
      case 'Backtest Simulation': return PORTFOLIO_SIMULATION_COLUMNS((res) => { setModalBacktestData(res); setIsBacktestModalOpen(true); });
      default: return [];
    }
  }, [activeTab, handleOmniAnalysis, handleExecuteTechnicalTrade]);

  if (!isAuthenticated) {
    return <LoginSignup onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pro-bg text-pro-text font-sans">
        <Loader className="w-12 h-12 text-pro-primary" />
        <p className="text-sm mt-6 font-bold tracking-widest text-pro-primary uppercase animate-pulse">{loadingMessage}</p>
        <div className="mt-12 w-full max-w-xl border border-pro-border bg-pro-card rounded-2xl shadow-soft p-1 overflow-hidden">
          <LoadingGame />
        </div>
      </div>
    );
  }

  const renderActiveComponent = () => {
      if (activeCategory === 'Home') return <HomeHub stocks={processedStocks} onNavigate={(cat, tab) => { setActiveCategory(cat); setActiveTab(tab); }} onAnalyze={handleOmniAnalysis} />;
      
      switch(activeTab) {
          case 'Backtest Simulation':
              return (
                <PortfolioSimulationDashboard 
                  columns={columns as Column<PortfolioBacktestResult>[]} 
                  data={portfolioSimResults}
                  capital={initialCapital}
                  onCapitalChange={setInitialCapital}
                />
              );
          case 'Strategy Backtester': return <StrategyBacktester results={portfolioSimResults} />;
          case 'Portfolio Maker': return <PortfolioMaker stocks={processedStocks} marketRegime={marketRegime?.type} />;
          case 'Position Calculator': return <PositionCalculator stocks={processedStocks} defaultAccountSize={initialCapital} />;
          case 'Macro Analysis': return <MacroSentimentDashboard />;
          case 'Company Analysis': return <CompanyAnalysis stocks={processedStocks} />;
          case 'OI Analytics': return <OIAnalyticsDashboard stocks={processedStocks} />;
          case 'Payoff Visualizer': 
              return (
                  <PayoffVisualizer 
                      strategies={executedStrategies} 
                      onCloseStrategy={(i) => setExecutedStrategies(prev => prev.filter((_, idx) => idx !== i))} 
                      technicalTrades={technicalTrades}
                      onCloseTechnical={(i) => setTechnicalTrades(prev => prev.filter((_, idx) => idx !== i))}
                  />
              );
          case 'User Manual': return <FAQSection />;
          case 'Recent News': return <NewsDashboard processedStocks={processedStocks} />;
          case 'Derivatives Desk': return <DerivativesDashboard stocks={processedStocks} onExecute={(strat) => setExecutedStrategies(prev => [...prev, strat])} onHover={handleTableHover} />;
          
          default:
              return (
                <StockTable 
                  columns={columns as Column<ProcessedStock>[]} 
                  data={filteredData} 
                  activeTab={activeTab} 
                  onHover={handleTableHover}
                />
              );
      }
  };

  return (
    <div className="h-screen bg-pro-bg text-pro-text flex flex-col overflow-hidden font-sans animate-fade-in selection:bg-pro-primary/10">
      <Dashboard
        activeCategory={activeCategory}
        setActiveCategory={(cat) => {
            setActiveCategory(cat);
            if (CATEGORY_MAP[cat].length > 0) {
                setActiveTab(CATEGORY_MAP[cat][0]);
            }
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalScanned={Tickers.length}
        errors={errorCount}
        onRefresh={scanStocks}
        stocks={processedStocks}
        regime={marketRegime}
        commandValue={commandValue}
        onCommandChange={handleCommandChange}
        userName={user?.name}
        onLogout={handleLogout}
      >
        <div className="h-full overflow-auto custom-scrollbar relative">
            {renderActiveComponent()}
            {hoveredStock && activeCategory !== 'Home' && (
                <div className="fixed z-[999] pointer-events-none transition-opacity duration-200" style={{ left: `${mousePos.x + 20}px`, top: `${mousePos.y - 150}px` }}>
                    <div className="bg-pro-card border border-pro-border shadow-heavy w-[320px] rounded-xl overflow-hidden ring-4 ring-white/50">
                        <div className="bg-pro-primary text-white px-3 py-1.5 text-[11px] font-bold flex justify-between uppercase">
                            <span>{hoveredStock.ticker}</span>
                            <span>{hoveredStock.data.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="h-44 w-full bg-white">
                             <StockChart data={hoveredStock.data.historical.slice(-60)} ticker={hoveredStock.ticker} />
                        </div>
                    </div>
                </div>
            )}
        </div>
      </Dashboard>
      
      <TickerTape stocks={processedStocks} />
      {isAlertsVisible && <AlertFeed alerts={signalAlerts} loading={isAlertsLoading} onRefresh={() => runIntelligenceScan(processedStocks)} onClose={() => setIsAlertsVisible(false)} />}

      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        ticker={modalTicker}
        data={omniAnalysisData}
        isLoading={isAnalysisLoading}
        stock={processedStocks.find(s => s.ticker === modalTicker)}
      />
      
      <BacktestDetailsModal 
        isOpen={isBacktestModalOpen}
        onClose={() => setIsBacktestModalOpen(false)}
        result={modalBacktestData}
      />
      <ChatBot />
    </div>
  );
};

export default App;