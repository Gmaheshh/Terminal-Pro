
import React from 'react';
import type { Column, ProcessedStock, TabType, PortfolioBacktestResult, EmaSignalResult, Sentiment, ArbitrageOpportunity } from './types';

/**
 * Full NSE F&O (Futures & Options) Ticker List including Indices
 * Updated to include the complete F&O segment universe (~180 stocks).
 */
export const AllFOTickers = [
  '^NSEI', '^NSEBANK', // Primary Indices First
  'AARTIIND.NS', 'ABB.NS', 'ABBOTINDIA.NS', 'ABCAPITAL.NS', 'ABFRL.NS', 'ACC.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'ALKEM.NS', 'AMBUJACEM.NS', 
  'APOLLOHOSP.NS', 'APOLLOTYRE.NS', 'ASHOKLEY.NS', 'ASIANPAINT.NS', 'ASTRAL.NS', 'ATUL.NS', 'AUBANK.NS', 'AUROPHARMA.NS', 'AXISBANK.NS', 
  'BAJAJ-AUTO.NS', 'BAJAJFINSV.NS', 'BAJFINANCE.NS', 'BALKRISIND.NS', 'BALRAMCHIN.NS', 'BANDHANBNK.NS', 'BANKBARODA.NS', 'BATAINDIA.NS', 
  'BEL.NS', 'BERGEPAINT.NS', 'BHARATFORG.NS', 'BHARTIARTL.NS', 'BHEL.NS', 'BIOCON.NS', 'BPCL.NS', 'BRITANNIA.NS', 'BSOFT.NS', 'CANBK.NS', 
  'CANFINHOME.NS', 'CHAMBLFERT.CH', 'CHOLAFIN.NS', 'CIPLA.NS', 'COALINDIA.NS', 'COFORGE.NS', 'COLPAL.NS', 'CONCOR.NS', 'COROMANDEL.NS', 
  'CROMPTON.NS', 'CUMMINSIND.NS', 'DABUR.NS', 'DALBHARAT.NS', 'DEEPAKNTR.NS', 'DELTACORP.NS', 'DIVISLAB.NS', 'DIXON.NS', 'DLF.NS', 
  'DRREDDY.NS', 'EICHERMOT.NS', 'ESCORTS.NS', 'EXIDEIND.NS', 'FEDERALBNK.NS', 'GAIL.NS', 'GLENMARK.NS', 'GMRINFRA.NS', 'GNFC.NS', 
  'GODREJCP.NS', 'GODREJPROP.NS', 'GRANULES.NS', 'GRASIM.NS', 'GUJGASLTD.NS', 'HAL.NS', 'HAVELLS.NS', 'HCLTECH.NS', 'HDFCBANK.NS', 
  'HDFCLIFE.NS', 'HEROMOTOCO.NS', 'HINDALCO.NS', 'HINDCOPPER.NS', 'HINDUNILVR.NS', 'ICICIBANK.NS', 'ICICIGI.NS', 'ICICIPRULI.NS', 
  'IDEA.NS', 'IDFC.NS', 'IDFCFIRSTB.NS', 'IEX.NS', 'IGL.NS', 'INDHOTEL.NS', 'INDIACEM.NS', 'INDIAMART.NS', 'INDIGO.NS', 'INDUSINDBK.NS', 
  'INDUSTOWER.NS', 'INFy.NS', 'IOC.NS', 'IPCALAB.NS', 'IRCTC.NS', 'ITC.NS', 'JINDALSTEL.NS', 'JKCEMENT.NS', 'JSWSTEEL.NS', 'JUBLFOOD.NS', 
  'KOTAKBANK.NS', 'L&TFH.NS', 'LALPATHLAB.NS', 'LAURUSLABS.NS', 'LICHSGFIN.NS', 'LTIM.NS', 'LT.NS', 'LUPIN.NS', 'M&M.NS', 'M&MFIN.NS', 
  'MANAPPURAM.NS', 'MARICO.NS', 'MARUTI.NS', 'MCDOWELL-N.NS', 'MCX.NS', 'METROPOLIS.NS', 'MFSL.NS', 'MGL.NS', 'MOTHERSON.NS', 'MPHASIS.NS', 
  'MRF.NS', 'MUTHOOTFIN.NS', 'NATIONALUM.NS', 'NAUKRI.NS', 'NAVINFLUOR.NS', 'NESTLEIND.NS', 'NMDC.NS', 'NTPC.NS', 'OBEROIRLTY.NS', 'OFSS.NS', 
  'ONGC.NS', 'PAGEIND.NS', 'PEL.NS', 'PERSISTENT.NS', 'PETRONET.NS', 'PFC.NS', 'PIDILITIND.NS', 'PIIND.NS', 'PNB.NS', 'POLYCAB.NS', 'POWERGRID.NS', 
  'PVRINOX.NS', 'RAMCOCEM.NS', 'RBLBANK.NS', 'RECLTD.NS', 'RELIANCE.NS', 'SAIL.NS', 'SBICARD.NS', 'SBILIFE.NS', 'SBIN.NS', 'SHREECEM.NS', 
  'SHRIRAMFIN.NS', 'SIEMENS.NS', 'SRF.NS', 'SUNPHARMA.NS', 'SUNTV.NS', 'SYNGENE.NS', 'TATACHEM.NS', 'TATACOMM.NS', 'TATACONSUM.NS', 
  'TATAMOTORS.NS', 'TATAPOWER.NS', 'TATASTEEL.NS', 'TCS.NS', 'TECHM.NS', 'TITAN.NS', 'TRENT.NS', 'TVSMOTOR.NS', 'UBL.NS', 'ULTRACEMCO.NS', 
  'UPL.NS', 'VEDL.NS', 'VOLTAS.NS', 'WIPRO.NS', 'ZEEL.NS', 'ZYDUSLIFE.NS'
];

