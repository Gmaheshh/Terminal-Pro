
import React from 'react';
import type { Column, ProcessedStock, TabType, PortfolioBacktestResult, OHLCV, EmaSignalResult, OIAnalyticsData } from './types';
import { InfoIcon } from './components/Icons';

export const AllFOTickers = [
  '^NSEI', '^NSEBANK', 
  'AARTIIND.NS', 'ABB.NS', 'ABBOTINDIA.NS', 'ABCAPITAL.NS', 'ABFRL.NS', 'ACC.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'ALKEM.NS', 'AMBUJACEM.NS', 
  'APOLLOHOSP.NS', 'APOLLOTYRE.NS', 'ASHOKLEY.NS', 'ASIANPAINT.NS', 'ASTRAL.NS', 'ATUL.NS', 'AUBANK.NS', 'AUROPHARMA.NS', 'AXISBANK.NS', 
  'BAJAJ-AUTO.NS', 'BAJAJFINSV.NS', 'BAJFINANCE.NS', 'BALKRISIND.NS', 'BALRAMCHIN.NS', 'BANDHANBNK.NS', 'BANKBARODA.NS', 'BATAINDIA.NS', 
  'BEL.NS', 'BERGEPAINT.NS', 'BHARATFORG.NS', 'BHARTIARTL.NS', 'BHEL.NS', 'BIOCON.NS', 'BPCL.NS', 'BRITANNIA.NS', 'BSOFT.NS', 'CANBK.NS', 
  'CANFINHOME.NS', 'CHAMBLFERT.NS', 'CHOLAFIN.NS', 'CIPLA.NS', 'COALINDIA.NS', 'COFORGE.NS', 'COLPAL.NS', 'CONCOR.NS', 'COROMANDEL.NS', 
  'CROMPTON.NS', 'CUMMINSIND.NS', 'DABUR.NS', 'DALBHARAT.NS', 'DEEPAKNTR.NS', 'DELTACORP.NS', 'DIVISLAB.NS', 'DIXON.NS', 'DLF.NS', 
  'DRREDDY.NS', 'EICHERMOT.NS', 'ESCORTS.NS', 'EXIDEIND.NS', 'FEDERALBNK.NS', 'GAIL.NS', 'GLENMARK.NS', 'GMRINFRA.NS', 'GNFC.NS', 
  'GODREJCP.NS', 'GODREJPROP.NS', 'GRANULES.NS', 'GRASIM.NS', 'GUJGASLTD.NS', 'HAL.NS', 'HAVELLS.NS', 'HCLTECH.NS', 'HDFCBANK.NS', 
  'HDFCLIFE.NS', 'HEROMOTOCO.NS', 'HINDALCO.NS', 'HINDCOPPER.NS', 'HINDUNILVR.NS', 'ICICIBANK.NS', 'ICICIGI.NS', 'ICICIPRULI.NS', 
  'IDEA.NS', 'IDFC.NS', 'IDFCFIRSTB.NS', 'IEX.NS', 'IGL.NS', 'INDHOTEL.NS', 'INDIACEM.NS', 'INDIAMART.NS', 'INDIGO.NS', 'INDUSINDBK.NS', 
  'INDUSTOWER.NS', 'INFY.NS', 'IOC.NS', 'IPCALAB.NS', 'IRCTC.NS', 'ITC.NS', 'JINDALSTEL.NS', 'JKCEMENT.NS', 'JSWSTEEL.NS', 'JUBLFOOD.NS', 
  'KOTAKBANK.NS', 'LTF.NS', 'LALPATHLAB.NS', 'LAURUSLABS.NS', 'LICHSGFIN.NS', 'LTIM.NS', 'LT.NS', 'LUPIN.NS', 'M&M.NS', 'M&MFIN.NS', 
  'MANAPPURAM.NS', 'MARICO.NS', 'MARUTI.NS', 'UNITDSPR.NS', 'MCX.NS', 'METROPOLIS.NS', 'MFSL.NS', 'MGL.NS', 'MOTHERSON.NS', 'MPHASIS.NS', 
  'MRF.NS', 'MUTHOOTFIN.NS', 'NATIONALUM.NS', 'NAUKRI.NS', 'NAVINFLUOR.NS', 'NESTLEIND.NS', 'NMDC.NS', 'NTPC.NS', 'OBEROIRLTY.NS', 'OFSS.NS', 
  'ONGC.NS', 'PAGEIND.NS', 'PEL.NS', 'PERSISTENT.NS', 'PETRONET.NS', 'PFC.NS', 'PIDILITIND.NS', 'PIIND.NS', 'PNB.NS', 'POLYCAB.NS', 'POWERGRID.NS', 
  'PVRINOX.NS', 'RAMCOCEM.NS', 'RBLBANK.NS', 'RECLTD.NS', 'RELIANCE.NS', 'SAIL.NS', 'SBICARD.NS', 'SBILIFE.NS', 'SBIN.NS', 'SHREECEM.NS', 
  'SHRIRAMFIN.NS', 'SIEMENS.NS', 'SRF.NS', 'SUNPHARMA.NS', 'SUNTV.NS', 'SYNGENE.NS', 'TATACHEM.NS', 'TATACOMM.NS', 'TATACONSUM.NS', 
  'TATAMOTORS.NS', 'TATAPOWER.NS', 'TATASTEEL.NS', 'TCS.NS', 'TECHM.NS', 'TITAN.NS', 'TRENT.NS', 'TVSMOTOR.NS', 'UBL.NS', 'ULTRACEMCO.NS', 
  'UPL.NS', 'VEDL.NS', 'VOLTAS.NS', 'WIPRO.NS', 'ZEEL.NS', 'ZYDUSLIFE.NS'
];

