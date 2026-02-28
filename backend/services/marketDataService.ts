import axios from 'axios';
import { ApiError } from '../utils/http';

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class SimpleCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();
  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key: string, value: T) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

const historyCache = new SimpleCache<Candle[]>(1000 * 60 * 5);
const quoteCache = new SimpleCache<Record<string, unknown>>(1000 * 30);

const baseHeaders = { 'User-Agent': 'Mozilla/5.0 PRA-GATI Terminal' };

export const fetchHistory = async (ticker: string, interval = '1d', period = '1y') => {
  const key = `${ticker}:${interval}:${period}`;
  const cached = historyCache.get(key);
  if (cached) return cached;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${period}`;
  const response = await axios.get(url, { timeout: 10_000, headers: baseHeaders });
  const result = response.data?.chart?.result?.[0];

  if (!result || !result.timestamp) {
    throw new ApiError(404, `No historical data available for ${ticker}`, 'NO_DATA');
  }

  const quotes = result.indicators.quote[0];
  const candles: Candle[] = result.timestamp
    .map((time: number, index: number) => ({
      date: new Date(time * 1000).toISOString().slice(0, 10),
      open: quotes.open[index],
      high: quotes.high[index],
      low: quotes.low[index],
      close: quotes.close[index],
      volume: quotes.volume[index]
    }))
    .filter((c: Candle) => Number.isFinite(c.close));

  historyCache.set(key, candles);
  return candles;
};

export const fetchNews = async (ticker: string) => {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}`;
  const response = await axios.get(url, { timeout: 10_000, headers: baseHeaders });
  const news = response.data?.news ?? [];
  return news.slice(0, 8).map((item: any) => ({
    title: item.title,
    publisher: item.publisher,
    link: item.link,
    publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toISOString() : null
  }));
};

export const fetchQuote = async (symbols: string[]) => {
  const key = symbols.join(',');
  const cached = quoteCache.get(key);
  if (cached) return cached;

  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(key)}`;
  const response = await axios.get(url, { timeout: 10_000, headers: baseHeaders });
  const result = response.data?.quoteResponse?.result ?? [];
  const mapped = result.map((item: any) => ({
    symbol: item.symbol,
    shortName: item.shortName,
    regularMarketPrice: item.regularMarketPrice,
    regularMarketChangePercent: item.regularMarketChangePercent
  }));

  quoteCache.set(key, mapped);
  return mapped;
};
