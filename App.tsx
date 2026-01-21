
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchStockData, Tickers } from './services/stockDataService';
import { calculateIndicators, generateSignals } from './services/technicalAnalysisService';
import { getSentiment, getTechnicalInsight } from './services/geminiService';
import { runPortfolioSimulation } from './services/backtestingService';
import { detectMarketRegime } from './services/marketRegimeService';
import { generateSignalAlerts } from './services/intelligenceEngine';
import type { ProcessedStock, Sentiment, TabType, PortfolioBacktestResult, Column, StockData, TechnicalInsight, MarketRegime, SignalFactors, SignalAlert, DerivativeStrategy, TechnicalTrade } from './types';
import { TABS, VOLUME_TREND_COLUMNS, PORTFOLIO_SIMULATION_COLUMNS, VWLM_COLUMNS } from './constants';
import Dashboard from './components/Dashboard';
import AnalysisModal from './components/SentimentModal';
import { PortfolioSimulationDashboard } from './components/BacktestDashboard';
import BacktestDetailsModal from './components/BacktestDetailsModal';
import StockTable from './components/StockTable';
import UserManual from './components/UserManual';
import StrategyBacktester from './components/StrategyBacktester';
import NewsDashboard from './components/NewsDashboard';
import DerivativesDashboard from './components/DerivativesDashboard';
import PayoffVisualizer from './components/PayoffVisualizer';
import PortfolioMaker from './components/PortfolioMaker';
import ForwardTester from './components/ForwardTester';
import { Loader } from './components/Loader';
import LoadingGame from './components/LoadingGame';
import TickerTape from './components/TickerTape';
import AlertFeed from './components/AlertFeed';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing GP Alpha Terminal...');
  const [processedStocks, setProcessedStocks] = useState<ProcessedStock[]>([]);
  const [portfolioSimResults, setPortfolioSimResults] = useState<PortfolioBacktestResult[]>([]);
  const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('Volume/Trend');
  const [commandValue, setCommandValue] = useState('');
  
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

  const [executedStrategies, setExecutedStrategies] = useState<DerivativeStrategy[]>([]);
  const [technicalTrades, setTechnicalTrades] = useState<TechnicalTrade[]>([]);

  const scanStocks = useCallback(async () => {
    setLoading(true);
    setErrorCount(0);
    setProcessedStocks([]);
    setPortfolioSimResults([]);
    
    const stocksWithIndicators: Omit<ProcessedStock, 'signals'>[] = [];
    const niftyBenchmark = await fetchStockData('^NSEI').catch(() => null);

    const batchSize = 15; 
    for (let i = 0; i < Tickers.length; i += batchSize) {
        const batchTickers = Tickers.slice(i, i + batchSize);
        setLoadingMessage(`> SYNCING DATA BLOCK ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(Tickers.length / batchSize)}`);

        const fetchDataPromises = batchTickers.map(ticker => fetchStockData(ticker).catch(() => null));
        const fetchedBatchResults = await Promise.all(fetchDataPromises);

        for (let j = 0; j < fetchedBatchResults.length; j++) {
            const nseData = fetchedBatchResults[j] as StockData | null;
            if (nseData) {
                const indicators = calculateIndicators(nseData.historical);
                stocksWithIndicators.push({ ticker: batchTickers[j], data: nseData, indicators: indicators });
            }
        }
        if (i + batchSize < Tickers.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    const finalProcessedStocks = stocksWithIndicators.map(stock => {
      const signals = generateSignals(stock.indicators, stock.data.historical);
      return { ...stock, signals: signals };
    });

    const simResults = runPortfolioSimulation(finalProcessedStocks, undefined);
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
      if (error?.message?.includes('429')) {
          setErrorCount(prev => prev + 1);
      }
    } finally {
      setIsAnalysisLoading(false);
    }
  }, [processedStocks, sentiments, theses]);

  const handleExecuteStrategy = (strategy: DerivativeStrategy) => {
    setExecutedStrategies(prev => [strategy, ...prev]);
    setActiveTab('Payoff Visualizer');
  };

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
        setActiveTab('Payoff Visualizer');
      }
  };

  const handleCloseStrategy = (index: number) => {
    setExecutedStrategies(prev => prev.filter((_, i) => i !== index));
  };

  const handleCloseTechnicalTrade = (index: number) => {
    setTechnicalTrades(prev => prev.filter((_, i) => i !== index));
  };

  const handleCommandChange = (val: string) => {
      setCommandValue(val);
      const upperVal = val.toUpperCase();
      if (upperVal === 'NEWS') setActiveTab('Recent News');
      else if (upperVal === 'SIM' || upperVal === 'PORT' || upperVal === 'BACKTEST') setActiveTab('Backtest Simulation');
      else if (upperVal === 'STRAT' || upperVal === 'BACK') setActiveTab('Strategy Backtester');
      else if (upperVal === 'HELP' || upperVal === 'MAN') setActiveTab('User Manual');
      else if (upperVal === 'VOL') setActiveTab('Volume/Trend');
      else if (upperVal === 'VWLM') setActiveTab('VWLM');
      else if (upperVal === 'OPT' || upperVal === 'DER') setActiveTab('Derivatives Desk');
      else if (upperVal === 'VIS' || upperVal === 'PAYOFF') setActiveTab('Payoff Visualizer');
      else if (upperVal === 'MAKER' || upperVal === 'OPTIMIZE') setActiveTab('Portfolio Maker');
      else if (upperVal === 'TEST' || upperVal === 'SYNC' || upperVal === 'FORWARD') setActiveTab('Forward Test');
  };

  const filteredData = useMemo(() => {
    let data = processedStocks;
    if (activeTab === 'Volume/Trend') {
        data = processedStocks.filter(s => s.signals.volumeSignal === 'Spike');
    } else if (activeTab === 'VWLM') {
        data = processedStocks.filter(s => s.signals.vwlmBuySignal || s.signals.vwlmSellSignal);
    }
    if (commandValue.length > 0) {
        const search = commandValue.toUpperCase();
        const keywords = ['NEWS', 'SIM', 'PORT', 'BACKTEST', 'STRAT', 'BACK', 'HELP', 'MAN', 'VOL', 'VWLM', 'OPT', 'DER', 'VIS', 'PAYOFF', 'ALERTS', 'INTEL', 'MAKER', 'OPTIMIZE', 'TEST', 'SYNC', 'FORWARD'];
        if (!keywords.includes(search)) {
             data = data.filter(s => s.ticker.includes(search));
        }
    }
    return data;
  }, [processedStocks, activeTab, commandValue]);

  const columns = useMemo(() => {
    switch(activeTab) {
      case 'Volume/Trend': return VOLUME_TREND_COLUMNS(handleFetchAnalysis, handleExecuteTechnicalTrade);
      case 'VWLM': return VWLM_COLUMNS(handleFetchAnalysis, handleExecuteTechnicalTrade);
      case 'Backtest Simulation': return PORTFOLIO_SIMULATION_COLUMNS((res) => { setModalBacktestData(res); setIsBacktestModalOpen(true); });
      default: return [];
    }
  }, [activeTab, handleFetchAnalysis, handleExecuteTechnicalTrade]);

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

  return (
    <div className="h-screen bg-bb-black text-bb-text flex flex-col overflow-hidden font-sans">
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
            {activeTab === 'Backtest Simulation' && <PortfolioSimulationDashboard columns={columns as Column<PortfolioBacktestResult>[]} data={portfolioSimResults} />}
            {activeTab === 'Strategy Backtester' && <StrategyBacktester results={portfolioSimResults} />}
            {activeTab === 'Derivatives Desk' && <DerivativesDashboard stocks={processedStocks} onExecute={handleExecuteStrategy} />}
            {activeTab === 'Portfolio Maker' && <PortfolioMaker stocks={processedStocks} marketRegime={marketRegime?.type} />}
            {activeTab === 'Forward Test' && <ForwardTester processedStocks={processedStocks} />}
            {activeTab === 'Payoff Visualizer' && (
                <PayoffVisualizer 
                    strategies={executedStrategies} 
                    onCloseStrategy={handleCloseStrategy} 
                    technicalTrades={technicalTrades}
                    onCloseTechnical={handleCloseTechnicalTrade}
                />
            )}
            {activeTab === 'User Manual' && <UserManual />}
            {activeTab === 'Recent News' && <NewsDashboard processedStocks={processedStocks} />}
            {!['Backtest Simulation', 'Strategy Backtester', 'Derivatives Desk', 'Portfolio Maker', 'Payoff Visualizer', 'User Manual', 'Recent News', 'Forward Test'].includes(activeTab) && (
              <StockTable 
                columns={columns as Column<ProcessedStock>[]} 
                data={filteredData} 
                activeTab={activeTab} 
              />
            )}
        </div>
      </Dashboard>
      
      <TickerTape stocks={processedStocks} />
      {isAlertsVisible && <AlertFeed alerts={signalAlerts} loading={isAlertsLoading} onRefresh={() => runIntelligenceScan(processedStocks)} onClose={() => setIsAlertsVisible(false)} />}

      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        ticker={modalTicker}
        sentiment={sentimentData}
        technicalThesis={thesisData}
        factors={modalFactors}
        activeTab={analysisActiveTab}
        setActiveTab={setAnalysisActiveTab}
        isLoading={isAnalysisLoading}
      />
      <BacktestDetailsModal 
        isOpen={isBacktestModalOpen}
        onClose={() => setIsBacktestModalOpen(false)}
        result={modalBacktestData}
      />
    </div>
  );
};

export default App;