export const Tickers: string[] = AllFOTickers;

export type MainCategory = 'Home' | 'Intelligence Hub' | 'Investing Tree' | 'Trading Tree' | 'User Manual';

export const CATEGORIES: MainCategory[] = ['Home', 'Intelligence Hub', 'Investing Tree', 'Trading Tree', 'User Manual'];

export const CATEGORY_MAP: Record<MainCategory, TabType[]> = {
    'Home': [],
    'Intelligence Hub': ['Recent News', 'Macro Analysis'],
    'Investing Tree': ['Company Analysis', 'Portfolio Maker'],
    'Trading Tree': ['Volume/Trend', 'VWLM', 'Strategy Backtester', 'Derivatives Desk', 'OI Analytics', 'Payoff Visualizer', 'Backtest Simulation', 'Position Calculator'],
    'User Manual': ['User Manual']
};

export const TABS: TabType[] = ['Volume/Trend', 'VWLM', 'Derivatives Desk', 'OI Analytics', 'Payoff Visualizer', 'Macro Analysis', 'Portfolio Maker', 'Backtest Simulation', 'Strategy Backtester', 'Recent News', 'Position Calculator', 'User Manual', 'Company Analysis'];

const renderSignal = (text: string, type: 'buy' | 'sell' | 'neutral' | 'bullish' | 'bearish') => {
    let colorClass = 'text-pro-muted';
    let bgClass = 'bg-slate-100';
    if (type === 'buy' || type === 'bullish') {
        colorClass = 'text-pro-green font-bold';
        bgClass = 'bg-pro-green/10';
    } else if (type === 'sell' || type === 'bearish') {
        colorClass = 'text-pro-red font-bold';
        bgClass = 'bg-pro-red/10';
    }
    return React.createElement('span', { className: `px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${bgClass} ${colorClass}` }, text);
};

const renderDate = (date: string, historical: OHLCV[]) => {
    if (!date) return React.createElement('span', { className: 'text-pro-muted italic opacity-50' }, 'N/A');
    const lastTwoDates = historical.slice(-2).map(h => h.date);
    const isRecent = lastTwoDates.includes(date);
    return React.createElement('span', {
        className: isRecent 
            ? 'text-pro-primary font-bold bg-pro-primary/10 px-2 py-0.5 rounded-full ring-1 ring-pro-primary/20 animate-pulse' 
            : 'text-pro-muted font-medium'
    }, date);
};

