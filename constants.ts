

import React from 'react';
// FIX: Import missing EmaSignalResult type to fix compilation error.
import type { Column, ProcessedStock, TabType, PortfolioBacktestResult, EmaSignalResult, Sentiment } from './types';
import { BrainCircuitIcon, ListIcon } from './components/Icons';

export const Tickers: string[] = ['360ONE.NS', '3MINDIA.NS', 'AADHARHFC.NS', 'AARTIIND.NS', 'AAVAS.NS', 'ABB.NS', 'ABBOTINDIA.NS', 'ABCAPITAL.NS', 'ABFRL.NS', 'ABLBL.NS', 'ABREL.NS', 'ABSLAMC.NS', 'ACC.NS', 'ACE.NS', 'ACMESOLAR.NS', 'ADANIENSOL.NS', 'ADANIENT.NS', 'ADANIGREEN.NS', 'ADANIPORTS.NS', 'ADANIPOWER.NS', 'AEGISLOG.NS', 'AEGISVOPAK.NS', 'AFCONS.NS', 'AFFLE.NS', 'AGARWALEYE.NS', 'AIAENG.NS', 'AIIL.NS', 'AJANTPHARM.NS', 'AKUMS.NS', 'AKZOINDIA.NS', 'ALKEM.NS', 'ALKYLAMINE.NS', 'ALOKINDS.NS', 'AMBER.NS', 'AMBUJACEM.NS', 'ANANDRATHI.NS', 'ANANTRAJ.NS', 'ANGELONE.NS', 'APARINDS.NS', 'APLAPOLLO.NS', 'APLLTD.NS', 'APOLLOHOSP.NS', 'APOLLOTYRE.NS', 'APTUS.NS', 'ARE&M.NS', 'ASAHIINDIA.NS', 'ASHOKLEY.NS', 'ASIANPAINT.NS', 'ASTERDM.NS', 'ASTRAL.NS', 'ASTRAZEN.NS', 'ATGL.NS', 'ATHERENERG.NS', 'ATUL.NS', 'AUBANK.NS', 'AUROPHARMA.NS', 'AWL.NS', 'AXISBANK.NS', 'BAJAJ-AUTO.NS', 'BAJAJFINSV.NS', 'BAJAJHFL.NS', 'BAJAJHLDNG.NS', 'BAJFINANCE.NS', 'BALKRISIND.NS', 'BALRAMCHIN.NS', 'BANDHANBNK.NS', 'BANKBARODA.NS', 'BANKINDIA.NS', 'BASF.NS', 'BATAINDIA.NS', 'BAYERCROP.NS', 'BBTC.NS', 'BDL.NS', 'BEL.NS', 'BEML.NS', 'BERGEPAINT.NS', 'BHARATFORG.NS', 'BHARTIARTL.NS', 'BHARTIHEXA.NS', 'BHEL.NS', 'BIKAJI.NS', 'BIOCON.NS', 'BLS.NS', 'BLUEDART.NS', 'BLUEJET.NS', 'BLUESTARCO.NS', 'BOSCHLTD.NS', 'BPCL.NS', 'BRIGADE.NS', 'BRITANNIA.NS', 'BSE.NS', 'BSOFT.NS', 'CAMPUS.NS', 'CAMS.NS', 'CANBK.NS', 'CANFINHOME.NS', 'CAPLIPOINT.NS', 'CARBORUNIV.NS', 'CASTROLIND.NS', 'CCL.NS', 'CDSL.NS', 'CEATLTD.NS', 'CENTRALBK.NS', 'CENTURYPLY.NS', 'CERA.NS', 'CESC.NS', 'CGCL.NS', 'CGPOWER.NS', 'CHALET.NS', 'CHAMBLFERT.NS', 'CHENNPETRO.NS', 'CHOICEIN.NS', 'CHOLAFIN.NS', 'CHOLAHLDNG.NS', 'CIPLA.NS', 'CLEAN.NS', 'COALINDIA.NS', 'COCHINSHIP.NS', 'COFORGE.NS', 'COHANCE.NS', 'COLPAL.NS', 'CONCOR.NS', 'CONCORDBIO.NS', 'COROMANDEL.NS', 'CRAFTSMAN.NS', 'CREDITACC.NS', 'CRISIL.NS', 'CROMPTON.NS', 'CUB.NS', 'CUMMINSIND.NS', 'CYIENT.NS', 'DABUR.NS', 'DALBHARAT.NS', 'DATAPATTNS.NS', 'DBREALTY.NS', 'DCMSHRIRam.NS', 'DEEPAKFERT.NS', 'DEEPAKNTR.NS', 'DELHIVERY.NS', 'DEVYANI.NS', 'DIVISLAB.NS', 'DIXON.NS', 'DLF.NS', 'DMART.NS', 'DOMS.NS', 'DRREDDY.NS', 'ECLERX.NS', 'EICHERMOT.NS', 'EIDPARRY.NS', 'EIHOTEL.NS', 'ELECON.NS', 'ELGIEQUIP.NS', 'EMAMILTD.NS', 'EMCURE.NS', 'ENDURANCE.NS', 'ENGINERSIN.NS', 'ENRIN.NS', 'ERIS.NS', 'ESCORTS.NS', 'ETERNAL.NS', 'EXIDEIND.NS', 'FACT.NS', 'FEDERALBNK.NS', 'FINCABLES.NS', 'FINPIPE.NS', 'FIRSTCRY.NS', 'FIVESTAR.NS', 'FLUOROCHEM.NS', 'FORCEMOT.NS', 'FORTIS.NS', 'FSL.NS', 'GAIL.NS', 'GESHIP.NS', 'GICRE.NS', 'GILLETTE.NS', 'GLAND.NS', 'GLAXO.NS', 'GLENMARK.NS', 'GMDCLTD.NS', 'GMRAIRPORT.NS', 'GODFRYPHLP.NS', 'GODIGIT.NS', 'GODREJAGRO.NS', 'GODREJCP.NS', 'GODREJIND.NS', 'GODREJPROP.NS', 'GPIL.NS', 'GRANULES.NS', 'GRAPHITE.NS', 'GRASIM.NS', 'GRAVITA.NS', 'GRSE.NS', 'GSPL.NS', 'GUJGASLTD.NS', 'GVT&D.NS', 'HAL.NS', 'HAPPSTMNDS.NS', 'HAVELLS.NS', 'HBLENGINE.NS', 'HCLTECH.NS', 'HDFCAMC.NS', 'HDFCBANK.NS', 'HDFCLIFE.NS', 'HEG.NS', 'HEROMOTOCO.NS', 'HEXT.NS', 'HFCL.NS', 'HINDALCO.NS', 'HINDCOPPER.NS', 'HINDPETRO.NS', 'HINDUNILVR.NS', 'HINDZINC.NS', 'HOMEFIRST.NS', 'HONASA.NS', 'HONAUT.NS', 'HSCL.NS', 'HUDCO.NS', 'HYUNDAI.NS', 'ICICIBANK.NS', 'ICICIGI.NS', 'ICICIPRULI.NS', 'IDBI.NS', 'IDEA.NS', 'IDFCFIRSTB.NS', 'IEX.NS', 'IFCI.NS', 'IGIL.NS', 'IGL.NS', 'IIFL.NS', 'IKS.NS', 'INDGN.NS', 'INDHOTEL.NS', 'INDIACEM.NS', 'INDIAMART.NS', 'INDIANB.NS', 'INDIGO.NS', 'INDUSINDBK.NS', 'INDUSTOWER.NS', 'INFY.NS', 'INOXINDIA.NS', 'INOXWIND.NS', 'INTELLECT.NS', 'IOB.NS', 'IOC.NS', 'IPCALAB.NS', 'IRB.NS', 'IRCON.NS', 'IRCTC.NS', 'IREDA.NS', 'IRFC.NS', 'ITC.NS', 'ITCHOTELS.NS', 'ITI.NS', 'J&KBANK.NS', 'JBCHEPHARM.NS', 'JBMA.NS', 'JINDALSAW.NS', 'JINDALSTEL.NS', 'JIOFIN.NS', 'JKCEMENT.NS', 'JKTYRE.NS', 'JMFINANCIL.NS', 'JPPOWER.NS', 'JSL.NS', 'JSWENERGY.NS', 'JSWINFRA.NS', 'JSWSTEEL.NS', 'JUBLFOOD.NS', 'JUBLINGREA.NS', 'JUBLPHARMA.NS', 'JWL.NS', 'JYOTHYLAB.NS', 'JYOTICNC.NS', 'KAJARIACER.NS', 'KALYANKJIL.NS', 'KARURVYSYA.NS', 'KAYNES.NS', 'KEC.NS', 'KEI.NS', 'KFINTECH.NS', 'KIMS.NS', 'KIRLOSBROS.NS', 'KIRLOSENG.NS', 'KOTAKBANK.NS', 'KPIL.NS', 'KPITTECH.NS', 'KPRMILL.NS', 'KSB.NS', 'LALPATHLAB.NS', 'LATENTVIEW.NS', 'LAURUSLABS.NS', 'LEMONTREE.NS', 'LICHSGFIN.NS', 'LICI.NS', 'LINDEINDIA.NS', 'LLOYDSME.NS', 'LODHA.NS', 'LT.NS', 'LTF.NS', 'LTFOODS.NS', 'LTIM.NS', 'LTTS.NS', 'LUPIN.NS', 'M&M.NS', 'M&MFIN.NS', 'MAHABANK.NS', 'MAHSCOOTER.NS', 'MAHSEAMLES.NS', 'MANAPPURAM.NS', 'MANKIND.NS', 'MANYAVAR.NS', 'MAPMYINDIA.NS', 'MARICO.NS', 'MARUTI.NS', 'MAXHEALTH.NS', 'MAZDOCK.NS', 'MCX.NS', 'MEDANTA.NS', 'METROPOLIS.NS', 'MFSL.NS', 'MGL.NS', 'MINDACORP.NS', 'MMTC.NS', 'MOTHERSON.NS', 'MOTILALOFS.NS', 'MPHASIS.NS', 'MRF.NS', 'MRPL.NS', 'MSUMI.NS', 'MUTHOOTFIN.NS', 'NAM-INDIA.NS', 'NATCOPHARM.NS', 'NATIONALUM.NS', 'NAUKRI.NS', 'NAVA.NS', 'NAVINFLUOR.NS', 'NBCC.NS', 'NCC.NS', 'NESTLEIND.NS', 'NETWEB.NS', 'NEULANDLAB.NS', 'NEWGEN.NS', 'NH.NS', 'NHPC.NS', 'NIACL.NS', 'NIVABUPA.NS', 'NLCINDIA.NS', 'NMDC.NS', 'NSLNISP.NS', 'NTPC.NS', 'NTPCGREEN.NS', 'NUVAMA.NS', 'NUVOCO.NS', 'NYKAA.NS', 'OBEROIRLTY.NS', 'OFSS.NS', 'OIL.NS', 'OLAELEC.NS', 'OLECTRA.NS', 'ONESOURCE.NS', 'ONGC.NS', 'PAGEIND.NS', 'PATANJALI.NS', 'PAYTM.NS', 'PCBL.NS', 'PERSISTENT.NS', 'PETRONET.NS', 'PFC.NS', 'PFIZER.NS', 'PGEL.NS', 'PGHH.NS', 'PHOENIXLTD.NS', 'PIDILITIND.NS', 'PIIND.NS', 'PNB.NS', 'PNBHOUSING.NS', 'POLICYBZR.NS', 'POLYCAB.NS', 'POLYMED.NS', 'POONAWALLA.NS', 'POWERGRID.NS', 'POWERINDIA.NS', 'PPLPHARMA.NS', 'PRAJIND.NS', 'PREMIERENE.NS', 'PRESTIGE.NS', 'PTCIL.NS', 'PVRINOX.NS', 'RADICO.NS', 'RAILTEL.NS', 'RAINBOW.NS', 'RAMCOCEM.NS', 'RBLBANK.NS', 'RCF.NS', 'RECLTD.NS', 'REDINGTON.NS', 'RELIANCE.NS', 'RELINFRA.NS', 'RHIM.NS', 'RITES.NS', 'RKFORGE.NS', 'RPOWER.NS', 'RRKABEL.NS', 'RVNL.NS', 'SAGILITY.NS', 'SAIL.NS', 'SAILIFE.NS', 'SAMMAANCAP.NS', 'SAPPHIRE.NS', 'SARDAEN.NS', 'SAREGAMA.NS', 'SBFC.NS', 'SBICARD.NS', 'SBILIFE.NS', 'SBIN.NS', 'SCHAEFFLER.NS', 'SCHNEIDER.NS', 'SCI.NS', 'SHREECEM.NS', 'SHRIRAMFIN.NS', 'SHYAMMETL.NS', 'SIEMENS.NS', 'SIGNATURE.NS', 'SJVN.NS', 'SKFINDIA.NS', 'SOBHA.NS', 'SOLARINDS.NS', 'SONACOMS.NS', 'SONATSOFTW.NS', 'SRF.NS', 'STARHEALTH.NS', 'SUMICHEM.NS', 'SUNDARMFIN.NS', 'SUNDRMFAST.NS', 'SUNPHARMA.NS', 'SUNTV.NS', 'SUPREMEIND.NS', 'SUZLON.NS', 'SWANCORP.NS', 'SWIGGY.NS', 'SYNGENE.NS', 'SYRMA.NS', 'TARIL.NS', 'TATACHEM.NS', 'TATACOMM.NS', 'TATACONSUM.NS', 'TATAELXSI.NS', 'TATAINVEST.NS', 'TATAMOTORS.NS', 'TATAPOWER.NS', 'TATASTEEL.NS', 'TATATECH.NS', 'TBOTEK.NS', 'TCS.NS', 'TECHM.NS', 'TECHNOE.NS', 'TEJASNET.NS', 'THELEELA.NS', 'THERMAX.NS', 'TIINDIA.NS', 'TIMKEN.NS', 'TITAGARH.NS', 'TITAN.NS', 'TORNTPHARM.NS', 'TORNTPOWER.NS', 'TRENT.NS', 'TRIDENT.NS', 'TRITURBINE.NS', 'TRIVENI.NS', 'TTML.NS', 'TVSMOTOR.NS', 'UBL.NS', 'UCOBANK.NS', 'ULTRACEMCO.NS', 'UNIONBANK.NS', 'UNITDSPR.NS', 'UNOMINDA.NS', 'UPL.NS', 'USHAMART.NS', 'UTIAMC.NS', 'VBL.NS', 'VEDL.NS', 'VENTIVE.NS', 'VGUARD.NS', 'VIJAYA.NS', 'VMM.NS', 'VOLTAS.NS', 'VTL.NS', 'WAAREEENER.NS', 'WELCORP.NS', 'WELSPUNLIV.NS', 'WHIRLPOOL.NS', 'WIPRO.NS', 'WOCKPHARMA.NS', 'YESBANK.NS', 'ZEEL.NS', 'ZENSARTECH.NS', 'ZENTEC.NS', 'ZFCVINDIA.NS', 'ZYDUSLIFE.NS'];