export const Nifty50Tickers = AllFOTickers;

export const Tickers: string[] = AllFOTickers;

export const TABS: TabType[] = ['Volume/Trend', 'VWLM', 'Derivatives Desk', 'Portfolio Simulation', 'Strategy Backtester', 'Recent News', 'User Manual'];

const renderSignal = (text: string, type: 'buy' | 'sell' | 'neutral' | 'bullish' | 'bearish') => {
    let colorClass = 'text-bb-muted';
    if (type === 'buy' || type === 'bullish') {
        colorClass = 'text-bb-green font-bold';
    } else if (type === 'sell' || type === 'bearish') {
        colorClass = 'text-bb-red font-bold';
    }
    return React.createElement('span', { className: colorClass }, text.toUpperCase());
};

const renderTradeButton = (ticker: string, action: 'buy' | 'sell', onFetch: (ticker: string, type: 'thesis') => void) => (
    React.createElement('button', 
      { 
        onClick: (e) => { e.stopPropagation(); onFetch(ticker, 'thesis'); }, 
        className: `min-w-[55px] px-3 py-1.5 border text-xs font-bold uppercase transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
            action === 'buy' 
            ? "bg-bb-green/10 text-bb-green border-bb-green hover:bg-bb-green hover:text-black shadow-[0_0_5px_rgba(0,255,0,0.3)]" 
            : "bg-bb-red/10 text-bb-red border-bb-red hover:bg-bb-red hover:text-black shadow-[0_0_5px_rgba(255,51,51,0.3)]"
        }`
      }, 
      [
        action.toUpperCase(),
        React.createElement('span', { key: 'arr', className: "ml-1 text-[9px]" }, ">>")
      ]
    )
);

const renderSentimentButton = (ticker: string, onFetch: (ticker: string, type: 'sentiment') => void) => (
  React.createElement('button', 
    { 
      onClick: (e) => { e.stopPropagation(); onFetch(ticker, 'sentiment'); }, 
      className: "text-bb-blue hover:text-white hover:underline uppercase text-[10px]"
    }, 
    "[ NEWS ]"
  )
);

