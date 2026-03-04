<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PRA-GATI - Institutional Stock Trading Terminal

**PRA-GATI** is a professional-grade, AI-powered stock trading and analysis platform for the Indian market (NSE). Built with React, TypeScript, Express, and Google Gemini AI, it provides institutional-level insights, technical analysis, derivatives strategies, and real-time market intelligence.

## 🚀 Features

- **Real-time Stock Analysis** - Track 180+ F&O stocks with live data from Yahoo Finance
- **AI-Powered Intelligence** - Gemini 2.5 Pro/Flash integration for market sentiment, news analysis, and strategy recommendations
- **Technical Indicators** - ADX, RSI, MACD, Bollinger Bands, EMA/SMA, Volume analysis, and more
- **Derivatives Desk** - Option chain analysis, Greeks calculation, arbitrage detection
- **Portfolio Backtesting** - Test strategies with historical data and performance metrics
- **Market Regime Detection** - Automatic identification of market conditions (Trending, Risk-Off, Range-Bound, etc.)
- **VWLM Strategy** - Proprietary Conviction-Weighted Momentum algorithm
- **Smart Breakout Protocol** - Volume spikes, squeeze releases, OI build-up detection
- **Interactive Charts** - Lightweight-charts integration for advanced visualization
- **AI Chat Assistant** - Built-in Gemini-powered quantitative analyst chatbot

## 🛠️ Tech Stack

### Frontend
- **React 19.2.0** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling (via CDN)
- **Lightweight Charts** - Professional charting library

### Backend
- **Express 5.2.1** - Fast, unopinionated web framework
- **TypeScript** - Full-stack type safety
- **Google Gemini AI** - Advanced language model (2.5 Pro & Flash)
- **Axios** - HTTP client for Yahoo Finance API
- **tsx** - TypeScript execution environment

