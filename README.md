# PRA-GATI Terminal

Production-ready full-stack terminal for market intelligence, investing analysis, and signal-driven trading execution.

## Stack
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express (single server hosts API + Vite middleware in dev)
- Data: Yahoo Finance proxy endpoints (OHLCV, quotes, news) with in-memory caching
- Auth: JWT (HMAC SHA-256) using env-configured dev credentials

## Features
- **Intelligence Hub**: Recent news + macro matrix watchlist
- **Investing Tree**: Company analysis with 1Y price history and key-stat placeholders
- **Trading Desk**: Protected signal scanner (EMA/RSI/MACD/OBV/VWAP/ATR), signals table, execute-next-open plan, CSV export
- REST endpoints:
  - `GET /api/health`
  - `GET /api/market/history?ticker=RELIANCE.NS&interval=1d&period=1y`
  - `GET /api/signals/run?ticker=RELIANCE.NS` (JWT protected)
  - `GET /api/signals/universe` (JWT protected)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure env:
   ```bash
   cp .env.example .env
   ```
3. Run in dev (client + server together):
   ```bash
   npm run dev
   ```
4. Open:
   - App: `http://localhost:8080`
   - Health: `http://localhost:8080/api/health`

## Scripts
- `npm run dev` – Express API + Vite middleware (single command)
- `npm run build` – Frontend production build
- `npm run start` – Start production server
- `npm run lint` – TypeScript type-check
- `npm test` – API smoke tests

## Auth
- Login endpoint: `POST /api/auth/login`
- Body:
  ```json
  {"username":"admin","password":"admin123"}
  ```
- Use returned token as:
  `Authorization: Bearer <token>`

## Deployment Notes
- Works well on Cloud Run / Railway / Render as a single web service.
- Set env vars:
  - `PORT` (platform-provided on many hosts)
  - `JWT_SECRET`
  - `ADMIN_USER`
  - `ADMIN_PASS`
- Build + run:
  - `npm run build`
  - `npm run start`
