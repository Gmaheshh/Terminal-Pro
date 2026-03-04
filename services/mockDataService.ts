// Mock data generator for development when Yahoo Finance is rate-limited
export function generateMockOHLCV(ticker: string, days: number = 500): any[] {
  const data = [];
  const basePrice = 1000 + Math.random() * 2000;
  let price = basePrice;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Random walk with trend
    const change = (Math.random() - 0.48) * price * 0.02;
    price = Math.max(price + change, basePrice * 0.5);
    
    const open = price * (0.99 + Math.random() * 0.02);
    const close = price * (0.99 + Math.random() * 0.02);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (0.98 + Math.random() * 0.02);
    const volume = Math.floor(1000000 + Math.random() * 5000000);
    
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
      openInterest: 1000000 + Math.random() * 2000000
    });
  }
  
  return data;
}

export function generateMockStockData(ticker: string): any {
  const historical = generateMockOHLCV(ticker);
  return {
    ticker,
    currentPrice: historical[historical.length - 1].close,
    historical,
    fundamentals: {
      peRatio: 15 + Math.random() * 20,
      pbRatio: 1.5 + Math.random() * 4,
      roe: 10 + Math.random() * 15,
      roce: 12 + Math.random() * 18,
      debtToEquity: Math.random() * 2,
      currentRatio: 1 + Math.random() * 2,
      dividendYield: Math.random() * 5,
      marketCap: 10000000000 + Math.random() * 100000000000,
      eps: 10 + Math.random() * 50,
      sector: 'Technology',
      industry: 'Software',
      years: ['2024', '2023', '2022'],
      incomeStatement: [],
      balanceSheet: [],
      cashFlowStatement: []
    }
  };
}