### Infrastructure
- **Node.js** - JavaScript runtime
- **Supervisor** - Process management
- **dotenv** - Environment variable management

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Yarn** (recommended) or npm
- **Gemini API Key** - Get it from [Google AI Studio](https://ai.google.dev/)

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
cd /app
yarn install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Gemini API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=8080
NODE_ENV=development

# Application URL (optional)
APP_URL=
```

### 3. Start the Application

#### Development Mode (with hot reload)
```bash
yarn dev
```

#### Production Mode
```bash
yarn build
yarn start
```

The application will be available at:
- **Frontend**: `http://localhost:8080/`
- **API Health**: `http://localhost:8080/api/health`

## 🔄 Service Management

The application runs as a supervised service:

```bash
# Check status
sudo supervisorctl status pragati-server

# Start service
sudo supervisorctl start pragati-server

# Restart service
sudo supervisorctl restart pragati-server

# Stop service
sudo supervisorctl stop pragati-server

# View logs
tail -f /var/log/supervisor/pragati-server.out.log
tail -f /var/log/supervisor/pragati-server.err.log
```

## 📡 API Endpoints

### Health Checks
- `GET /api/health` - Application health check
- `GET /healthz` - Kubernetes-style health check

### Market Data Proxies
- `GET /api/market/fundamentals?ticker=RELIANCE.NS` - Fetch fundamental data
- `GET /api/market/historical?ticker=TCS.NS&range=2y&interval=1d` - Historical price data
- `GET /api/market/option-chain?symbol=NIFTY&isIndex=true` - NSE option chain data

## 🎯 Application Structure

```
/app/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── ChatBot.tsx
│   ├── LoginSignup.tsx
│   ├── HomeHub.tsx
│   └── ... (30+ components)
├── services/           # Business logic & API integrations
│   ├── geminiService.ts
│   ├── stockDataService.ts
│   ├── newsService.ts
│   ├── technicalAnalysisService.ts
│   ├── backtestingService.ts
│   └── ...
├── App.tsx            # Main application component
├── index.tsx          # React entry point
├── server.ts          # Express backend server
├── types.ts           # TypeScript type definitions
├── constants.ts       # Configuration & constants
├── index.html         # HTML template
├── index.css          # Global styles
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript configuration
├── package.json       # Dependencies
└── .env.local         # Environment variables

/etc/supervisor/conf.d/
└── pragati.conf       # Supervisor configuration
```

## 🐛 Bug Fixes Applied

This version includes the following critical bug fixes:

1. ✅ **Removed invalid file** - Cleaned up corrupted "}" file
2. ✅ **Created missing .env.local** - Added proper environment configuration
3. ✅ **Created missing index.css** - Added global styles
4. ✅ **Fixed Gemini model names** - Updated from deprecated models to Gemini 2.5 Pro/Flash
5. ✅ **Installed all dependencies** - Complete node_modules setup
6. ✅ **Configured supervisor** - Auto-start on system boot
7. ✅ **Fixed TypeScript compilation** - Zero compilation errors
8. ✅ **Environment variable loading** - Proper dotenv configuration

## 🔐 Security Notes

- **Session Secret**: Consider changing the hardcoded session secret in `server.ts` for production
- **API Keys**: Never commit `.env.local` to version control
- **CORS**: Configure CORS properly for production deployments
- **HTTPS**: Use HTTPS in production environments

## 🧪 Testing

### Backend Health Check
```bash
curl http://localhost:8080/api/health
# Expected: "PRA-GATI running"
```

### Frontend Access
Navigate to `http://localhost:8080/` in your browser

### TypeScript Validation
```bash
yarn lint
```

## 📝 Available Scripts

```json
{
  "dev": "tsx server.ts",           // Start development server
  "build": "vite build",            // Build for production
  "preview": "vite preview",        // Preview production build
  "lint": "tsc --noEmit",          // TypeScript type checking
  "start": "NODE_ENV=production node server.ts"  // Production mode
}
```

## 🌟 Key Technologies

### AI Integration
- **Google Gemini 2.5 Pro** - Complex analysis, derivatives strategies
- **Google Gemini 2.5 Flash** - Fast sentiment analysis, news processing
- **Google Search Grounding** - Real-time market news and macro sentiment

### Market Data
- **Yahoo Finance API** - Historical prices, fundamentals, financials
- **NSE India API** - Option chains, futures data (with fallback mocks)

### Frontend Features
- **Responsive Design** - Mobile-first approach
- **Dark/Light Theme** - Professional color scheme
- **Real-time Updates** - Live ticker tape, alert feed
- **Interactive Tables** - Sortable, filterable data grids
- **Chart Overlays** - Hover-to-view mini charts

## 📊 Dashboard Categories

1. **Home Hub** - Quick overview and navigation
2. **Intelligence Hub** - News, macro analysis, sentiment
3. **Investing Tree** - Company fundamentals, portfolio maker
4. **Trading Tree** - Volume/Trend, VWLM, derivatives, OI analytics, position calculator
5. **User Manual** - FAQ and feature documentation

## 🔍 Troubleshooting

### Server won't start
```bash
# Check logs
tail -100 /var/log/supervisor/pragati-server.err.log

# Verify port availability
netstat -tulpn | grep 8080

# Restart supervisor
sudo supervisorctl restart pragati-server
```

### API Key not working
```bash
# Verify .env.local exists and has correct key
cat /app/.env.local | grep GEMINI_API_KEY

# Test API key loading
node -e "require('dotenv').config({path: '.env.local'}); console.log('Key:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET')"
```

### TypeScript errors
```bash
# Run type checking
yarn lint

# Clean and reinstall
rm -rf node_modules yarn.lock
yarn install
```

## 📚 Additional Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Yahoo Finance API](https://finance.yahoo.com/)
- [NSE India](https://www.nseindia.com/)
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- [React Documentation](https://react.dev/)

## 📄 License

This project is private and proprietary.

## 🤝 Support

For issues or questions, please refer to the User Manual tab within the application or contact the development team.

---

**Built with ❤️ for institutional traders and quantitative analysts**
