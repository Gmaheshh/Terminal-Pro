
import type { StockData, OHLCV, OptionChain, OptionContract } from '../types';
import { Tickers } from '../constants';

const cache = new Map<string, StockData>();

const PROXIES = [
  'https://corsproxy.io/?',
  'https://cors.eu.org/',
  'https://thingproxy.freeboard.io/fetch/',
];

const MAX_ATTEMPTS = 6; 
const RETRY_DELAY = 1000; 
const FETCH_TIMEOUT = 10000; 

export const fetchStockData = async (ticker: string): Promise<StockData> => {
  if (cache.has(ticker)) {
    return cache.get(ticker)!;
  }

  const yahooFinanceUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=10y&interval=1d`;
  
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const proxyUrl = PROXIES[(attempt - 1) % PROXIES.length];
    const fullUrl = proxyUrl + yahooFinanceUrl;

    try {
      const response = await fetch(fullUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new SyntaxError(`Proxy non-JSON.`);
      }

      if (!data.chart || data.chart.error) {
        throw new Error(data.chart.error?.message || `No data`);
      }
  
      const result = data.chart.result[0];
      if (!result || !result.timestamp || !result.indicators.quote[0]) {
          throw new Error(`Invalid structure`);
      }
  
      const timestamps: number[] = result.timestamp;
      const quotes = result.indicators.quote[0];
      const rawOi = result.indicators.quote[0].openinterest || [];
  
      const historical: OHLCV[] = [];
      
      let currentBaseOi = 1000000 + (Math.random() * 2000000);

      for (let i = 0; i < timestamps.length; i++) {
          if (timestamps[i] && quotes.close[i] !== null) {
              
              const priceChange = i > 0 ? (quotes.close[i] - quotes.close[i-1]) / quotes.close[i-1] : 0;
              const vol = quotes.volume[i] || 0;
              
              if (priceChange > 0.01 && vol > 500000) {
                  currentBaseOi *= (1 + 0.02 + Math.random() * 0.04);
              } else if (priceChange < -0.01) {
                  currentBaseOi *= (1 - 0.01); 
              } else {
                  currentBaseOi *= (1 + (Math.random() * 0.002 - 0.001));
              }

              const simulatedOi = rawOi[i] || currentBaseOi;
              
              historical.push({
                  date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                  open: quotes.open[i],
                  high: quotes.high[i],
                  low: quotes.low[i],
                  close: quotes.close[i],
                  volume: quotes.volume[i],
                  openInterest: simulatedOi,
              });
          }
      }
  
      if (historical.length === 0) {
        throw new Error(`No historical points`);
      }
      
      const currentPrice = historical[historical.length - 1].close;
      const stockData: StockData = { ticker, currentPrice, historical };
  
      cache.set(ticker, stockData);
      return stockData;
    
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  throw lastError!;
};

/**
 * Simulates a realistic Option Chain based on the underlying price.
 */
export const fetchOptionChain = (ticker: string, underlyingPrice: number): OptionChain => {
    const strikeInterval = underlyingPrice < 500 ? 5 : underlyingPrice < 2000 ? 20 : 50;
    const atmStrike = Math.round(underlyingPrice / strikeInterval) * strikeInterval;
    
    const strikes = [];
    for (let i = -10; i <= 10; i++) {
        strikes.push(atmStrike + (i * strikeInterval));
    }

    const generateContract = (strike: number, isCall: boolean): OptionContract => {
        const distance = isCall ? (strike - underlyingPrice) : (underlyingPrice - strike);
        const intrinsic = Math.max(0, isCall ? (underlyingPrice - strike) : (strike - underlyingPrice));
        
        // Simplified Black-Scholes-like approximation for demo
        const timeValue = Math.max(2, (underlyingPrice * 0.05) / (1 + Math.abs(distance / strikeInterval)));
        const price = intrinsic + timeValue;
        
        const baseIV = 15 + Math.random() * 10;
        const skew = Math.abs(distance / strikeInterval) * 2;
        
        return {
            strike,
            price: Number(price.toFixed(2)),
            change: Number((Math.random() * 10 - 5).toFixed(2)),
            iv: Number((baseIV + skew).toFixed(1)),
            oi: Math.round(10000 / (1 + Math.abs(distance / strikeInterval) * 2)),
            volume: Math.round(5000 / (1 + Math.abs(distance / strikeInterval) * 3))
        };
    };

    return {
        ticker,
        expiryDate: '27-MAR-2025', // Simulated nearest monthly expiry
        underlyingPrice,
        calls: strikes.map(s => generateContract(s, true)),
        puts: strikes.map(s => generateContract(s, false))
    };
};

export { Tickers };
