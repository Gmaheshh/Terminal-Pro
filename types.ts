
import type { ReactNode } from 'react';

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openInterest?: number;
}

export interface FinancialStatementRow {
  label: string;
  values: number[]; 
  percentages?: number[];
}

export interface FundamentalData {
  peRatio?: number;
  pbRatio?: number;
  roe?: number;
  roce?: number;
  debtToEquity?: number;
  currentRatio?: number;
  dividendYield?: number;
  marketCap?: number;
  eps?: number;
  sector?: string;
  industry?: string;
  years: string[]; 
  incomeStatement?: FinancialStatementRow[];
  balanceSheet?: FinancialStatementRow[];
  cashFlowStatement?: FinancialStatementRow[];
}

export interface StockData {
  ticker: string;
  currentPrice: number;
  historical: OHLCV[];
  fundamentals?: FundamentalData;
}

export interface TechnicalIndicators {
  atr: number[];
  atr7: number[];
  adx: number[];
  plusDI: number[];
  minusDI: number[];
  avgVolume: number;
  rvol: number[];
  volatilityPct: number[];
  volEma5: number[];
  volEma20: number[];
  ema9: number[];
  ema10: number[];
  ema13: number[];
  ema200: number[]; 
  macdLine: number[];
  macdSignal: number[];
  rsi: number[];
  stochRsi: number[];
  sma20: number[];
  sma50: number[];
  sma200: number[];
  obv: number[];
  avdm: number[];
  xt: number[];
  ema9Xt: number[];
  ema21Xt: number[];
  bbUpper?: number[];
  bbLower?: number[];
  bbMid?: number[];
  isSqueezing?: boolean[];
  high52Week?: number;
  oiChangePct: number[];
  oiSmartMoneyScore: number[];
}

export interface SignalFactors {
    momentum: number;
    volume: number;
    trend: number;
    volatility: number;
    institutional: number;
    dominantFactor: 'MOMENTUM' | 'VOLUME' | 'TREND' | 'VOLATILITY' | 'INSTITUTIONAL' | 'BALANCED';
}

export interface Signals {
  volumeSignal: 'Spike' | 'Normal';
  trendSignal: 'Uptrend' | 'Downtrend' | 'Weak';
  volumeEmaSignal: 'Bullish' | 'Bearish' | 'Neutral';
  volumeSpikeSignalDate: string;
  stopLoss: number;
  target: number;
  volumeStatus: 'High 🔺' | 'Low 🔻' | 'Average ➖' | 'NA';
  priceAboveEma10: boolean;
  suggestedShares?: number;
  oiBuild: number;
  expiryDate: string;
  daysToExpiry: number;
  vwlmBuySignal: boolean;
  vwlmBuySignalDate: string;
  vwlmSellSignal: boolean;
  vwlmSellSignalDate: string;
  vwlmStrength: number;
  vwlmStopLoss?: number;
  vwlmTarget?: number;
  factors: SignalFactors;
  distFrom52WHigh: number;
  accumulationSignal: boolean;
  accumulationDate: string;
  accumulationStatus: 'Watchlist' | 'Confirmed' | 'Invalidated' | 'None';
  accumulationMovePct: number;
  accumulationLow: number;
  accumulationDays: number;
}

export interface ProcessedStock {
  ticker: string;
  data: StockData;
  indicators: TechnicalIndicators;
  signals: Signals;
}

export interface DerivativeStrategy {
  ticker: string;
  name: string;
  type: 'ARBITRAGE' | 'STRANGLE' | 'STRADDLE' | 'RATIO' | 'CONDOR' | 'SPREAD';
  bias: string;
  rationale: string;
  explanation: string;
  tradeStructure: {
    leg: string;
    action: 'BUY' | 'SELL';
    strike: number | 'FUT' | 'SPOT';
    type: 'CE' | 'PE' | 'FUT' | 'CASH';
    premium: number;
  }[];
  maxProfit: number;
  maxLoss: number;
  fixedCost: number; 
  variableCost: number; 
  breakevens: number[];
  rrRatio: string;
  greeks: {
    delta: number;
    theta: number;
    vega: number;
    gamma: number;
  };
  confidence: number;
  payoffPoints: { price: number; pnl: number }[];
  executionPrice: number;
  timestamp: string;
}

