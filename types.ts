

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
  atr3: number[]; // Added for Intraday/Tight stops
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
  ema3Xt: number[]; // Added for Intraday VWLM
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

  shortTermCrossBuySignal: boolean;
  shortTermCrossBuySignalDate: string;
  stcStopLoss?: number;
  stcTarget?: number;

  shortTermCrossSellSignal: boolean;
  shortTermCrossSellSignalDate: string;
  stcSellStopLoss?: number;
  stcSellTarget?: number;
  
  vwlmBuySignal: boolean;
  vwlmBuySignalDate: string;
  vwlmSellSignal: boolean;
  vwlmSellSignalDate: string;
  vwlmStrength: number;
  vwlmStopLoss?: number;
  vwlmTarget?: number;

  // New Intraday VWLM Signals
  vwlmIntradayBuySignal: boolean;
  vwlmIntradayBuySignalDate: string;
  vwlmIntradaySellSignal: boolean;
  vwlmIntradaySellSignalDate: string;
  vwlmIntradayStrength: number;
  vwlmIntradayStopLoss?: number;
  vwlmIntradayTarget?: number;
  
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

export interface EmaSignalResult {
  ticker: string;
  price: number;
  signal: string;
  ema9: number;
  ema13: number;
  macd: number;
  macdSignal: number;
  rsi: number;
  atr: number;
  stochRsi: number;
}

export type RegimeType = 'TRENDING' | 'RANGE_BOUND' | 'HIGH_VOLATILITY' | 'RISK_OFF' | 'NEUTRAL';

export interface MarketRegime {
    type: RegimeType;
    avgAdx: number;
    avgVolatility: number; // Average ATR%
    breadthSma50: number; // % of stocks above SMA50
    correlation: number; // 0 to 1, directional alignment
    description: string;
}

export interface RiskAnalysis {
    totalCapital: number;
    totalExposure: number;
    exposureRatio: number; // Exposure / Capital
    varDaily: number; // Value at Risk (Daily)
    concentration: {
        defensive: number; // % Allocation in low vol
        cyclical: number; // % Allocation in mid vol
        speculative: number; // % Allocation in high vol
    };
    strategyOverlap: number; // % of tickers appearing in multiple active strategies
    maxSinglePositionRisk: number; // Highest single position % of portfolio
    maxSinglePositionTicker: string;
    status: 'SAFE' | 'CAUTION' | 'CRITICAL';
    recommendation: string;
}

export interface CoachInsight {
    traderArchetype: string; // e.g. "The Sniper", "The Gambler"
    mentalCapitalScore: number; // 0-100
    psychologicalTraits: {
        discipline: number;
        patience: number;
        riskMgmt: number;
        consistency: number;
    };
    detectedBiases: string[]; // e.g., "Revenge Trading", "FOMO"
    actionableFeedback: string;
}

export type TabType = 'Volume/Trend' | 'Short-term Crossover' | 'VWLM' | 'VWLM Intraday' | 'Risk Desk' | 'AI Coach' | 'Portfolio Simulation' | 'Strategy Backtester' | 'User Manual' | 'Recent News';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((data: T) => ReactNode);
  sortable?: boolean;
}