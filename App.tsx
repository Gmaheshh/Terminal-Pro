import React, { useEffect, useMemo, useState } from 'react';

type Zone = 'Intelligence Hub' | 'Investing Tree' | 'Trading Desk';
type Signal = {
  ticker: string;
  close: number;
  date: string;
  action: string;
  indicators: { rsi14: number; ema20: number; ema50: number; macd: number; atr14: number; vwap: number };
  executionPlan: { when: string; stopLoss: number; target: number; riskReward: number };
};

const card = 'bg-white border-2 border-slate-200 shadow-[0_20px_40px_rgba(15,23,42,0.08)] rounded-[3rem] p-6';

const App: React.FC = () => {
  const [zone, setZone] = useState<Zone>('Intelligence Hub');
  const [token, setToken] = useState<string | null>(localStorage.getItem('pragati_jwt'));
  const [ticker, setTicker] = useState('RELIANCE.NS');
  const [history, setHistory] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalsToday, setSignalsToday] = useState<Signal[]>([]);
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  useEffect(() => {
    fetch('/api/market/quote').then((r) => r.json()).then((d) => setQuotes(d.data ?? []));
    fetch(`/api/market/news?ticker=${encodeURIComponent('^NSEI')}`).then((r) => r.json()).then((d) => setNews(d.items ?? []));
  }, []);

  useEffect(() => {
    fetch(`/api/market/history?ticker=${encodeURIComponent(ticker)}&interval=1d&period=1y`)
      .then((r) => r.json())
      .then((d) => setHistory(d.candles ?? []));
  }, [ticker]);

  const doLogin = async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('pragati_jwt', data.token);
    } else {
      alert(data.error?.message ?? 'Login failed');
    }
  };

  const runUniverse = async () => {
    if (!token) return;
    const response = await fetch('/api/signals/universe', { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    setSignals(data.signals ?? []);
    setSignalsToday(data.signalsToday ?? []);
  };

  const runSingle = async () => {
    if (!token) return;
    const response = await fetch(`/api/signals/run?ticker=${encodeURIComponent(ticker)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setSignals(data.signal ? [data.signal] : []);
    setSignalsToday(data.signal?.action === 'BUY_NEXT_OPEN' ? [data.signal] : []);
  };

  const regime = useMemo(() => {
    const advancers = quotes.filter((q) => (q.regularMarketChangePercent ?? 0) > 0).length;
    const decliners = quotes.length - advancers;
    return advancers >= decliners ? 'Risk-On' : 'Risk-Off';
  }, [quotes]);

  const exportCsv = () => {
    const rows = signals.map((s) => `${s.ticker},${s.close},${s.action},${s.indicators.rsi14.toFixed(2)},${s.executionPlan.stopLoss.toFixed(2)},${s.executionPlan.target.toFixed(2)}`);
    const blob = new Blob([`Ticker,Close,Action,RSI,StopLoss,Target\n${rows.join('\n')}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pragati-signals.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 font-sans">
      <header className={`${card} mb-4`}>
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight"><span className="text-red-500">PRA</span><span className="text-green-600">-GATI</span> Terminal</h1>
          <div className="text-sm font-medium">Market Regime: <span className="text-indigo-600">{regime}</span> | Watchlist: {quotes.length}</div>
        </div>
        <div className="grid md:grid-cols-4 gap-3 mt-4">
          {quotes.slice(0, 4).map((q: any) => <div key={q.symbol} className="rounded-2xl border border-slate-200 p-3"><div className="font-semibold">{q.symbol}</div><div className="font-mono">{q.regularMarketPrice}</div></div>)}
        </div>
      </header>

      <nav className={`${card} mb-4 flex gap-2 overflow-auto`}>
        {(['Intelligence Hub', 'Investing Tree', 'Trading Desk'] as Zone[]).map((z) => (
          <button key={z} onClick={() => setZone(z)} className={`px-5 py-2 rounded-full border ${zone === z ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300'}`}>{z}</button>
        ))}
      </nav>

      <main className={card}>
        {zone === 'Intelligence Hub' && (
          <div className="grid lg:grid-cols-2 gap-4">
            <section>
              <h2 className="text-xl font-semibold mb-3">Recent News</h2>
              <ul className="space-y-2">
                {news.map((n: any, idx) => <li key={idx} className="border rounded-2xl p-3"><a className="text-indigo-700 hover:underline" href={n.link} target="_blank">{n.title}</a><div className="text-xs text-slate-500">{n.publisher}</div></li>)}
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3">Macro Matrix</h2>
              <table className="w-full text-sm"><thead><tr className="text-left border-b"><th>Symbol</th><th>Price</th><th>Change %</th></tr></thead><tbody>{quotes.map((q: any) => <tr key={q.symbol} className="border-b"><td>{q.symbol}</td><td className="font-mono">{q.regularMarketPrice}</td><td>{Number(q.regularMarketChangePercent ?? 0).toFixed(2)}%</td></tr>)}</tbody></table>
            </section>
          </div>
        )}

        {zone === 'Investing Tree' && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Company Analysis</h2>
            <div className="flex gap-2 mb-3">
              <input className="border rounded-xl px-3 py-2" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="border rounded-2xl p-3"><div className="text-sm text-slate-500 mb-2">Price trend (latest 15 days)</div>{history.slice(-15).map((c: any) => <div key={c.date} className="flex justify-between text-sm"><span>{c.date}</span><span className="font-mono">{c.close?.toFixed(2)}</span></div>)}</div>
              <div className="border rounded-2xl p-3"><div className="font-semibold mb-2">Key Stats (placeholder)</div><div className="text-sm">P/E: --</div><div className="text-sm">ROE: --</div><div className="text-sm">Debt/Equity: --</div><div className="text-sm mt-3 font-semibold">Financial Table</div><div className="text-sm text-slate-500">Revenue, EBITDA, PAT placeholders</div></div>
            </div>
          </div>
        )}

        {zone === 'Trading Desk' && (
          <div>
            {!token ? (
              <div className="max-w-md border rounded-3xl p-4">
                <h2 className="font-semibold text-lg mb-2">Login Required</h2>
                <input placeholder="Username" className="w-full border rounded-xl px-3 py-2 mb-2" onChange={(e) => setCredentials((s) => ({ ...s, username: e.target.value }))} />
                <input placeholder="Password" type="password" className="w-full border rounded-xl px-3 py-2 mb-2" onChange={(e) => setCredentials((s) => ({ ...s, password: e.target.value }))} />
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl" onClick={doLogin}>Login</button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  <input className="border rounded-xl px-3 py-2" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl" onClick={runSingle}>Run Signal</button>
                  <button className="bg-slate-900 text-white px-4 py-2 rounded-xl" onClick={runUniverse}>Scan Universe</button>
                  <button className="border border-slate-300 px-4 py-2 rounded-xl" onClick={exportCsv}>Export CSV</button>
                </div>
                <h3 className="font-semibold mb-2">Signals Today</h3>
                <table className="w-full text-sm mb-4"><thead><tr className="text-left border-b"><th>Ticker</th><th>Action</th><th>RSI</th><th>ATR</th></tr></thead><tbody>{signalsToday.map((s) => <tr key={s.ticker} className="border-b"><td>{s.ticker}</td><td>{s.action}</td><td className="font-mono">{s.indicators.rsi14.toFixed(2)}</td><td className="font-mono">{s.indicators.atr14.toFixed(2)}</td></tr>)}</tbody></table>
                <h3 className="font-semibold mb-2">Execute Next Open Plan</h3>
                <table className="w-full text-sm"><thead><tr className="text-left border-b"><th>Ticker</th><th>Stop</th><th>Target</th><th>R:R</th></tr></thead><tbody>{signals.map((s) => <tr key={`${s.ticker}-plan`} className="border-b"><td>{s.ticker}</td><td className="font-mono">{s.executionPlan.stopLoss.toFixed(2)}</td><td className="font-mono">{s.executionPlan.target.toFixed(2)}</td><td className="font-mono">{s.executionPlan.riskReward}</td></tr>)}</tbody></table>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
