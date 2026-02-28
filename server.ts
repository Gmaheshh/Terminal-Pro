import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { STOCK_UNIVERSE, DEFAULT_TICKER } from './backend/config/universe';
import { rateLimit } from './backend/middleware/rateLimit';
import { parseNumber, validateTicker } from './backend/middleware/validation';
import { issueToken, requireAuth } from './backend/middleware/auth';
import { errorHandler, notFound, asyncHandler, ApiError } from './backend/utils/http';
import { fetchHistory, fetchNews, fetchQuote } from './backend/services/marketDataService';
import { buildSignal } from './backend/services/signalService';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(rateLimit(150, 60_000));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'PRA-GATI Terminal' });
});

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  if (!adminUser || !adminPass) {
    throw new ApiError(500, 'ADMIN_USER / ADMIN_PASS are not configured', 'CONFIG_ERROR');
  }

  if (username !== adminUser || password !== adminPass) {
    throw new ApiError(401, 'Invalid credentials', 'UNAUTHORIZED');
  }

  const token = issueToken(username);
  res.json({ token, user: { username } });
}));

app.get('/api/market/history', asyncHandler(async (req, res) => {
  const ticker = (req.query.ticker as string) || DEFAULT_TICKER;
  const interval = (req.query.interval as string) || '1d';
  const period = (req.query.period as string) || '1y';
  validateTicker(ticker);

  const candles = await fetchHistory(ticker, interval, period);
  res.json({ ticker, interval, period, candles });
}));

app.get('/api/market/news', asyncHandler(async (req, res) => {
  const ticker = (req.query.ticker as string) || '^NSEI';
  validateTicker(ticker);
  const items = await fetchNews(ticker);
  res.json({ ticker, items });
}));

app.get('/api/market/quote', asyncHandler(async (req, res) => {
  const symbols = ((req.query.symbols as string) || '^NSEI,^NSEBANK,RELIANCE.NS,TCS.NS').split(',');
  const clean = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean);
  clean.forEach(validateTicker);
  const data = await fetchQuote(clean);
  res.json({ symbols: clean, data });
}));

app.get('/api/signals/run', requireAuth, asyncHandler(async (req, res) => {
  const ticker = (req.query.ticker as string) || DEFAULT_TICKER;
  const period = (req.query.period as string) || '6mo';
  validateTicker(ticker);

  const candles = await fetchHistory(ticker, '1d', period);
  const signal = buildSignal(ticker, candles);
  res.json({ signal });
}));

app.get('/api/signals/universe', requireAuth, asyncHandler(async (req, res) => {
  const max = parseNumber(req.query.max as string, STOCK_UNIVERSE.length);
  const universe = STOCK_UNIVERSE.slice(0, Math.max(1, max));

  const signals = await Promise.all(
    universe.map(async (ticker) => {
      const candles = await fetchHistory(ticker, '1d', '6mo');
      return buildSignal(ticker, candles);
    })
  );

  const signalsToday = signals.filter((s) => s.action === 'BUY_NEXT_OPEN');
  res.json({ universe, generatedAt: new Date().toISOString(), signals, signalsToday });
}));

if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.join(__dirname, 'dist');

  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else if (process.env.NODE_ENV !== 'test') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PRA-GATI Terminal running on ${PORT}`);
  });
}

export default app;