const renderActionGroup = (stock: ProcessedStock, onMonitor: (stock: ProcessedStock) => void, onAnalyze: (ticker: string) => void) => (
    React.createElement('div', { className: 'flex items-center space-x-2' }, [
        React.createElement('button', 
          { 
            key: 'trade',
            onClick: (e: any) => { e.stopPropagation(); onMonitor(stock); }, 
            className: `px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm active:scale-95 ${
                stock.signals.trendSignal === 'Downtrend' 
                ? "bg-pro-red text-white hover:bg-red-600" 
                : "bg-pro-green text-white hover:bg-emerald-600"
            }`
          } as any, 
          stock.signals.trendSignal === 'Downtrend' ? 'SHORT' : 'LONG'
        ),
        React.createElement('button',
          {
            key: 'info',
            onClick: (e: any) => { e.stopPropagation(); onAnalyze(stock.ticker); },
            className: "p-2 rounded-lg bg-pro-surface text-pro-muted hover:text-pro-primary transition-all border border-pro-border",
            title: "Omni-Analysis"
          } as any,
          React.createElement(InfoIcon, { className: "w-3.5 h-3.5" })
        )
    ])
);

export const VOLUME_TREND_COLUMNS = (
    onTickerClick: (ticker: string) => void, 
    onMonitor: (stock: ProcessedStock) => void
): Column<ProcessedStock>[] => [
    { 
        header: 'Ticker', 
        accessor: (d) => React.createElement('button', { 
            onClick: (e: any) => { e.stopPropagation(); onTickerClick(d.ticker); },
            className: 'text-pro-primary font-bold hover:underline transition-all tracking-tight'
        } as any, d.ticker), 
        sortable: true 
    },
    { header: 'Price', accessor: (d) => React.createElement('span', { className: 'font-mono' }, d.data.currentPrice.toFixed(2)), sortable: true },
    { header: 'Signal Date', accessor: (d) => renderDate(d.signals.volumeSpikeSignalDate, d.data.historical), sortable: true },
    { header: 'SL', accessor: (d) => React.createElement('span', { className: 'text-pro-red font-mono font-medium' }, d.signals.stopLoss.toFixed(2)), sortable: true },
    { header: 'TP', accessor: (d) => React.createElement('span', { className: 'text-pro-green font-mono font-medium' }, d.signals.target.toFixed(2)), sortable: true },
    { header: 'OI Build', accessor: (d) => React.createElement('span', { className: d.signals.oiBuild > 0 ? 'text-pro-green' : 'text-pro-red' }, `${d.signals.oiBuild.toFixed(1)}%`), sortable: true },
    { header: 'RVOL', accessor: (d) => React.createElement('span', { className: 'font-mono' }, d.indicators.rvol[d.indicators.rvol.length - 1].toFixed(2)), sortable: true },
    { header: 'Trend', accessor: (d) => renderSignal(d.signals.trendSignal, d.signals.trendSignal === 'Uptrend' ? 'bullish' : 'bearish') },
    { header: 'ADX', accessor: (d) => React.createElement('span', { className: 'font-mono' }, d.indicators.adx[d.indicators.adx.length - 1]?.toFixed(2) || 'N/A'), sortable: true },
    { header: 'Action', accessor: (d) => renderActionGroup(d, onMonitor, onTickerClick) },
];

export const VWLM_COLUMNS = (
    onTickerClick: (ticker: string) => void,
    onMonitor: (stock: ProcessedStock) => void
): Column<ProcessedStock>[] => [
    { header: 'Ticker', accessor: (d) => React.createElement('button', { onClick: (e: any) => { e.stopPropagation(); onTickerClick(d.ticker); }, className: 'text-pro-primary font-bold hover:underline transition-all tracking-tight' } as any, d.ticker), sortable: true },
    { header: 'Price', accessor: (d) => React.createElement('span', { className: 'font-mono' }, d.data.currentPrice.toFixed(2)), sortable: true },
    { header: 'Signal Date', accessor: (d) => renderDate(d.signals.vwlmBuySignalDate || d.signals.vwlmSellSignalDate, d.data.historical), sortable: true },
    { header: 'SL', accessor: (d) => React.createElement('span', { className: 'text-pro-red font-mono font-medium' }, (d.signals.vwlmStopLoss || d.signals.stopLoss).toFixed(2)), sortable: true },
    { header: 'TP', accessor: (d) => React.createElement('span', { className: 'text-pro-green font-mono font-medium' }, (d.signals.vwlmTarget || d.signals.target).toFixed(2)), sortable: true },
    { header: 'Signal', accessor: (d) => renderSignal(d.signals.vwlmBuySignal ? 'Buy' : 'Sell', d.signals.vwlmBuySignal ? 'buy' : 'sell') },
    { header: 'OI Build', accessor: (d) => React.createElement('span', { className: d.signals.oiBuild > 0 ? 'text-pro-green' : 'text-pro-red' }, `${d.signals.oiBuild.toFixed(1)}%`), sortable: true },
    { header: 'ADX', accessor: (d) => React.createElement('span', { className: 'font-mono' }, d.indicators.adx[d.indicators.adx.length - 1]?.toFixed(2) || 'N/A'), sortable: true },
    { header: 'Action', accessor: (d) => renderActionGroup(d, onMonitor, onTickerClick) },
];

