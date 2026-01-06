
import { GoogleGenAI, Type } from "@google/genai";
import type { Sentiment, SearchSource, TechnicalInsight, TechnicalIndicators, Signals, PortfolioBacktestResult, CoachInsight, LogisticsAnalysis, MapLocation, DerivativeStrategy } from '../types';

const sentimentCache = new Map<string, Sentiment>();
const thesisCache = new Map<string, TechnicalInsight>();
const coachCache = new Map<string, CoachInsight>();

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
}

export async function getDerivativeStrategy(
    ticker: string, 
    price: number, 
    iv: number, 
    trend: string, 
    adx: number,
    rsi: number
): Promise<DerivativeStrategy> {
    const ai = getAiClient();
    
    const prompt = `You are a high-level derivatives strategist. 
    Analyze the following setup for ${ticker}:
    - Current Price: ${price}
    - Avg IV: ${iv}%
    - Technical Trend: ${trend}
    - ADX: ${adx}
    - RSI: ${rsi}
    
    Recommend the optimal derivative strategy (e.g., Bull Call Spread, Iron Condor, Long Straddle, etc.).
    Consider Volatility levels for choosing between Debit and Credit spreads.
    Provide a confidence score based on your internal knowledge of how this strategy performs in similar technical regimes.
    
    Return ONLY JSON with: "name", "description", "riskReward", "confidence" (number 0-100), "rationale", "legs" (array of strings).`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        riskReward: { type: Type.STRING },
                        confidence: { type: Type.NUMBER },
                        rationale: { type: Type.STRING },
                        legs: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['name', 'description', 'confidence', 'rationale', 'legs']
                }
            }
        });

        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Strategy generation error:", error);
        return {
            name: "Neutral Iron Condor",
            description: "Range-bound play on high volatility crush.",
            riskReward: "Limited Risk / Limited Reward",
            confidence: 50,
            rationale: "Defaulting to neutral due to system error.",
            legs: ["Sell 1x ATM Call", "Sell 1x ATM Put", "Buy 1x OTM Call", "Buy 1x OTM Put"]
        };
    }
}

export async function getSentiment(ticker: string): Promise<Sentiment> {
  if (sentimentCache.has(ticker)) {
    return sentimentCache.get(ticker)!;
  }

  const ai = getAiClient();

  const prompt = `Analyze the recent market sentiment and official corporate disclosures for the stock ticker "${ticker}". 
  Use Google Search to specifically find:
  1. The latest Quarterly Earnings Results (NSE/BSE Filings or PDF reports).
  2. Investor Presentations and Management Commentary/Concalls.
  3. Institutional analyst ratings and target price changes.
  
  Provide a concise, 2-sentence executive summary that prioritizes official data over social noise.
  Classify the sentiment as 'Bullish', 'Bearish', or 'Neutral'.
  Respond with ONLY a JSON object with two keys: "sentiment" (string) and "summary" (string).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let jsonString = response.text || '{}';
    
    const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || jsonString.match(/```\s*([\s\S]*?)\s*```/);
    if (match) {
        jsonString = match[1];
    }

    const startIndex = jsonString.indexOf('{');
    const endIndex = jsonString.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
        jsonString = jsonString.substring(startIndex, endIndex + 1);
    }

    let parsedJson;
    try {
        parsedJson = JSON.parse(jsonString);
    } catch (e) {
        parsedJson = { sentiment: 'Neutral', summary: 'Analysis available via news feed.' };
    }

    const validSentiments = ['Bullish', 'Bearish', 'Neutral'];
    const sentimentVal = validSentiments.includes(parsedJson.sentiment) ? parsedJson.sentiment : 'Neutral';

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: SearchSource[] = groundingChunks
        ?.map((chunk: any) => (chunk.web ? {
            uri: chunk.web.uri,
            title: chunk.web.title,
        } : null))
        .filter((source: any): source is SearchSource => source !== null && !!source.uri && !!source.title) ?? [];

    const result: Sentiment = {
        sentiment: sentimentVal,
        summary: parsedJson.summary || "Analysis available.",
        sources: sources,
    };
    
    sentimentCache.set(ticker, result);
    return result;
  } catch (error) {
    console.error(`Error fetching sentiment for ${ticker}:`, error);
    return {
      sentiment: 'Error',
      summary: 'Failed to retrieve sentiment data.'
    };
  }
}

export async function getTechnicalInsight(ticker: string, indicators: TechnicalIndicators, signals: Signals): Promise<TechnicalInsight> {
    if (thesisCache.has(ticker)) {
        return thesisCache.get(ticker)!;
    }

    const ai = getAiClient();

    const lastIdx = indicators.rsi.length - 1;
    const context = {
        rsi: indicators.rsi[lastIdx]?.toFixed(2),
        adx: indicators.adx[lastIdx]?.toFixed(2),
        macdDiff: (indicators.macdLine[lastIdx] - indicators.macdSignal[lastIdx])?.toFixed(4),
        rvol: indicators.rvol[lastIdx]?.toFixed(2),
        sma200Relation: indicators.sma200[lastIdx] ? (indicators.sma20[lastIdx] > indicators.sma200[lastIdx] ? 'Above' : 'Below') : 'N/A',
        signals: {
            volume: signals.volumeSignal,
            trend: signals.trendSignal,
            vwlm: signals.vwlmBuySignal ? 'BUY' : signals.vwlmSellSignal ? 'SELL' : 'NEUTRAL'
        }
    };

    const prompt = `You are a senior quantitative trader. Analyze the following technical indicators for ${ticker}.
    Context: ${JSON.stringify(context)}
    Task: 
    1. Synthesize a "Trading Thesis" explaining the technical setup (2 sentences max).
    2. Determine the outlook (Bullish/Bearish/Neutral).
    3. List 3 key factors.
    4. Assign a confidence score (0-100).
    Return JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        thesis: { type: Type.STRING },
                        outlook: { type: Type.STRING },
                        keyFactors: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING } 
                        },
                        confidenceScore: { type: Type.NUMBER }
                    }
                }
            }
        });

        const data = JSON.parse(response.text || '{}');
        
        const result: TechnicalInsight = {
            thesis: data.thesis || "Data insufficient for thesis generation.",
            outlook: ['Bullish', 'Bearish', 'Neutral'].includes(data.outlook) ? data.outlook : 'Neutral',
            keyFactors: data.keyFactors || [],
            confidenceScore: data.confidenceScore || 50
        };

        thesisCache.set(ticker, result);
        return result;

    } catch (error) {
        return {
            thesis: "AI Module temporarily unavailable.",
            outlook: "Neutral",
            keyFactors: ["System Error"],
            confidenceScore: 0
        };
    }
}

