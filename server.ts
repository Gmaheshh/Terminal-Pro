import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import zerodhaService from './services/zerodhaService';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Trust proxy for Cloud Run/Nginx
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGINS || '*',
    credentials: true
}));
app.use(session({
    secret: process.env.SESSION_SECRET || 'pragati-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        httpOnly: true
    }
}));

// --- API ROUTES ---

// Zerodha Kite Connect Authentication
app.get('/api/zerodha/login', (req, res) => {
    const loginUrl = zerodhaService.getLoginUrl();
    res.json({ loginUrl });
});

app.get('/api/zerodha/callback', async (req, res) => {
    const requestToken = req.query.request_token as string;
    
    if (!requestToken) {
        return res.status(400).json({ error: 'Missing request_token' });
    }
    
    try {
        const sessionData = await zerodhaService.generateSession(requestToken);
        req.session.kiteAccessToken = sessionData.access_token;
        req.session.kiteUserId = sessionData.user_id;
        
        res.redirect('/?kite_auth=success');
    } catch (error: any) {
        console.error('Zerodha auth error:', error);
        res.redirect('/?kite_auth=error');
    }
});

app.get('/api/zerodha/status', (req, res) => {
    res.json({
        authenticated: zerodhaService.isAuthenticated(),
        userId: req.session.kiteUserId || null
    });
});

// 0. Health Checks
app.get('/api/health', (req, res) => res.send('PRA-GATI running'));
app.get('/healthz', (req, res) => res.send('OK'));

// --- GENERIC MARKET DATA PROXIES ---

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15'
];

async function fetchWithRetry(url: string, retries = 3, delay = 2000): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
            const response = await axios.get(url, {
                headers: { 
                    'User-Agent': userAgent,
                    'Accept': 'application/json'
                },
                timeout: 15000
            });
            return response;
        } catch (error: any) {
            if (error.response && error.response.status === 429 && i < retries - 1) {
                console.warn(`Rate limited (429) for ${url}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else if (i < retries - 1) {
                console.warn(`Request failed for ${url}. Retrying in ${delay/2}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay/2));
            } else {
                throw error;
            }
        }
    }
}

// 8. Yahoo Finance Fundamentals Proxy
app.get('/api/market/fundamentals', async (req, res) => {
    const { ticker } = req.query;
    if (!ticker) return res.status(400).json({ error: 'Ticker required' });

    const modules = "financialData,defaultKeyStatistics,assetProfile,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,summaryDetail";
    const url = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${encodeURIComponent(ticker as string)}?modules=${modules}`;

    try {
        const response = await fetchWithRetry(url);
        res.json(response.data);
    } catch (error: any) {
        console.error('Yahoo Fundamentals Error:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch fundamentals' });
    }
});

// 9. Yahoo Finance Historical Proxy
app.get('/api/market/historical', async (req, res) => {
    const { ticker, range, interval } = req.query;
    if (!ticker) return res.status(400).json({ error: 'Ticker required' });

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker as string)}?range=${range || '2y'}&interval=${interval || '1d'}`;

    try {
        const response = await fetchWithRetry(url);
        res.json(response.data);
    } catch (error: any) {
        console.error('Yahoo Historical Error:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch historical data' });
    }
});

// 10. NSE Option Chain Proxy
app.get('/api/market/option-chain', async (req, res) => {
    const { symbol, isIndex } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });

    const baseUrl = isIndex === 'true' 
        ? `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`
        : `https://www.nseindia.com/api/option-chain-equities?symbol=${symbol}`;

    try {
        // NSE requires a cookie-handshake often. We'll try a direct fetch first.
        const response = await axios.get(baseUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.nseindia.com/option-chain',
            },
            timeout: 10000
        });
        res.json(response.data);
    } catch (error: any) {
        console.error('NSE Option Chain Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch option chain from NSE' });
    }
});

// --- VITE / STATIC SERVING ---
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Root health check for Cloud Run
    app.get('/', (req, res, next) => {
        const userAgent = req.headers['user-agent'] || '';
        if (userAgent.includes('GooglePagespeed') || userAgent.includes('Google-Cloud-Run')) {
            return res.send('PRA-GATI running');
        }
        next();
    });

    // Catch-all route for SPA - Express 5.x compatible
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // Lazy load Vite in development
    import('vite').then(({ createServer: createViteServer }) => {
        createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        }).then(vite => {
            app.use(vite.middlewares);
            console.log('Vite dev middleware loaded');
        });
    }).catch(err => {
        console.error('Failed to load Vite:', err);
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV})`);
});