export interface FuturesBacktestResult {
    totalPnl: number;
    winRate: number;
    totalTrades: number;
    trades: FuturesTrade[];
    finalCapital: number;
}

export interface FuturesTrade {
    ticker: string;
    type: 'LONG' | 'SHORT';
    lots: number;
    invested: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    status: 'OPEN' | 'CLOSED';
    exitReason?: string;
    entryDate?: string;
    exitDate?: string;
}

export interface OIAnalyticsData {
    ticker: string;
    spot: number;
    futures: number;
    currentMonthOI: number;
    nextMonthOI: number;
    farMonthOI: number;
    totalOI: number;
    rolloverPct: number;
    trend: 'UPWARD' | 'DOWNWARD' | 'SIDEWAYS';
    adx: number;
    oiChangePct: number;
    oiSignal: 'LONG BUILDUP' | 'SHORT BUILDUP' | 'SHORT COVERING' | 'LONG UNWINDING' | 'NEUTRAL';
}

export interface OptionContract {
  strike: number;
  price: number;
  change: number;
  iv: number;
  oi: number;
  volume: number;
}

export interface OptionChain {
  ticker: string;
  expiryDate: string;
  underlyingPrice: number;
  futuresPrice: number;
  calls: OptionContract[];
  puts: OptionContract[];
}

export type TabType = 'Volume/Trend' | 'VWLM' | 'Derivatives Desk' | 'OI Analytics' | 'Payoff Visualizer' | 'Macro Analysis' | 'Portfolio Maker' | 'Recent News' | 'Position Calculator' | 'User Manual' | 'Company Analysis' | 'Backtest Simulation' | 'Strategy Backtester';

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface ComprehensiveAnalysis {
  ticker: string;
  candlestickPattern: string;
  chartPattern: string;
  fibonacciLevels: {
    level0: number;
    level382: number;
    level50: number;
    level618: number;
    level100: number;
  };
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  newsSummary: string;
  volatilityThesis: string;
  alphaReasoning: string;
  breakoutPotential: number;
}

export interface MarketRegime {
    type: 'TRENDING' | 'RISK_OFF' | 'HIGH_VOLATILITY' | 'RANGE_BOUND' | 'NEUTRAL';
    avgAdx: number;
    avgVolatility: number;
    breadthSma50: number;
    correlation: number;
    description: string;
}

export interface SignalAlert {
    ticker: string;
    signalDirection: 'LONG' | 'SHORT';
    event: string;
    impact: 'CONFIRMING' | 'THREATENING' | 'NEUTRAL';
    reason: string;
    timestamp: string;
}

export interface PortfolioBacktestResult {
  strategy: string;
  period: '1Y' | '3Y' | '5Y' | '10Y';
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  cagr: number;
  maxDrawdown: number;
  trades: Trade[];
  initialCapital: number;
  finalCapital: number;
  equityCurve: { time: string; value: number }[];
  totalCharges: number;
  netReturn: number;
  netFinalCapital: number;
  // Added isBenchmark property to support components that visualize benchmark data
  isBenchmark?: boolean;
}

export interface Trade {
  ticker: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  pnl: number;
  tradeRoI: number;
  shares: number;
  entryCapital: number;
  exitCapital: number;
  charges?: number;
}

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  sortable?: boolean;
  tooltip?: string;
}

export interface TechnicalTrade {
    ticker: string;
    entryPrice: number;
    currentPrice: number;
    stopLoss: number;
    target: number;
    timestamp: string;
    direction: 'LONG' | 'SHORT';
    historical: OHLCV[];
}

export interface EmaSignalResult {
  ticker: string;
  price: number;
  signal: string;
  ema9: number;
  ema13: number;
  macd: number;
  macdSignal: number;
  rsi: number;
  stochRsi: number;
  atr: number;
}

export interface MacroDeepDive {
  summary: string;
  consequences: { step: string; impact: string }[];
  impactedStocks: { ticker: string; sentiment: 'Bullish' | 'Bearish'; keyMetric: string; reasoning: string }[];
  finalRecommendation: string;
}