export const TABS: TabType[] = ['Volume/Trend', 'Short-term Crossover', 'VWLM', 'VWLM Intraday', 'Risk Desk', 'AI Coach', 'Portfolio Simulation', 'Strategy Backtester', 'User Manual', 'Recent News'];

const renderSignal = (text: string, type: 'buy' | 'sell' | 'neutral' | 'bullish' | 'bearish') => {
    let colorClass = 'text-bb-muted';
    if (type === 'buy' || type === 'bullish') {
        colorClass = 'text-bb-green font-bold';
    } else if (type === 'sell' || type === 'bearish') {
        colorClass = 'text-bb-red font-bold';
    }
    return React.createElement('span', { className: colorClass }, text.toUpperCase());
};

const renderSentimentButton = (ticker: string, onFetch: (ticker: string, type: 'sentiment') => void) => (
  React.createElement('button', 
    { 
      onClick: (e) => { e.stopPropagation(); onFetch(ticker, 'sentiment'); }, 
      className: "text-bb-blue hover:text-white hover:underline uppercase text-[10px]"
    }, 
    "[ NEWS ]"
  )
);

const renderThesisButton = (ticker: string, onFetch: (ticker: string, type: 'thesis') => void) => (
  React.createElement('button', 
    { 
      onClick: (e) => { e.stopPropagation(); onFetch(ticker, 'thesis'); }, 
      className: "text-bb-orange hover:text-white hover:underline uppercase text-[10px] ml-2"
    }, 
    "[ THESIS ]"
  )
);

