import type { StockData, OHLCV } from '../types';
import { Tickers } from '../constants';

// A simple in-session cache to avoid re-fetching data during a session
const cache = new Map<string, StockData>();

// A pool of public CORS proxies to rotate through.
// This provides redundancy if one of the services is down or rate-limiting.
const PROXIES = [
  'https://corsproxy.io/?',
  'https://cors.eu.org/',
  'https://thingproxy.freeboard.io/fetch/',
];

const MAX_ATTEMPTS = 6; // Total attempts, will cycle through proxies
const RETRY_DELAY = 1000; // 1 second base delay
const FETCH_TIMEOUT = 10000; // 10 seconds

/**
 * Fetches real stock data from the Yahoo Finance API via a pool of rotating CORS proxies.
 * Includes a retry mechanism that cycles through different proxies to handle transient network errors
 * and individual proxy failures, including non-JSON responses.
 *
 * NOTE: Using public CORS proxies remains a solution for development/demo purposes.
 * For a production application, a dedicated backend service is the most reliable approach.
 *
 * @param {string} ticker The stock ticker symbol (e.g., 'RELIANCE.NS').
 * @returns {Promise<StockData>} A promise that resolves to the stock's data.
 */
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
        throw new Error(`HTTP error! status: ${response.status} for ticker: ${ticker} using proxy: ${proxyUrl}`);
      }
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // This catch block handles JSON parsing errors. The proxy likely returned HTML or other non-JSON content.
        const errorSnippet = responseText.substring(0, 150).replace(/\s+/g, ' ');
        throw new SyntaxError(`Proxy returned non-JSON content. Snippet: "${errorSnippet}..."`);
      }


      if (!data.chart || data.chart.error) {
        throw new Error(data.chart.error?.message || `No data found for ${ticker}`);
      }
  
      const result = data.chart.result[0];
      if (!result || !result.timestamp || !result.indicators.quote[0]) {
          throw new Error(`Invalid data structure for ${ticker}`);
      }
  
      const timestamps: number[] = result.timestamp;
      const quotes = result.indicators.quote[0];
  
      const historical: OHLCV[] = [];
      for (let i = 0; i < timestamps.length; i++) {
          if (timestamps[i] && quotes.open[i] !== null && quotes.high[i] !== null && quotes.low[i] !== null && quotes.close[i] !== null && quotes.volume[i] !== null) {
              historical.push({
                  date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                  open: quotes.open[i],
                  high: quotes.high[i],
                  low: quotes.low[i],
                  close: quotes.close[i],
                  volume: quotes.volume[i],
              });
          }
      }
  
      if (historical.length === 0) {
        throw new Error(`No valid historical data points for ${ticker}`);
      }
      
      const currentPrice = historical[historical.length - 1].close;
      const stockData: StockData = { ticker, currentPrice, historical };
  
      cache.set(ticker, stockData);
      return stockData; // Success, exit loop
    
    } catch (error) {
      lastError = error as Error;

      if (error instanceof SyntaxError) {
        console.error(`Failed to parse response for ${ticker} with proxy ${proxyUrl}.`, error);
      } else if ((error as Error).name === 'TimeoutError') {
         console.warn(`Attempt ${attempt} timed out for ${ticker} with proxy ${proxyUrl}. Retrying...`);
      } else {
        console.warn(`Attempt ${attempt} failed for ${ticker} with proxy ${proxyUrl}. Retrying...`, (error as Error).message);
      }


      if (attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  // If all retries fail, throw the last captured error with a more user-friendly message for JSON parsing failures.
  console.error(`Failed to fetch stock data for ${ticker} after ${MAX_ATTEMPTS} attempts.`, lastError);
  if (lastError instanceof SyntaxError) {
      throw new Error(`Data for ${ticker} could not be parsed. The ticker may be delisted or there is a persistent proxy issue.`);
  }
  throw lastError!;
};

export { Tickers };