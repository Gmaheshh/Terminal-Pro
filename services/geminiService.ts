
import { GoogleGenAI, Type } from "@google/genai";
import type { 
    Sentiment, 
    TechnicalInsight, 
    TechnicalIndicators, 
    DerivativeStrategy, 
    OptionChain, 
    PortfolioBacktestResult, 
    CoachInsight, 
    LogisticsAnalysis,
    FundamentalFilters
} from '../types';

const sentimentCache = new Map<string, Sentiment>();
const thesisCache = new Map<string, TechnicalInsight>();
const strategyCache = new Map<string, DerivativeStrategy>();

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
}

export async function suggestFundamentalFilters(marketRegime: string): Promise<FundamentalFilters> {
    const ai = getAiClient();
    const prompt = `Based on the current Indian stock market regime: ${marketRegime}, suggest ideal fundamental screening thresholds for a high-quality value/growth portfolio. 
    Provide values for PE Ratio, Price-to-Book, minimum ROE (%), maximum Debt-to-Equity, and minimum Dividend Yield (%).
    
    RETURN STRICT JSON:
    {
      "maxPE": number,
      "maxPB": number,
      "minROE": number,
      "maxDebtEquity": number,
      "minDivYield": number
    }`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("AI filter suggestion failed", e);
        return { maxPE: 25, maxPB: 4, minROE: 15, maxDebtEquity: 100, minDivYield: 1 };
    }
}

export async function getDerivativeStrategy(
    ticker: string, 
    price: number, 
    trend: string, 
    adx: number,
    rsi: number,
    optionChain: OptionChain
): Promise<DerivativeStrategy> {
    const cacheKey = `${ticker}-${price.toFixed(0)}-${trend}`;
    if (strategyCache.has(cacheKey)) {
        return strategyCache.get(cacheKey)!;
    }

    const ai = getAiClient();
    const atmCalls = optionChain.calls.slice(5, 15);
    const atmPuts = optionChain.puts.slice(5, 15);
    const avgIV = atmCalls.reduce((acc, c) => acc + c.iv, 0) / atmCalls.length;
    
    // Mapping internal tickers to human names to avoid LLM confusion
    const friendlyName = ticker === '^NSEI' ? 'NIFTY 50' : ticker === '^NSEBANK' ? 'BANK NIFTY' : ticker;
    const validStrikes = optionChain.calls.map(c => c.strike).sort((a,b) => a-b);

    const prompt = `You are an institutional derivatives desk manager. 
    IMPORTANT: You are analyzing ${friendlyName} (${ticker}). Current Spot is ${price.toFixed(2)}.
    DO NOT generate a strategy for Bank Nifty if the ticker is Nifty 50, and vice versa.
    
    CONTEXT:
    Underlying: ${friendlyName}
    Spot Price: ${price.toFixed(2)}
    Trend: ${trend}
    ADX: ${adx.toFixed(2)}
    RSI: ${rsi.toFixed(2)}
    Avg IV: ${avgIV.toFixed(1)}%
    Expiry: ${optionChain.expiryDate}

    MANDATORY STRIKE SELECTION: 
    You MUST pick strikes ONLY from this list: [${validStrikes.join(', ')}].
    Pick 2 legs for a spread (Bull Call, Bear Put, Credit Spread, etc.).

    RETURN STRICT JSON:
    {
      "name": "Strategy Name (e.g. ${friendlyName} Bull Call Spread)", 
      "bias": "Market Bias", 
      "volatilityRegime": "IV Status", 
      "rationale": "Short explanation based on technicals provided", 
      "holdingPeriod": "Duration",
      "tradeStructure": [
        {"leg": "1", "action": "BUY/SELL", "strike": number, "type": "CE/PE", "premium": number},
        {"leg": "2", "action": "BUY/SELL", "strike": number, "type": "CE/PE", "premium": number}
      ],
      "maxProfit": "Value (e.g. ₹4500)", 
      "maxLoss": "Value (e.g. ₹2100)", 
      "breakevens": ["Strike Price"], 
      "rrRatio": "1:X", 
      "greeks": {"delta": "value", "theta": "value", "vega": "value"},
      "confidence": {"score": number, "strengths": ["Reason1", "Reason2"], "keyRisk": "Main Risk"}, 
      "backtest": {"winRate": "XX%", "avgReturn": "XX%", "notes": "Insight"},
      "warnings": "Strict caution based on IV/Trend", 
      "payoffPoints": [{"price": number, "pnl": number}]
    }

    Notes: 
    - Premia should be realistic relative to the Spot and distance from strike.
    - Payoff points must cover a range of prices around the current spot.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { 
              responseMimeType: "application/json",
              systemInstruction: `You are a strict financial quant. Never mix Nifty 50 and Bank Nifty strikes. Use the exact Spot and valid strikes provided in the context.`
            }
        });
        
        const strategy = JSON.parse(response.text || '{}');
        strategy.ticker = ticker;
        strategy.executionPrice = price;
        strategy.timestamp = new Date().toLocaleTimeString();
        
        strategyCache.set(cacheKey, strategy);
        return strategy;
    } catch (error) {
        console.error("Strategy generation error:", error);
        throw error;
    }
}

export async function getSentiment(ticker: string): Promise<Sentiment> {
  if (sentimentCache.has(ticker)) return sentimentCache.get(ticker)!;
  const ai = getAiClient();
  const prompt = `Analyze sentiment for ${ticker} using Google Search. Return JSON: {"sentiment": "Bullish/Bearish/Neutral", "summary": "2 sentences"}`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    const result = JSON.parse(response.text || '{"sentiment": "Neutral", "summary": "Data unavailable."}');
    sentimentCache.set(ticker, result);
    return result;
  } catch {
    return { sentiment: 'Neutral', summary: 'Analysis error.' };
  }
}

export async function getTechnicalInsight(ticker: string, indicators: TechnicalIndicators, signals: any): Promise<TechnicalInsight> {
    if (thesisCache.has(ticker)) return thesisCache.get(ticker)!;
    const ai = getAiClient();
    const prompt = `Analyze technicals for ${ticker}. RSI: ${indicators.rsi.slice(-1)}, ADX: ${indicators.adx.slice(-1)}. Return JSON with thesis, outlook, keyFactors, confidenceScore.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const result = JSON.parse(response.text || '{}');
        thesisCache.set(ticker, result);
        return result;
    } catch {
        return { thesis: "Analysis error.", outlook: "Neutral", keyFactors: [], confidenceScore: 0 };
    }
}

