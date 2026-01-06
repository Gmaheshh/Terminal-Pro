import type { ReactNode } from 'react';

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockData {
  ticker: string;
  currentPrice: number;
  historical: OHLCV[];
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
}

export type SignalType = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' | 'Neutral';
export type VolumeSignal = 'Spike' | 'Normal';
export type TrendSignal = 'Uptrend' | 'Downtrend' | 'Weak';
export type VolumeEmaSignal = 'Bullish' | 'Bearish' | 'Neutral';
export type VolumeStatus = 'High 🔺' | 'Low 🔻' | 'Average ➖' | 'NA';

export interface SignalFactors {
    momentum: number; // 0-100
    volume: number;   // 0-100
    trend: number;    // 0-100
    volatility: number; // 0-100
    dominantFactor: 'MOMENTUM' | 'VOLUME' | 'TREND' | 'VOLATILITY' | 'BALANCED';
}

export type AlertImpact = 'CONFIRMING' | 'THREATENING' | 'NEUTRAL';

export interface SignalAlert {
    ticker: string;
    signalDirection: 'LONG' | 'SHORT';
    event: string;
    impact: AlertImpact;
    reason: string;
    timestamp: string;
}

export interface Signals {
  volumeSignal: VolumeSignal;
  trendSignal: TrendSignal;
  volumeEmaSignal: VolumeEmaSignal;
  volumeSpikeSignalDate: string;
  stopLoss: number;
  target: number;
  volumeStatus: VolumeStatus;
  priceAboveEma10: boolean;
  suggestedShares?: number;
  
  vwlmBuySignal: boolean;
  vwlmBuySignalDate: string;
  vwlmSellSignal: boolean;
  vwlmSellSignalDate: string;
  vwlmStrength: number;
  vwlmStopLoss?: number;
  vwlmTarget?: number;

  // Factor Attribution
  factors: SignalFactors;
}


export interface ProcessedStock {
  ticker: string;
  data: StockData;
  indicators: TechnicalIndicators;
  signals: Signals;
  intelligence?: SignalAlert[]; // Added intelligence field
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
    confidenceScore: number; // 0-100
}

export interface NewsItem {
  title: string;
  summary: string;
  relatedTickers: string[];
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  timestamp?: string;
}

export interface NewsResult {
    items: NewsItem[];
    sources: SearchSource[];
}

export interface Trade {
  ticker: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  pnl: number; // Profit/Loss in currency
  tradeRoI: number; // This is return on investment for the trade
  shares: number;
  entryCapital: number;
  exitCapital: number;
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
}

export type TabType = 'Volume/Trend' | 'VWLM' | 'Portfolio Simulation' | 'Strategy Backtester' | 'User Manual' | 'Recent News';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  sortable?: boolean;
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