const renderDetailsButton = (result: PortfolioBacktestResult, onDetails: (result: PortfolioBacktestResult) => void) => (
    React.createElement('button', 
      { 
        onClick: (e) => { e.stopPropagation(); onDetails(result); }, 
        className: "text-bb-orange hover:text-white uppercase text-[10px]"
      }, 
      "[ VIEW LOG ]"
    )
);

export const VOLUME_TREND_COLUMNS = (onFetchSentiment: (ticker: string, type: 'sentiment' | 'thesis') => void, sentiments: Record<string, Sentiment> = {}): Column<ProcessedStock>[] => [
    { header: 'Ticker', accessor: (d) => React.createElement('span', { className: 'text-bb-blue font-bold' }, d.ticker), sortable: true },
    { header: 'Price', accessor: (d) => d.data.currentPrice.toFixed(2), sortable: true },
    { 
      header: 'Spike', 
      accessor: (d) => d.signals.volumeSignal === 'Spike' 
        ? React.createElement('span', { className: 'text-bb-orange animate-pulse font-bold' }, '>>>')
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
    { header: 'Vol Sig', accessor: (d) => renderSignal(d.signals.volumeEmaSignal, d.signals.volumeEmaSignal.toLowerCase() as any) },
    { header: 'Trend', accessor: (d) => {
        const type = d.signals.trendSignal === 'Uptrend' ? 'buy' : d.signals.trendSignal === 'Downtrend' ? 'sell' : 'neutral';
        return renderSignal(d.signals.trendSignal, type);
      } 
    },
    { header: 'ADX', accessor: (d) => d.indicators.adx[d.indicators.adx.length - 1]?.toFixed(2) || 'N/A', sortable: true },
    { header: 'Stop', accessor: (d) => d.signals.stopLoss.toFixed(2) },
    { header: 'Tgt', accessor: (d) => d.signals.target.toFixed(2) },
    { header: 'Size', accessor: (d) => d.signals.suggestedShares?.toLocaleString() || '-', sortable: true },
    { 
        header: 'AI Analysis', 
        accessor: (d) => {
            return React.createElement('div', { className: 'flex items-center' }, [
                renderSentimentButton(d.ticker, onFetchSentiment),
                renderThesisButton(d.ticker, onFetchSentiment)
            ]);
        }
    },
];

export const SHORT_TERM_CROSSOVER_COLUMNS = (onFetchSentiment: (ticker: string, type: 'sentiment' | 'thesis') => void): Column<ProcessedStock>[] => [
    { header: 'Ticker', accessor: (d) => React.createElement('span', { className: 'text-bb-blue font-bold' }, d.ticker), sortable: true },
    { header: 'Price', accessor: (d) => d.data.currentPrice.toFixed(2), sortable: true },
    { header: 'Signal', accessor: (d) => renderSignal(d.signals.shortTermCrossBuySignal ? 'Buy' : 'Sell', d.signals.shortTermCrossBuySignal ? 'buy' : 'sell') },
    { header: 'Type', accessor: (d) => d.signals.shortTermCrossBuySignal ? 'GOLDEN CROSS' : 'DEATH CROSS' },
    { header: 'SMA 20', accessor: (d) => d.indicators.sma20[d.indicators.sma20.length - 1]?.toFixed(2) || 'N/A', sortable: true },
    { header: 'SMA 50', accessor: (d) => d.indicators.sma50[d.indicators.sma50.length - 1]?.toFixed(2) || 'N/A', sortable: true },
    { 
        header: 'Stop', 
        accessor: (d) => {
            const sl = d.signals.shortTermCrossBuySignal ? d.signals.stcStopLoss : d.signals.stcSellStopLoss;
            return sl ? sl.toFixed(2) : 'N/A';
        }
    },
    { 
        header: 'Tgt', 
        accessor: (d) => {
            const target = d.signals.shortTermCrossBuySignal ? d.signals.stcTarget : d.signals.stcSellTarget;
            return target ? target.toFixed(2) : 'N/A';
        }
    },
    { header: 'Size', accessor: (d) => d.signals.suggestedShares?.toLocaleString() || '-', sortable: true },
    { header: 'AI', accessor: (d) => React.createElement('div', { className: 'flex' }, [renderSentimentButton(d.ticker, onFetchSentiment), renderThesisButton(d.ticker, onFetchSentiment)])},
];

export const VWLM_COLUMNS = (onFetchSentiment: (ticker: string, type: 'sentiment' | 'thesis') => void): Column<ProcessedStock>[] => [
    { header: 'Ticker', accessor: (d) => React.createElement('span', { className: 'text-bb-blue font-bold' }, d.ticker), sortable: true },
    { header: 'Price', accessor: (d) => d.data.currentPrice.toFixed(2), sortable: true },
    { header: 'Signal', accessor: (d) => renderSignal(d.signals.vwlmBuySignal ? 'Buy' : 'Sell', d.signals.vwlmBuySignal ? 'buy' : 'sell') },
    { header: 'Xt STR', accessor: (d) => {
        const strength = d.signals.vwlmStrength;
        const color = strength > 0 ? 'text-bb-green' : 'text-bb-red';
        return React.createElement('span', {className: color}, strength.toFixed(4))
      }, 
      sortable: true
    },
    { header: 'ADX', accessor: (d) => d.indicators.adx[d.indicators.adx.length - 1]?.toFixed(2) || 'N/A', sortable: true },
    { header: 'RSI', accessor: (d) => d.indicators.rsi[d.indicators.rsi.length - 1]?.toFixed(2) || 'N/A', sortable: true },
    { header: 'Stop', accessor: (d) => {
        const sl = d.signals.vwlmBuySignal ? d.signals.vwlmStopLoss : d.signals.vwlmStopLoss;
        return sl ? sl.toFixed(2) : 'N/A';
      } 
    },
    { header: 'Tgt', accessor: (d) => {
        const target = d.signals.vwlmBuySignal ? d.signals.vwlmTarget : d.signals.vwlmTarget;
        return target ? target.toFixed(2) : 'N/A';
      } 
    },
    { header: 'Size', accessor: (d) => d.signals.suggestedShares?.toLocaleString() || '-', sortable: true },
    { header: 'AI', accessor: (d) => React.createElement('div', { className: 'flex' }, [renderSentimentButton(d.ticker, onFetchSentiment), renderThesisButton(d.ticker, onFetchSentiment)])},
];

export const VWLM_INTRADAY_COLUMNS = (onFetchSentiment: (ticker: string, type: 'sentiment' | 'thesis') => void): Column<ProcessedStock>[] => [
    { header: 'Ticker', accessor: (d) => React.createElement('span', { className: 'text-bb-blue font-bold' }, d.ticker), sortable: true },
    { header: 'Price', accessor: (d) => d.data.currentPrice.toFixed(2), sortable: true },
    { header: 'Signal', accessor: (d) => renderSignal(d.signals.vwlmIntradayBuySignal ? 'Buy' : 'Sell', d.signals.vwlmIntradayBuySignal ? 'buy' : 'sell') },
    { header: 'Xt STR', accessor: (d) => {
        const strength = d.signals.vwlmIntradayStrength;
        const color = strength > 0 ? 'text-bb-green' : 'text-bb-red';
        return React.createElement('span', {className: color}, strength.toFixed(4))
      }, 
      sortable: true
    },
    { header: 'Stop', accessor: (d) => {
        const sl = d.signals.vwlmIntradayBuySignal ? d.signals.vwlmIntradayStopLoss : d.signals.vwlmIntradayStopLoss;
        return sl ? sl.toFixed(2) : 'N/A';
      } 
    },
    { header: 'Tgt', accessor: (d) => {
        const target = d.signals.vwlmIntradayBuySignal ? d.signals.vwlmIntradayTarget : d.signals.vwlmIntradayTarget;
        return target ? target.toFixed(2) : 'N/A';
      } 
    },
    { header: 'Size', accessor: (d) => d.signals.suggestedShares?.toLocaleString() || '-', sortable: true },
    { header: 'AI', accessor: (d) => React.createElement('div', { className: 'flex' }, [renderSentimentButton(d.ticker, onFetchSentiment), renderThesisButton(d.ticker, onFetchSentiment)])},
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
    { header: 'Log', accessor: (d) => renderDetailsButton(d, onDetails)},
];

// FIX: Add missing EMA_DASHBOARD_COLUMNS constant.
export const EMA_DASHBOARD_COLUMNS = (): Column<EmaSignalResult>[] => [
    { header: 'Stock', accessor: 'ticker', sortable: true },
    { header: 'Price', accessor: (d) => d.price.toFixed(2), sortable: true },
    {
        header: 'Signal',
        accessor: (d) => {
            const signalType = d.signal.split(" ")[0];
            const type = signalType === 'BUY' ? 'buy' : signalType === 'SELL' ? 'sell' : 'neutral';
            return renderSignal(signalType, type as 'buy' | 'sell' | 'neutral');
        },
        sortable: true
    },
    { header: 'EMA9', accessor: (d) => d.ema9.toFixed(2), sortable: true },
    { header: 'EMA13', accessor: (d) => d.ema13.toFixed(2), sortable: true },
    { header: 'MACD', accessor: (d) => d.macd.toFixed(2), sortable: true },
    { header: 'RSI', accessor: (d) => d.rsi.toFixed(2), sortable: true },
    { header: 'Stoch', accessor: (d) => d.stochRsi.toFixed(2), sortable: true },
];