export const VOLUME_TREND_COLUMNS = (onFetchSentiment: (ticker: string, type: 'sentiment' | 'thesis') => void, sentiments?: Record<string, Sentiment>): Column<ProcessedStock>[] => [
    { header: 'Ticker', accessor: (d) => React.createElement('span', { className: 'text-bb-blue font-bold' }, d.ticker), sortable: true },
    { header: 'Price', accessor: (d) => d.data.currentPrice.toFixed(2), sortable: true },
    { 
      header: 'Signal Date', 
      accessor: (d) => {
          const date = d.signals.volumeSpikeSignalDate;
          const isToday = date === d.data.historical[d.data.historical.length - 1].date;
          return React.createElement('span', { className: isToday ? 'text-bb-orange font-bold' : 'text-bb-blue' }, date || '-');
      },
      sortable: true
    },
    { header: '52W Dist%', accessor: (d) => React.createElement('span', { className: (d.signals.distFrom52WHigh || 0) < 5 ? 'text-bb-green' : 'text-bb-text' }, `${(d.signals.distFrom52WHigh || 0).toFixed(1)}%`), sortable: true },
    { 
      header: 'OI Build', 
      accessor: (d) => {
          const val = d.signals.oiBuild;
          const color = val > 5 ? 'text-bb-green font-bold' : val > 0 ? 'text-bb-blue' : 'text-bb-muted';
          return React.createElement('span', { className: color }, `${val > 0 ? '+' : ''}${val.toFixed(1)}%`);
      },
      sortable: true
    },
    { 
      header: 'Expiry', 
      accessor: (d) => {
          const nearExpiry = d.signals.daysToExpiry <= 7;
          const label = `${d.signals.expiryDate.split('-')[2]}-${new Date(d.signals.expiryDate).toLocaleString('default', { month: 'short' }).toUpperCase()}`;
          return React.createElement('span', { className: nearExpiry ? 'text-bb-orange font-bold' : 'text-bb-muted' }, `${label} (T-${d.signals.daysToExpiry})`);
      },
      sortable: true 
    },
    { 
      header: 'Signal', 
      accessor: (d) => d.signals.volumeSignal === 'Spike' 
        ? React.createElement('span', { className: 'text-bb-orange animate-pulse font-bold' }, 'SQUEEZE_OUT')
        : React.createElement('span', { className: 'text-bb-muted' }, '-')
    },
    { 
      header: 'RVOL', 
      accessor: (d) => {
          const rvol = d.indicators.rvol[d.indicators.rvol.length - 1];
          if (isNaN(rvol)) return 'N/A';
          const color = rvol > 3 ? 'text-bb-orange font-bold' : rvol > 1.5 ? 'text-white' : 'text-bb-muted';
          return React.createElement('span', { className: color }, rvol.toFixed(2));
      },
      sortable: true
    },
    { header: 'Trend', accessor: (d) => renderSignal(d.signals.trendSignal, d.signals.trendSignal === 'Uptrend' ? 'buy' : 'sell') },
    { header: 'ADX', accessor: (d) => d.indicators.adx[d.indicators.adx.length - 1]?.toFixed(2) || 'N/A', sortable: true },
    { header: 'Stop', accessor: (d) => d.signals.stopLoss.toFixed(2) },
    { header: 'Tgt', accessor: (d) => d.signals.target.toFixed(2) },
    { 
        header: 'Action', 
        accessor: (d) => {
            const action = d.signals.trendSignal === 'Downtrend' ? 'sell' : 'buy';
            return React.createElement('div', { className: 'flex items-center space-x-2' }, [
                renderTradeButton(d.ticker, action, onFetchSentiment),
                renderSentimentButton(d.ticker, onFetchSentiment)
            ]);
        }
    },
];

