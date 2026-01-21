
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

export interface FundamentalData {
  peRatio?: number;
  pbRatio?: number;
  roe?: number;
  debtToEquity?: number;
  dividendYield?: number;
  marketCap?: number;
  eps?: number;
  sector?: string;
  industry?: string;
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
  kcUpper?: number[];
  kcLower?: number[];
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

export interface SignalAlert {
    ticker: string;
    signalDirection: 'LONG' | 'SHORT';
    event: string;
    impact: 'CONFIRMING' | 'THREATENING' | 'NEUTRAL';
    reason: string;
    timestamp: string;
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
}

export interface ProcessedStock {
  ticker: string;
  data: StockData;
  indicators: TechnicalIndicators;
  signals: Signals;
}

export interface SearchSource {
  uri: string;
  title: string;
}

export interface Sentiment {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral' | 'Error';
  summary: string;
  sources?: SearchSource[];
}

export interface TechnicalInsight {
    thesis: string;
    outlook: 'Bullish' | 'Bearish' | 'Neutral';
    keyFactors: string[];
    confidenceScore: number;
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
  netPnl?: number;
}

export interface EquityPoint {
    time: string;
    value: number;
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
  equityCurve: EquityPoint[];
  isBenchmark?: boolean;
  totalCharges: number;
  netReturn: number;
  netFinalCapital: number;
}

export interface NewsItem {
  title: string;
  summary: string;
  relatedTickers: string[];
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface NewsResult {
    items: NewsItem[];
    sources: SearchSource[];
}

export type RegimeType = 'TRENDING' | 'RISK_OFF' | 'HIGH_VOLATILITY' | 'RANGE_BOUND' | 'NEUTRAL';

export interface MarketRegime {
    type: RegimeType;
    avgAdx: number;
    avgVolatility: number;
    breadthSma50: number;
    correlation: number;
    description: string;
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

export interface ArbitrageOpportunity {
  ticker: string;
  nsePrice: number;
  bsePrice: number;
  spread: number;
  spreadPct: number;
  signal: 'BUY NSE' | 'BUY BSE' | 'NEUTRAL';
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

export interface MapLocation {
    title: string;
    uri: string;
}

export interface LogisticsAnalysis {
    analysisText: string;
    outlook: 'Bullish' | 'Bearish' | 'Neutral';
    detectedLocations: MapLocation[];
}

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

export type TabType = 'Volume/Trend' | 'VWLM' | 'Derivatives Desk' | 'Payoff Visualizer' | 'Portfolio Maker' | 'Backtest Simulation' | 'Strategy Backtester' | 'Forward Test' | 'Recent News' | 'User Manual';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  sortable?: boolean;
}

// Option & Derivative Types
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
  calls: OptionContract[];
  puts: OptionContract[];
}

export interface PayoffPoint {
  price: number;
  pnl: number;
}

export interface StrategyLeg {
  leg: string;
  action: 'BUY' | 'SELL';
  strike: number;
  type: 'CE' | 'PE';
  premium: number;
}

export interface DerivativeStrategy {
  ticker: string;
  name: string;
  bias: 'Bullish' | 'Bearish' | 'Range-bound' | 'Volatile';
  volatilityRegime: 'Low IV' | 'Neutral IV' | 'High IV';
  rationale: string;
  tradeStructure: StrategyLeg[];
  maxProfit: string;
  maxLoss: string;
  breakevens: string[];
  rrRatio: string;
  greeks: {
    delta: string;
    theta: string;
    vega: string;
  };
  confidence: {
    score: number;
    strengths: string[];
    keyRisk: string;
  };
  backtest: {
    winRate: string;
    avgReturn: string;
    notes: string;
  };
  warnings: string;
  payoffPoints: PayoffPoint[];
  holdingPeriod: string;
  executionPrice: number;
  timestamp: string;
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

export interface DerivativeMetrics {
  totalOI: number;
  rolloverPct: number;
  putCallRatio: number;
  avgIV: number;
  maxPain: number;
}

// Portfolio Optimization Types
export interface OptimizationRecommendation {
    ticker: string;
    action: 'ADD' | 'REMOVE' | 'WEIGHT_UP' | 'WEIGHT_DOWN' | 'RETAIN';
    reason: string;
    expectedImpactOnSharpe: number;
    historicalSharpe: number;
}

export interface FundamentalFilters {
  maxPE?: number;
  maxPB?: number;
  minROE?: number;
  maxDebtEquity?: number;
  minDivYield?: number;
}

export interface PortfolioMetrics {
    annualReturn: number;
    annualVolatility: number;
    sharpeRatio: number;
    beta?: number;
    optimalWeights: Record<string, number>; // Maps Ticker -> % Weight
    recommendations: OptimizationRecommendation[];
    aiInsight?: string;
}

// OpenAlgo Types
export interface OpenAlgoOrder {
    id: string;
    timestamp: string;
    ticker: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    strategy: string;
    price: number;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'REJECTED';
    response?: string;
}

export interface OpenAlgoConfig {
    apiUrl: string;
    apikey: string;
    isSandbox: boolean;
    isActive: boolean;
}
