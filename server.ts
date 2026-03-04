// server.ts (replace your server file with this)
// Notes:
// - Fixes session cookie issues behind preview/proxy (SameSite=None + Secure=true + proxy:true)
// - Fixes CORS for credentials (no '*' when credentials=true)
// - Redirects back to FRONTEND_URL after Kite callback
// - Status checks session token (not zerodhaService internal state)

import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import axios from "axios";

// Load env early
dotenv.config({ path: ".env.local" });

import zerodhaService from "./services/zerodhaService";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Trust proxy (important for secure cookies behind HTTPS proxies)
app.set("trust proxy", 1);

// --------------------
// Helpers
// --------------------
const FRONTEND_URL = (process.env.FRONTEND_URL || "").trim();

// Comma-separated allowlist. Example:
// CORS_ORIGINS=https://pragatiinvest.com,https://www.pragatiinvest.com,https://xxxx.preview.emergentagent.com
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// In hosted environments (preview/prod) you almost always want secure cookies.
// For local HTTP dev, set COOKIE_SECURE=false in .env.local
const COOKIE_SECURE =
  (process.env.COOKIE_SECURE || "").toLowerCase() === "true"
    ? true
    : (process.env.COOKIE_SECURE || "").toLowerCase() === "false"
      ? false
      : true; // default to true (safe for hosted HTTPS)

// --------------------
// Middleware
// --------------------
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// CORS: cannot use '*' with credentials:true
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients
      if (!origin) return cb(null, true);

      // If no allowlist provided, allow all (NOT recommended for production)
      if (ALLOWED_ORIGINS.length === 0) return cb(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Session: make it work behind proxies + cross-site redirect flows
app.use(
  session({
    name: "pragati.sid",
    secret: process.env.SESSION_SECRET || "pragati-secret-key",
    resave: false,
    saveUninitialized: false, // important: don't set cookies for empty sessions
    proxy: true, // important behind reverse proxies
    cookie: {
      secure: COOKIE_SECURE, // MUST be true for SameSite=None in modern browsers
      sameSite: "none",
      httpOnly: true,
      // You can optionally set maxAge
      // maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// --------------------
// Health
// --------------------
app.get("/api/health", (_req, res) => res.status(200).send("PRA-GATI running"));
app.get("/healthz", (_req, res) => res.status(200).send("OK"));

// --------------------
// Zerodha Kite Connect
// --------------------
app.get("/api/zerodha/login", (_req, res) => {
  const loginUrl = zerodhaService.getLoginUrl();
  res.json({ loginUrl });
});

app.get("/api/zerodha/callback", async (req, res) => {
  const requestToken = String(req.query.request_token || "");

  if (!requestToken) {
    return res.status(400).json({ error: "Missing request_token" });
  }

  try {
    const sessionData = await zerodhaService.generateSession(requestToken);

    // Store in session (so browser cookie keeps it)
    (req.session as any).kiteAccessToken = sessionData.access_token;
    (req.session as any).kiteUserId = sessionData.user_id;

    // Persist session before redirect
    req.session.save(() => {
      const target = FRONTEND_URL
        ? `${FRONTEND_URL}/?kite_auth=success`
        : `/?kite_auth=success`;
      res.redirect(target);
    });
  } catch (error: any) {
    console.error("Zerodha auth error:", error?.message || error);
    const target = FRONTEND_URL
      ? `${FRONTEND_URL}/?kite_auth=error`
      : `/?kite_auth=error`;
    res.redirect(target);
  }
});

app.get("/api/zerodha/status", (req, res) => {
  const kiteAccessToken = (req.session as any)?.kiteAccessToken || null;
  const kiteUserId = (req.session as any)?.kiteUserId || null;

  res.json({
    authenticated: Boolean(kiteAccessToken),
    userId: kiteUserId,
  });
});

// --------------------
// Generic Market Data Proxies
// --------------------
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
];

async function fetchWithRetry(url: string, retries = 3, delay = 2000) {
  let d = delay;
  for (let i = 0; i < retries; i++) {
    try {
      const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
      const response = await axios.get(url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
        },
        timeout: 15000,
      });
      return response;
    } catch (error: any) {
      if (error?.response?.status === 429 && i < retries - 1) {
        console.warn(`Rate limited (429) for ${url}. Retrying in ${d}ms...`);
        await new Promise((r) => setTimeout(r, d));
        d *= 2;
      } else if (i < retries - 1) {
        console.warn(`Request failed for ${url}. Retrying in ${Math.floor(d / 2)}ms...`);
        await new Promise((r) => setTimeout(r, Math.floor(d / 2)));
      } else {
        throw error;
      }
    }
  }
}

// Yahoo Finance Fundamentals Proxy
app.get("/api/market/fundamentals", async (req, res) => {
  const ticker = String(req.query.ticker || "");
  if (!ticker) return res.status(400).json({ error: "Ticker required" });

  const modules =
    "financialData,defaultKeyStatistics,assetProfile,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,summaryDetail";
  const url = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${encodeURIComponent(
    ticker
  )}?modules=${modules}`;

  try {
    const response = await fetchWithRetry(url);
    res.json(response.data);
  } catch (error: any) {
    console.error("Yahoo Fundamentals Error:", error?.message || error);
    res
      .status(error?.response?.status || 500)
      .json({ error: "Failed to fetch fundamentals" });
  }
});

// Yahoo Finance Historical Proxy
app.get("/api/market/historical", async (req, res) => {
  const ticker = String(req.query.ticker || "");
  const range = String(req.query.range || "2y");
  const interval = String(req.query.interval || "1d");

  if (!ticker) return res.status(400).json({ error: "Ticker required" });

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

  try {
    const response = await fetchWithRetry(url);
    res.json(response.data);
  } catch (error: any) {
    console.error("Yahoo Historical Error:", error?.message || error);
    res
      .status(error?.response?.status || 500)
      .json({ error: "Failed to fetch historical data" });
  }
});

// NSE Option Chain Proxy
app.get("/api/market/option-chain", async (req, res) => {
  const symbol = String(req.query.symbol || "");
  const isIndex = String(req.query.isIndex || "false") === "true";

  if (!symbol) return res.status(400).json({ error: "Symbol required" });

  const baseUrl = isIndex
    ? `https://www.nseindia.com/api/option-chain-indices?symbol=${encodeURIComponent(symbol)}`
    : `https://www.nseindia.com/api/option-chain-equities?symbol=${encodeURIComponent(symbol)}`;

  try {
    const response = await axios.get(baseUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.nseindia.com/option-chain",
      },
      timeout: 10000,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error("NSE Option Chain Error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch option chain from NSE" });
  }
});

// --------------------
// Static / Vite
// --------------------
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));

  // optional root health response for some platforms
  app.get("/", (req, res, next) => {
    const ua = String(req.headers["user-agent"] || "");
    if (ua.includes("GooglePagespeed") || ua.includes("Google-Cloud-Run")) {
      return res.send("PRA-GATI running");
    }
    next();
  });

  // SPA catch-all (Express 5 compatible)
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Dev: Vite middleware
  import("vite")
    .then(({ createServer: createViteServer }) =>
      createViteServer({
        server: {
          middlewareMode: true,
          // Helps with preview domains / host header checks in dev
          host: true,
          allowedHosts: "all",
        },
        appType: "spa",
      })
    )
    .then((vite) => {
      app.use(vite.middlewares);
      console.log("Vite dev middleware loaded");
    })
    .catch((err) => {
      console.error("Failed to load Vite:", err);
    });
}

// --------------------
// Start
// --------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV})`);
});
