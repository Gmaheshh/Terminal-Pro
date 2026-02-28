import type { Candle } from './marketDataService';

const ema = (values: number[], period: number) => {
  const k = 2 / (period + 1);
  let prev = values[0] ?? 0;
  return values.map((value, index) => {
    if (index === 0) return value;
    prev = value * k + prev * (1 - k);
    return prev;
  });
};

const rsi = (values: number[], period = 14) => {
  const gains: number[] = [0];
  const losses: number[] = [0];
  for (let i = 1; i < values.length; i += 1) {
    const delta = values[i] - values[i - 1];
    gains.push(Math.max(0, delta));
    losses.push(Math.max(0, -delta));
  }
  const avgGain = ema(gains, period);
  const avgLoss = ema(losses, period);
  return avgGain.map((g, i) => {
    const l = avgLoss[i] || 1;
    const rs = g / l;
    return 100 - 100 / (1 + rs);
  });
};

const atr = (candles: Candle[], period = 14) => {
  const trs: number[] = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
  });
  return ema(trs, period);
};

const obv = (candles: Candle[]) => {
  let current = 0;
  return candles.map((c, i) => {
    if (i === 0) return current;
    const prev = candles[i - 1];
    if (c.close > prev.close) current += c.volume;
    else if (c.close < prev.close) current -= c.volume;
    return current;
  });
};

const vwap = (candles: Candle[]) => {
  let cumulativePv = 0;
  let cumulativeVol = 0;
  return candles.map((c) => {
    const typical = (c.high + c.low + c.close) / 3;
    cumulativePv += typical * c.volume;
    cumulativeVol += c.volume;
    return cumulativeVol ? cumulativePv / cumulativeVol : c.close;
  });
};

export const buildSignal = (ticker: string, candles: Candle[]) => {
  const closes = candles.map((c) => c.close);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macd = ema12.map((value, i) => value - ema26[i]);
  const macdSignal = ema(macd, 9);
  const rsi14 = rsi(closes, 14);
  const atr14 = atr(candles, 14);
  const obvValues = obv(candles);
  const vwapValues = vwap(candles);

  const last = closes.length - 1;
  const bullish = ema20[last] > ema50[last] && macd[last] > macdSignal[last] && rsi14[last] > 45 && closes[last] > vwapValues[last];
  const action = bullish ? 'BUY_NEXT_OPEN' : 'WATCH';
  const stopLoss = closes[last] - atr14[last] * 1.8;
  const target = closes[last] + atr14[last] * 2.5;

  return {
    ticker,
    date: candles[last].date,
    close: closes[last],
    action,
    indicators: {
      ema20: ema20[last],
      ema50: ema50[last],
      rsi14: rsi14[last],
      macd: macd[last],
      macdSignal: macdSignal[last],
      obv: obvValues[last],
      vwap: vwapValues[last],
      atr14: atr14[last]
    },
    executionPlan: {
      when: 'NEXT_OPEN',
      stopLoss,
      target,
      riskReward: Number(((target - closes[last]) / (closes[last] - stopLoss || 1)).toFixed(2))
    }
  };
};