export const PORTFOLIO_SIMULATION_COLUMNS = (onDetails: (result: PortfolioBacktestResult) => void): Column<PortfolioBacktestResult>[] => [
    { header: 'Strategy', accessor: (d) => React.createElement('span', { className: 'text-pro-text font-bold' }, d.strategy.toUpperCase()), sortable: true },
    { header: 'Period', accessor: 'period', sortable: true },
    { header: 'Final Equity', accessor: (d) => React.createElement('span', { className: 'font-mono' }, d.finalCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })), sortable: true },
    { header: 'Alpha Return', accessor: (d) => {
        const value = d.totalReturn;
        const color = value > 0 ? 'text-pro-green' : value < 0 ? 'text-pro-red' : 'text-pro-muted';
        return React.createElement('span', { className: `${color} font-bold` }, `${value > 0 ? '+' : ''}${value.toFixed(2)}%`);
      }, 
      sortable: true 
    },
    { header: 'Win Rate', accessor: (d) => `${d.winRate.toFixed(1)}%`, sortable: true },
    { header: 'Analytics', accessor: (d) => React.createElement('button', { 
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); onDetails(d); }, 
        className: "px-3 py-1 bg-pro-surface text-pro-muted hover:text-pro-primary hover:border-pro-primary/30 border border-pro-border rounded-lg text-[10px] font-bold transition-all" 
    } as any, "VIEW_REPORT")},
];

export const EMA_DASHBOARD_COLUMNS = (): Column<EmaSignalResult>[] => [
    { header: 'Stock', accessor: 'ticker', sortable: true },
    { header: 'Price', accessor: (d) => React.createElement('span', { className: 'font-mono' }, d.price.toFixed(2)), sortable: true },
    { header: 'Signal', accessor: (d) => renderSignal(d.signal, d.signal.includes('BUY') ? 'buy' : d.signal.includes('SELL') ? 'sell' : 'neutral'), sortable: true },
    { header: 'EMA9', accessor: (d) => d.ema9.toFixed(2), sortable: true },
    { header: 'EMA13', accessor: (d) => d.ema13.toFixed(2), sortable: true },
    { header: 'MACD', accessor: (d) => d.macd.toFixed(2), sortable: true },
    { header: 'RSI', accessor: (d) => d.rsi.toFixed(2), sortable: true },
    { header: 'StochRSI', accessor: (d) => d.stochRsi.toFixed(2), sortable: true },
];

export const OI_ANALYTICS_COLUMNS = (): Column<OIAnalyticsData>[] => [
    { header: 'Ticker', accessor: (d) => React.createElement('span', { className: 'font-bold text-pro-primary' }, d.ticker.replace('.NS', '')), sortable: true },
    { header: 'Spot', accessor: (d) => React.createElement('span', { className: 'font-mono' }, d.spot.toFixed(2)), sortable: true },
    { header: 'Futures', accessor: (d) => React.createElement('span', { className: 'font-mono text-pro-accent' }, d.futures.toFixed(2)), sortable: true },
    { header: 'Current OI', accessor: (d) => React.createElement('span', { className: 'font-mono' }, (d.currentMonthOI / 1000000).toFixed(2) + 'M'), sortable: true },
    { header: 'Total OI', accessor: (d) => React.createElement('span', { className: 'font-mono font-bold' }, (d.totalOI / 1000000).toFixed(2) + 'M'), sortable: true },
    { header: 'Rollover %', accessor: (d) => React.createElement('span', { className: 'font-mono font-black text-pro-primary' }, d.rolloverPct.toFixed(2) + '%'), sortable: true },
    { header: 'Trend', accessor: (d) => {
        const color = d.trend === 'UPWARD' ? 'text-pro-green' : d.trend === 'DOWNWARD' ? 'text-pro-red' : 'text-pro-muted';
        return React.createElement('span', { className: `${color} font-black text-[10px]` }, d.trend);
    }, sortable: true },
];