export interface FundamentalFilters {
  maxPE?: number;
  maxPB?: number;
  minROE?: number;
  maxDebtEquity?: number;
  minDivYield?: number;
}

export interface Sentiment {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
}

export interface TechnicalInsight {
  thesis: string;
  outlook: 'Bullish' | 'Bearish' | 'Neutral';
  keyFactors: string[];
  confidenceScore: number;
}

export interface CoachInsight {
  traderArchetype: string;
  mentalCapitalScore: number;
  psychologicalTraits: {
    discipline: number;
    patience: number;
    riskMgmt: number;
    consistency: number;
  };
  detectedBiases: string[];
  actionableFeedback: string;
}

export interface LogisticsAnalysis {
  analysisText: string;
  outlook: 'Bullish' | 'Bearish' | 'Neutral';
  detectedLocations: MapLocation[];
}

export interface EquityPoint {
  time: string;
  value: number;
}

export interface NewsItem {
  title: string;
  summary: string;
  relatedTickers: string[];
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface SearchSource {
  uri: string;
  title: string;
}

export interface NewsResult {
  items: NewsItem[];
  sources: SearchSource[];
}

export type RegimeType = 'TRENDING' | 'RISK_OFF' | 'HIGH_VOLATILITY' | 'RANGE_BOUND' | 'NEUTRAL';

export interface RiskAnalysis {
  totalCapital: number;
  totalExposure: number;
  exposureRatio: number;
  varDaily: number;
  concentration: {
    defensive: number;
    cyclical: number;
    speculative: number;
  };
  strategyOverlap: number;
  maxSinglePositionRisk: number;
  maxSinglePositionTicker: string;
  status: 'SAFE' | 'CAUTION' | 'CRITICAL';
  recommendation: string;
}

export interface MapLocation {
  uri: string;
  title: string;
}

export interface ArbitrageOpportunity {
  ticker: string;
  nsePrice: number;
  bsePrice: number;
  spread: number;
  spreadPct: number;
  signal: 'BUY_NSE_SELL_BSE' | 'BUY_BSE_SELL_NSE' | 'NEUTRAL';
}

export interface PortfolioMetrics {
  annualReturn: number;
  annualVolatility: number;
  sharpeRatio: number;
  optimalWeights: Record<string, number>;
  recommendations: OptimizationRecommendation[];
  aiInsight: string;
}

export interface OptimizationRecommendation {
  ticker: string;
  action: 'ADD' | 'REMOVE';
  reason: string;
  expectedImpactOnSharpe: number;
  historicalSharpe: number;
}

export interface OpenAlgoConfig {
  apiUrl: string;
  apiPrefix: string;
  apikey: string;
  isActive: boolean;
}

export interface OpenAlgoOrder {
  status: 'SENT' | 'FAILED';
  response: string;
}

export interface PaperAccount {
  startingCapital: number;
  cashBalance: number;
  usedMargin: number;
  totalEquity: number;
  lastUpdated: string;
}

export interface PaperOrder {
  id: string;
  ticker: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MARKET' | 'LIMIT';
  limitPrice?: number;
  status: 'CONFIRMED' | 'FILLED' | 'CANCELLED';
  timestamp: string;
  strategy: string;
  stopLoss?: number;
  target?: number;
}

export interface PaperTrade {
  id: string;
  orderId: string;
  ticker: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
  charges: number;
}

export interface PaperPosition {
  ticker: string;
  quantity: number;
  avgPrice: number;
  lastPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  stopLoss?: number;
  target?: number;
  strategy?: string;
}

export interface PaperRiskConfig {
  maxAllocationPerTrade: number;
  maxTotalExposure: number;
}

export interface MacroSentimentResult {
  globalEconomy: MacroSectorSentiment[];
  indianEconomy: MacroSectorSentiment[];
  tradeAndTariffs: MacroSectorSentiment[];
  institutionalPulse: MacroSectorSentiment[];
  overallConsensus: string;
  sources: SearchSource[];
}

export interface MacroSectorSentiment {
  label: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  impactLevel: 'High' | 'Medium' | 'Low';
  description: string;
  effects: string;
  affectedSectors: string[];
  impactedStocks: string[];
}
