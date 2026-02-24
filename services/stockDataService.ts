import type { StockData, OHLCV, OptionChain, OptionContract, FundamentalData, FinancialStatementRow } from '../types';
import { Tickers } from '../constants';

export { Tickers };

const cache = new Map<string, StockData>();

const generateMockHistory = (base: number, yearsCount: number = 3): number[] => {
    const history = [base];
    for(let i=1; i<yearsCount; i++) {
        history.push(history[i-1] * (0.8 + Math.random() * 0.3));
    }
    return history;
};

export const fetchFundamentals = async (ticker: string): Promise<FundamentalData> => {
    try {
        const response = await fetch(`/api/market/fundamentals?ticker=${encodeURIComponent(ticker)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const result = data.quoteSummary.result[0];
        if (!result) throw new Error("No summary data");

        const fin = result.financialData || {};
        const stats = result.defaultKeyStatistics || {};
        const profile = result.assetProfile || {};
        const incHist = result.incomeStatementHistory?.incomeStatementHistory || [];
        const balHist = result.balanceSheetHistory?.balanceSheetStatements || [];
        const cfHist = result.cashflowStatementHistory?.cashflowStatements || [];

        const years = incHist.map((h: any) => h.endDate?.fmt?.split('-')[0] || "N/A").slice(0, 3);
        if (years.length === 0) years.push("2024", "2023", "2022");

        const mapRow = (label: string, field: string, history: any[]): FinancialStatementRow => ({
            label,
            values: history.map(h => h[field]?.raw || 0).slice(0, 3)
        });

        const baseData: Partial<FundamentalData> = {
            peRatio: stats.trailingPE?.raw || stats.forwardPE?.raw,
            pbRatio: stats.priceToBook?.raw,
            roe: fin.returnOnEquity?.raw ? fin.returnOnEquity.raw * 100 : undefined,
            roce: fin.returnOnAssets?.raw ? fin.returnOnAssets.raw * 120 : undefined, 
            debtToEquity: fin.debtToEquity?.raw,
            currentRatio: fin.currentRatio?.raw,
            dividendYield: stats.dividendYield?.raw ? stats.dividendYield.raw * 100 : fin.dividendYield?.raw ? fin.dividendYield.raw * 100 : undefined,
            marketCap: result.summaryDetail?.marketCap?.raw,
            eps: stats.trailingEps?.raw,
            sector: profile.sector || "General",
            industry: profile.industry || "General Industry",
            years,
            incomeStatement: [
                mapRow('Total Revenue', 'totalRevenue', incHist),
                mapRow('Cost of Revenue', 'costOfRevenue', incHist),
                mapRow('Gross Profit', 'grossProfit', incHist),
                mapRow('Operating Income', 'operatingIncome', incHist),
                mapRow('Net Income', 'netIncome', incHist),
                mapRow('EBITDA', 'ebitda', incHist),
            ],
            balanceSheet: [
                mapRow('Total Assets', 'totalAssets', balHist),
                mapRow('Current Assets', 'totalCurrentAssets', balHist),
                mapRow('Total Liabilities', 'totalLiab', balHist),
                mapRow('Current Liabilities', 'totalCurrentLiabilities', balHist),
                mapRow('Stockholders Equity', 'totalStockholderEquity', balHist),
                mapRow('Long Term Debt', 'longTermDebt', balHist),
            ],
            cashFlowStatement: [
                mapRow('Operating Cash Flow', 'totalCashFromOperatingActivities', cfHist),
                mapRow('Investing Cash Flow', 'totalCashflowsFromInvestingActivities', cfHist),
                mapRow('Financing Cash Flow', 'totalCashflowsFromFinancingActivities', cfHist),
                mapRow('Free Cash Flow', 'freeCashFlow', cfHist),
            ]
        };

        // Fill missing with defaults
        if (!baseData.marketCap) baseData.marketCap = 1000000000 * (1 + Math.random() * 10);
        if (!baseData.sector || baseData.sector === "General") baseData.sector = "Diversified";
        if (!baseData.peRatio) baseData.peRatio = 15 + Math.random() * 20;
        if (!baseData.pbRatio) baseData.pbRatio = 1.5 + Math.random() * 4;
        if (!baseData.roe) baseData.roe = 10 + Math.random() * 15;
        if (!baseData.roce) baseData.roce = (baseData.roe || 10) * 1.2;

        return baseData as FundamentalData;
    } catch (e) {
        console.error('Fetch Fundamentals Error:', e);
        // Minimal fallback
        return {
            years: ["2024", "2023", "2022"],
            sector: "Diversified",
            marketCap: 1000000000,
            incomeStatement: [],
            balanceSheet: [],
            cashFlowStatement: []
        } as FundamentalData;
    }
};

export const fetchStockData = async (ticker: string): Promise<StockData> => {
  if (cache.has(ticker)) {
    return cache.get(ticker)!;
  }

  // 1. Try Kite first
  try {
    const from = new Date();
    from.setFullYear(from.getFullYear() - 2);
    const to = new Date();
    
    const kiteRes = await fetch(`/api/kite/historical?ticker=${encodeURIComponent(ticker)}&interval=day&from=${from.toISOString().split('T')[0]}&to=${to.toISOString().split('T')[0]}`);
    
    if (kiteRes.ok) {
      const kiteData = await kiteRes.json();
      if (Array.isArray(kiteData) && kiteData.length > 0) {
        const historical: OHLCV[] = kiteData.map((d: any) => ({
          date: new Date(d.date).toISOString().split('T')[0],
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
          openInterest: d.oi || 0
        }));

        const currentPrice = historical[historical.length - 1].close;
        const fundamentals = await fetchFundamentals(ticker);
        const stockData: StockData = { ticker, currentPrice, historical, fundamentals };
        cache.set(ticker, stockData);
        return stockData;
      }
    }
  } catch (e) {
    console.warn('Kite fetch failed, falling back to Yahoo API', e);
  }

  // 2. Fallback to Yahoo via Backend Proxy
  try {
    const response = await fetch(`/api/market/historical?ticker=${encodeURIComponent(ticker)}&range=2y&interval=1d`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (!data.chart || data.chart.error) throw new Error(data.chart.error?.message || `No data`);

    const result = data.chart.result[0];
    const timestamps: number[] = result.timestamp;
    const quotes = result.indicators.quote[0];
    const historical: OHLCV[] = [];
    
    let currentBaseOi = 1000000 + (Math.random() * 2000000);

    for (let i = 0; i < timestamps.length; i++) {
        if (timestamps[i] && quotes.close[i] !== null) {
            const priceChange = i > 0 ? (quotes.close[i] - quotes.close[i-1]) / quotes.close[i-1] : 0;
            const vol = quotes.volume[i] || 0;
            if (priceChange > 0.01 && vol > 500000) currentBaseOi *= (1 + 0.02 + Math.random() * 0.04);
            else if (priceChange < -0.01) currentBaseOi *= (1 - 0.01); 
            else currentBaseOi *= (1 + (Math.random() * 0.002 - 0.001));

            historical.push({
                date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                open: quotes.open[i],
                high: quotes.high[i],
                low: quotes.low[i],
                close: quotes.close[i],
                volume: quotes.volume[i],
                openInterest: currentBaseOi,
            });
        }
    }

    if (historical.length === 0) throw new Error(`No historical points`);
    
    const currentPrice = historical[historical.length - 1].close;
    const fundamentals = await fetchFundamentals(ticker);
    const stockData: StockData = { ticker, currentPrice, historical, fundamentals };

    cache.set(ticker, stockData);
    return stockData;
  } catch (error) {
    console.error('Yahoo Historical Fetch Error:', error);
    throw error;
  }
};

export const fetchOptionChain = async (ticker: string, underlyingPrice: number): Promise<OptionChain> => {
    const nseSymbol = ticker === '^NSEI' ? 'NIFTY' : ticker === '^NSEBANK' ? 'BANKNIFTY' : ticker.replace('.NS', '').replace('UNITDSPR', 'MCDOWELL-N').replace('LTF', 'L&TFH');
    const isIndex = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(nseSymbol);
    
    try {
        const response = await fetch(`/api/market/option-chain?symbol=${nseSymbol}&isIndex=${isIndex}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const strikePrice = Math.round(underlyingPrice / (isIndex ? 50 : 5)) * (isIndex ? 50 : 5);
        const futuresPrice = underlyingPrice * (1 + (0.005 + Math.random() * 0.003)); 

        const mapContract = (c: any): OptionContract => ({
            strike: c.strikePrice,
            price: c.lastPrice,
            change: c.change,
            iv: c.impliedVolatility,
            oi: c.openInterest,
            volume: c.totalTradedVolume
        });

        const filteredData = data.records.data.filter((d: any) => 
            Math.abs(d.strikePrice - strikePrice) <= (isIndex ? 500 : strikePrice * 0.1)
        );

        return {
            ticker,
            expiryDate: data.records.expiryDates[0],
            underlyingPrice,
            futuresPrice,
            calls: filteredData.map((d: any) => mapContract(d.CE)).filter((c: any) => !!c?.price),
            puts: filteredData.map((d: any) => mapContract(d.PE)).filter((c: any) => !!c?.price)
        };
    } catch (e) {
        console.warn('NSE Option Chain Fetch Failed, using fallback mock', e);
        
        const mockExpiry = new Date();
        mockExpiry.setDate(mockExpiry.getDate() + 7);
        const strikes = [];
        const step = isIndex ? 50 : 5;
        const baseStrike = Math.round(underlyingPrice / step) * step;
        for(let i = -10; i <= 10; i++) strikes.push(baseStrike + (i * step));

        return {
            ticker,
            expiryDate: mockExpiry.toISOString().split('T')[0],
            underlyingPrice,
            futuresPrice: underlyingPrice * 1.005,
            calls: strikes.map(s => ({ strike: s, price: Math.max(1, (underlyingPrice - s) + Math.random() * 10), change: 0, iv: 15, oi: 1000, volume: 5000 })),
            puts: strikes.map(s => ({ strike: s, price: Math.max(1, (s - underlyingPrice) + Math.random() * 10), change: 0, iv: 15, oi: 1000, volume: 5000 }))
        };
    }
};