export async function generateCoachingInsight(result: PortfolioBacktestResult): Promise<CoachInsight> {
    const cacheKey = `${result.strategy}-${result.period}`;
    if (coachCache.has(cacheKey)) {
        return coachCache.get(cacheKey)!;
    }

    const ai = getAiClient();
    const prompt = `Analyze the following trading backtest result and provide psychological coaching feedback.
    Result Summary: ${JSON.stringify({
        strategy: result.strategy,
        winRate: result.winRate,
        totalReturn: result.totalReturn,
        maxDrawdown: result.maxDrawdown,
        totalTrades: result.totalTrades,
        cagr: result.cagr
    })}
    Determine the trader archetype, mental scores, and detected biases. Return as JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        traderArchetype: { type: Type.STRING },
                        mentalCapitalScore: { type: Type.NUMBER },
                        psychologicalTraits: {
                            type: Type.OBJECT,
                            properties: {
                                discipline: { type: Type.NUMBER },
                                patience: { type: Type.NUMBER },
                                riskMgmt: { type: Type.NUMBER },
                                consistency: { type: Type.NUMBER }
                            },
                            required: ['discipline', 'patience', 'riskMgmt', 'consistency']
                        },
                        detectedBiases: { type: Type.ARRAY, items: { type: Type.STRING } },
                        actionableFeedback: { type: Type.STRING }
                    },
                    required: ['traderArchetype', 'mentalCapitalScore', 'psychologicalTraits', 'detectedBiases', 'actionableFeedback']
                }
            }
        });

        const data = JSON.parse(response.text || '{}');
        coachCache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error("Coach analysis error:", error);
        return {
            traderArchetype: "Standard Executioner",
            mentalCapitalScore: 50,
            psychologicalTraits: { discipline: 50, patience: 50, riskMgmt: 50, consistency: 50 },
            detectedBiases: ["Analysis Unavailable"],
            actionableFeedback: "Keep refining your execution strategy."
        };
    }
}

export async function fetchLogisticsAnalysis(query: string): Promise<LogisticsAnalysis> {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite-latest",
            contents: `Analyze logistics for: ${query}. Identify current bottlenecks and strategic hotspots.`,
            config: {
                tools: [{ googleMaps: {} }, { googleSearch: {} }],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const locations: MapLocation[] = groundingChunks
            ?.map((chunk: any) => (chunk.maps ? {
                uri: chunk.maps.uri,
                title: chunk.maps.title,
            } : null))
            .filter((loc: any): loc is MapLocation => loc !== null && !!loc.uri && !!loc.title) ?? [];

        return {
            analysisText: response.text || "No analysis available.",
            outlook: response.text?.toLowerCase().includes('bullish') ? 'Bullish' : 
                     response.text?.toLowerCase().includes('bearish') ? 'Bearish' : 'Neutral',
            detectedLocations: locations,
        };
    } catch (error) {
        console.error("Logistics analysis error:", error);
        return {
            analysisText: "Logistics data feed interrupted.",
            outlook: "Neutral",
            detectedLocations: []
        };
    }
}