export async function generateCoachingInsight(result: PortfolioBacktestResult): Promise<CoachInsight> {
    const ai = getAiClient();
    const prompt = `Analyze this simulated trading performance and provide psychological coaching feedback. 
    Strategy: ${result.strategy}, Period: ${result.period}, Total Return: ${result.totalReturn.toFixed(2)}%, Win Rate: ${result.winRate.toFixed(1)}%, Trades: ${result.totalTrades}.
    Provide insights into the trader's behavioral profile.
    RETURN STRICT JSON: {
        "traderArchetype": "string",
        "mentalCapitalScore": number,
        "psychologicalTraits": {"discipline": number, "patience": number, "riskMgmt": number, "consistency": number},
        "detectedBiases": ["string"],
        "actionableFeedback": "string"
    }`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    } catch {
        return {
            traderArchetype: "Unknown",
            mentalCapitalScore: 50,
            psychologicalTraits: { discipline: 50, patience: 50, riskMgmt: 50, consistency: 50 },
            detectedBiases: [],
            actionableFeedback: "Analysis unavailable at this time."
        };
    }
}

export async function fetchLogisticsAnalysis(query: string): Promise<LogisticsAnalysis> {
    const ai = getAiClient();
    const prompt = `Perform a deep logistics and supply chain analysis for the commodity/region: ${query}. 
    Focus on tanker movements, port bottlenecks, and global chokepoints. 
    Use Google Maps to verify specific locations mentioned. 
    Provide a detailed summary and a bullish/bearish/neutral outlook.
    Format your response as valid JSON embedded in text if necessary, but strictly provide the analysisText and outlook.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }, { googleSearch: {} }],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const detectedLocations = groundingChunks
            .map((chunk: any) => chunk.maps ? { title: chunk.maps.title, uri: chunk.maps.uri } : null)
            .filter((loc: any) => loc !== null);

        let analysisText = response.text || "No analysis available.";
        let outlook: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';

        if (analysisText.toLowerCase().includes('bullish')) outlook = 'Bullish';
        else if (analysisText.toLowerCase().includes('bearish')) outlook = 'Bearish';

        return {
            analysisText,
            outlook,
            detectedLocations
        };
    } catch (error) {
        console.error("Logistics analysis failed:", error);
        return { analysisText: "Satellite uplink failed.", outlook: "Neutral", detectedLocations: [] };
    }
}