export const VWLM_COLUMNS = (onFetchSentiment: (ticker: string, type: 'sentiment' | 'thesis') => void): Column<ProcessedStock>[] => [
    { header: 'Ticker', accessor: (d) => React.createElement('span', { className: 'text-bb-blue font-bold' }, d.ticker), sortable: true },
    { header: 'Price', accessor: (d) => d.data.currentPrice.toFixed(2), sortable: true },
    { 
      header: 'Signal Date', 
      accessor: (d) => {
          const date = d.signals.vwlmBuySignalDate || d.signals.vwlmSellSignalDate;
          const isToday = date === d.data.historical[d.data.historical.length - 1].date;
          return React.createElement('span', { className: isToday ? 'text-bb-orange font-bold' : 'text-bb-blue' }, date || '-');
      },
      sortable: true
    },
    { header: 'Signal', accessor: (d) => renderSignal(d.signals.vwlmBuySignal ? 'Buy' : 'Sell', d.signals.vwlmBuySignal ? 'buy' : 'sell') },
    { header: 'OI Build', accessor: (d) => `${d.signals.oiBuild.toFixed(1)}%`, sortable: true },
    { 
      header: 'Expiry', 
      accessor: (d) => {
          const nearExpiry = d.signals.daysToExpiry <= 7;
          const label = `${d.signals.expiryDate.split('-')[2]}-${new Date(d.signals.expiryDate).toLocaleString('default', { month: 'short' }).toUpperCase()}`;
          return React.createElement('span', { className: nearExpiry ? 'text-bb-orange font-bold' : 'text-bb-muted' }, `${label} (T-${d.signals.daysToExpiry})`);
      },
      sortable: true 
    },
    { header: 'ADX', accessor: (d) => d.indicators.adx[d.indicators.adx.length - 1]?.toFixed(2) || 'N/A', sortable: true },
    { header: 'Stop', accessor: (d) => (d.signals.vwlmStopLoss || 0).toFixed(2) },
    { header: 'Tgt', accessor: (d) => (d.signals.vwlmTarget || 0).toFixed(2) },
    { 
        header: 'Action', 
        accessor: (d) => {
            const action = d.signals.vwlmBuySignal ? 'buy' : 'sell';
            return React.createElement('div', { className: 'flex items-center space-x-2' }, [
                renderTradeButton(d.ticker, action, onFetchSentiment),
                renderSentimentButton(d.ticker, onFetchSentiment)
            ]);
        }
    },
];

export const PORTFOLIO_SIMULATION_COLUMNS = (onDetails: (result: PortfolioBacktestResult) => void): Column<PortfolioBacktestResult>[] => [
    { header: 'Strategy', accessor: (d) => React.createElement('span', { className: 'text-bb-orange' }, d.strategy.toUpperCase()), sortable: true },
    { header: 'Period', accessor: 'period', sortable: true },
    { header: 'Capital', accessor: (d) => d.initialCapital.toLocaleString() },
    { header: 'Final', accessor: (d) => d.finalCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 }), sortable: true },
    { header: 'Return', accessor: (d) => {
        const value = d.totalReturn;
        const color = value > 0 ? 'text-bb-green' : value < 0 ? 'text-bb-red' : 'text-bb-muted';
        const sign = value > 0 ? '+' : '';
        return React.createElement('span', { className: `${color} font-bold` }, `${sign}${value.toFixed(2)}%`);
      }, 
      sortable: true 
    },
    { header: 'Trades', accessor: 'totalTrades', sortable: true },
    { header: 'Win %', accessor: (d) => `${d.winRate.toFixed(1)}%`, sortable: true },
    { header: 'Log', accessor: (d) => React.createElement('button', { onClick: (e) => { e.stopPropagation(); onDetails(d); }, className: "text-bb-orange hover:text-white uppercase text-[10px]" }, "[ VIEW LOG ]")},
];

export const EMA_DASHBOARD_COLUMNS = (): Column<EmaSignalResult>[] => [
    { header: 'Stock', accessor: 'ticker', sortable: true },
    { header: 'Price', accessor: 'price', sortable: true },
    {
        header: 'Signal',
        accessor: (d) => {
            const signalType = d.signal.split(" ")[0];
            const type = signalType === 'BUY' ? 'buy' : signalType === 'SELL' ? 'sell' : 'neutral';
            return renderSignal(signalType, type as any);
        },
        sortable: true
    },
    { header: 'EMA9', accessor: (d) => d.ema9.toFixed(2), sortable: true },
    { header: 'EMA13', accessor: (d) => d.ema13.toFixed(2), sortable: true },
    { header: 'MACD', accessor: (d) => d.macd.toFixed(2), sortable: true },
    { header: 'RSI', accessor: (d) => d.rsi.toFixed(2), sortable: true },
];
