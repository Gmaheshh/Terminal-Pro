import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { KiteConnect } from 'kiteconnect';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Trust proxy for Cloud Run/Nginx
app.set('trust proxy', 1);

// Kite Connect Config
const KITE_API_KEY = process.env.KITE_API_KEY;
const KITE_API_SECRET = process.env.KITE_API_SECRET;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(session({
    secret: 'pragati-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        httpOnly: true
    }
}));

// Kite Connect Instance Helper
const getKite = (accessToken?: string): any => {
    const kite = new KiteConnect({
        api_key: KITE_API_KEY!,
    });
    if (accessToken) {
        kite.setAccessToken(accessToken);
    }
    return kite;
};

// --- API ROUTES ---

// 0. Health Checks
app.get('/api/health', (req, res) => res.send('PRA-GATI running'));
app.get('/healthz', (req, res) => res.send('OK'));

// 1. Get Login URL
app.get('/api/auth/kite/url', (req, res) => {
    if (!KITE_API_KEY) {
        return res.status(500).json({ error: 'KITE_API_KEY not configured' });
    }
    const kite = getKite();
    const loginUrl = kite.getLoginURL();
    res.json({ url: loginUrl });
});

// 2. Auth Callback
app.get('/api/auth/kite/callback', async (req, res) => {
    const requestToken = req.query.request_token as string;
    
    if (!requestToken) {
        return res.status(400).send('Missing request_token');
    }

    try {
        const kite = getKite();
        const response = await kite.generateSession(requestToken, KITE_API_SECRET!);
        
        // Store in session
        (req.session as any).kiteAccessToken = response.access_token;
        (req.session as any).kitePublicToken = response.public_token;
        (req.session as any).user = response;

        res.send(`
            <html>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ type: 'KITE_AUTH_SUCCESS' }, '*');
                            window.close();
                        } else {
                            window.location.href = '/';
                        }
                    </script>
                    <p>Authentication successful. You can close this window.</p>
                </body>
            </html>
        `);
    } catch (error: any) {
        console.error('Kite Auth Error:', error);
        res.status(500).send('Authentication failed: ' + error.message);
    }
});

// 3. Check Auth Status
app.get('/api/auth/kite/status', (req, res) => {
    const sessionData = req.session as any;
    res.json({
        isAuthenticated: !!sessionData.kiteAccessToken,
        user: sessionData.user || null
    });
});

// 4. Logout
app.post('/api/auth/kite/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

let instrumentMap: Record<string, string> = {};

async function refreshInstrumentMap(kite: any) {
    try {
        const instruments = await kite.getInstruments();
        const map: Record<string, string> = {};
        instruments.forEach((inst: any) => {
            if (inst.exchange === 'NSE' || inst.exchange === 'NFO') {
                map[inst.tradingsymbol] = inst.instrument_token;
            }
        });
        instrumentMap = map;
        console.log('Instrument map refreshed');
    } catch (e) {
        console.error('Failed to refresh instrument map', e);
    }
}

// 5. Fetch Historical Data
app.get('/api/kite/historical', async (req, res) => {
    const { ticker, interval, from, to } = req.query;
    const accessToken = (req.session as any).kiteAccessToken;

    if (!accessToken) {
        return res.status(401).json({ error: 'Not authenticated with Kite' });
    }

    try {
        const kite = getKite(accessToken);
        
        // Refresh map if empty
        if (Object.keys(instrumentMap).length === 0) {
            await refreshInstrumentMap(kite);
        }

        // Clean ticker (remove .NS if present)
        const cleanTicker = (ticker as string).replace('.NS', '');
        const instrumentToken = instrumentMap[cleanTicker];

        if (!instrumentToken) {
            return res.status(404).json({ error: `Instrument token not found for ${cleanTicker}` });
        }

        const data = await kite.getHistoricalData(
            instrumentToken,
            interval as any,
            from as string,
            to as string
        );
        res.json(data);
    } catch (error: any) {
        console.error('Kite Historical Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. Fetch Quote
app.get('/api/kite/quote', async (req, res) => {
    const { tickers } = req.query; // Comma separated list like "INFY,SBIN"
    const accessToken = (req.session as any).kiteAccessToken;

    if (!accessToken) {
        return res.status(401).json({ error: 'Not authenticated with Kite' });
    }

    try {
        const kite = getKite(accessToken);
        const tickersArray = (tickers as string).split(',');
        const instruments = tickersArray.map(t => `NSE:${t.replace('.NS', '')}`);
        const data = await kite.getQuote(instruments);
        res.json(data);
    } catch (error: any) {
        console.error('Kite Quote Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 7. Search Instruments (Helper for mapping tickers to tokens)
app.get('/api/kite/instruments', async (req, res) => {
    const accessToken = (req.session as any).kiteAccessToken;
    if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const kite = getKite(accessToken);
        const data = await kite.getInstruments();
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- GENERIC MARKET DATA PROXIES (For when Kite is not connected or lacks specific data) ---

// 8. Yahoo Finance Fundamentals Proxy
app.get('/api/market/fundamentals', async (req, res) => {
    const { ticker } = req.query;
    if (!ticker) return res.status(400).json({ error: 'Ticker required' });

    const modules = "financialData,defaultKeyStatistics,assetProfile,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,summaryDetail";
    const url = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${encodeURIComponent(ticker as string)}?modules=${modules}`;

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        res.json(response.data);
    } catch (error: any) {
        console.error('Yahoo Fundamentals Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch fundamentals' });
    }
});

// 9. Yahoo Finance Historical Proxy
app.get('/api/market/historical', async (req, res) => {
    const { ticker, range, interval } = req.query;
    if (!ticker) return res.status(400).json({ error: 'Ticker required' });

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker as string)}?range=${range || '2y'}&interval=${interval || '1d'}`;

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        res.json(response.data);
    } catch (error: any) {
        console.error('Yahoo Historical Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch historical data' });
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

    app.get('*', (req, res) => {
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
