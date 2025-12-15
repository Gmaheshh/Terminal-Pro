import { GoogleGenAI, Type } from "@google/genai";
import type { Sentiment, SearchSource, TechnicalInsight, TechnicalIndicators, Signals, PortfolioBacktestResult, CoachInsight } from '../types';

// In-memory cache to avoid repeated API calls for the same ticker during a session
const sentimentCache = new Map<string, Sentiment>();
const thesisCache = new Map<string, TechnicalInsight>();
const coachingCache = new Map<string, CoachInsight>();

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
}

export async function getSentiment(ticker: string): Promise<Sentiment> {
  if (sentimentCache.has(ticker)) {
    return sentimentCache.get(ticker)!;
  }

  const ai = getAiClient();

  const prompt = `Analyze the recent market sentiment for the stock ticker "${ticker}". Use Google Search to find the latest news, social media discussions, and financial analyst ratings.
Provide a concise, one-sentence summary.
Classify the sentiment as 'Bullish', 'Bearish', or 'Neutral'.
Respond with ONLY a JSON object with two keys: "sentiment" (string) and "summary" (string).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType cannot be used with googleSearch tool
      },
    });

    let jsonString = response.text || '{}';
    
    // Extract JSON from markdown code blocks if present
    const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || jsonString.match(/```\s*([\s\S]*?)\s*```/);
    if (match) {
        jsonString = match[1];
    }

    // Clean up potential non-JSON characters around the object
    const startIndex = jsonString.indexOf('{');
    const endIndex = jsonString.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
        jsonString = jsonString.substring(startIndex, endIndex + 1);
    }

    let parsedJson;
    try {
        parsedJson = JSON.parse(jsonString);
    } catch (e) {
        console.warn("Failed to parse sentiment JSON, falling back to default.", e);
        parsedJson = { sentiment: 'Neutral', summary: 'Analysis available via news feed.' };
    }

    // Validate the sentiment value and structure
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
    const errorResult: Sentiment = {
      sentiment: 'Error',
      summary: 'Failed to retrieve sentiment data. The model may be unavailable or the ticker is not recognized.'
    };
    return errorResult;
  }
}

export async function getTechnicalInsight(ticker: string, indicators: TechnicalIndicators, signals: Signals): Promise<TechnicalInsight> {
    if (thesisCache.has(ticker)) {
        return thesisCache.get(ticker)!;
    }

    const ai = getAiClient();

    // Prepare a condensed context of the technicals
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

    const prompt = `You are a senior quantitative trader at a hedge fund. Analyze the following technical indicators for ${ticker}.
    
    Technical Context: ${JSON.stringify(context)}
    
    Task: 
    1. Synthesize a "Trading Thesis" explaining the technical setup in professional trader jargon (2 sentences max).
    2. Determine the outlook (Bullish/Bearish/Neutral).
    3. List 3 key factors driving this decision.
    4. Assign a confidence score (0-100) based on signal confluence.

    Return JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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
        console.error("Thesis generation failed", error);
        return {
            thesis: "AI Module temporarily unavailable for technical synthesis.",
            outlook: "Neutral",
            keyFactors: ["System Error"],
            confidenceScore: 0
        };
    }
}

export async function generateCoachingInsight(result: PortfolioBacktestResult): Promise<CoachInsight> {
    const cacheKey = `${result.strategy}-${result.period}`;
    if (coachingCache.has(cacheKey)) {
        return coachingCache.get(cacheKey)!;
    }

    const ai = getAiClient();

    // Prepare summarized data to avoid token limits
    const tradeSummary = result.trades.map(t => ({
        ticker: t.ticker,
        roi: t.tradeRoI.toFixed(2),
        duration: Math.ceil((new Date(t.exitDate).getTime() - new Date(t.entryDate).getTime()) / (1000 * 3600 * 24)),
        result: t.pnl > 0 ? 'WIN' : 'LOSS'
    }));

    // Randomly sample 20 trades if too many
    const sampleSize = 20;
    const sampledTrades = tradeSummary.length > sampleSize 
        ? tradeSummary.sort(() => 0.5 - Math.random()).slice(0, sampleSize) 
        : tradeSummary;

    // Calculate streaks logic (basic pre-processing)
    let maxWinStreak = 0;
    let maxLoseStreak = 0;
    let currentWinStreak = 0;
    let currentLoseStreak = 0;

    tradeSummary.forEach(t => {
        if (t.result === 'WIN') {
            currentWinStreak++;
            currentLoseStreak = 0;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else {
            currentLoseStreak++;
            currentWinStreak = 0;
            maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
        }
    });

    const context = {
        strategy: result.strategy,
        winRate: result.winRate.toFixed(2),
        maxDrawdown: result.maxDrawdown.toFixed(2),
        totalReturn: result.totalReturn.toFixed(2),
        tradeCount: result.totalTrades,
        streaks: { maxWin: maxWinStreak, maxLoss: maxLoseStreak },
        sampleTrades: sampledTrades
    };

    const prompt = `You are a Trading Psychologist and Behavioral Finance Expert. Analyze the performance of this trading algorithm as if it were a human trader.
    
    Performance Data: ${JSON.stringify(context)}

    Diagnose the "Trader Personality" based on the stats.
    - High win rate, low return? -> "The Scalper" (Risk averse)
    - Low win rate, high return? -> "The Sniper" (Patient)
    - High drawdown? -> "The Gambler" (Lack of discipline)
    
    Identify biases (e.g., Revenge Trading if streaks are bad, Prospect Theory if they hold losers too long).

    Return JSON matching this schema:
    {
        "traderArchetype": "string (e.g., The Sniper)",
        "mentalCapitalScore": number (0-100),
        "psychologicalTraits": {
            "discipline": number (0-100),
            "patience": number (0-100),
            "riskMgmt": number (0-100),
            "consistency": number (0-100)
        },
        "detectedBiases": ["string", "string"],
        "actionableFeedback": "string (Tough love advice)"
    }`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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
                            }
                        },
                        detectedBiases: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        actionableFeedback: { type: Type.STRING }
                    }
                }
            }
        });

        const data = JSON.parse(response.text || '{}');
        
        // Validation fallback
        const insight: CoachInsight = {
            traderArchetype: data.traderArchetype || "The Novice",
            mentalCapitalScore: data.mentalCapitalScore || 50,
            psychologicalTraits: {
                discipline: data.psychologicalTraits?.discipline || 50,
                patience: data.psychologicalTraits?.patience || 50,
                riskMgmt: data.psychologicalTraits?.riskMgmt || 50,
                consistency: data.psychologicalTraits?.consistency || 50
            },
            detectedBiases: data.detectedBiases || ["Analysis Inconclusive"],
            actionableFeedback: data.actionableFeedback || "Keep journaling your trades."
        };

        coachingCache.set(cacheKey, insight);
        return insight;

    } catch (error) {
        console.error("Coaching analysis failed", error);
        return {
             traderArchetype: "System Error",
            mentalCapitalScore: 0,
            psychologicalTraits: { discipline: 0, patience: 0, riskMgmt: 0, consistency: 0 },
            detectedBiases: ["Connection Failed"],
            actionableFeedback: "AI Coach is currently offline."
        };
    }
}