import { GoogleGenAI, Type } from "@google/genai";
import type { 
    DerivativeStrategy, 
    OptionChain, 
    ProcessedStock,
    ComprehensiveAnalysis,
    MacroDeepDive,
    FundamentalFilters,
    Sentiment,
    TechnicalInsight,
    PortfolioBacktestResult,
    CoachInsight,
    LogisticsAnalysis
} from '../types';

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable not set.");
    return new GoogleGenAI({ apiKey });
}

function extractJsonFromText(text: string): any {
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) return JSON.parse(markdownMatch[1]);
    const jsonStartIndex = text.indexOf('{');
    const jsonEndIndex = text.lastIndexOf('}');
    if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) return JSON.parse(text.substring(jsonStartIndex, jsonEndIndex + 1));
    return {};
}

/**
 * Core engine for Stock-to-Strategy (Arbitrage Focused)
 */
export async function getArbitrageStrategy(
    ticker: string, 
    spot: number, 
    fut: number, 
    chain: OptionChain,
    variableCostRate: number
): Promise<DerivativeStrategy | null> {
    const ai = getAiClient();
    const atmOptions = {
        calls: chain.calls.slice(chain.calls.length/2 - 3, chain.calls.length/2 + 3),
        puts: chain.puts.slice(chain.puts.length/2 - 3, chain.puts.length/2 + 3)
    };

    const prompt = `You are an elite institutional derivatives desk manager. 
    Calculate a high-confidence arbitrage or institutional spread for ${ticker}.
    DATA:
    - Spot: ${spot}
    - Futures: ${fut}
    - Expiry: ${chain.expiryDate}
    - ATM Option Sample: ${JSON.stringify(atmOptions)}
    - User Variable Cost Rate: ${variableCostRate}%

    CRITICAL RULES:
    1. If the mathematical edge (Arbitrage) yields < 75% confidence or No Edge exists, RETURN JSON with "confidence": 0.
    2. Focus on Cash-Futures spread, Box Spreads, or Put-Call Parity violations.
    3. Account for Fixed Taxes (STT @ 0.0125% for Sell Side, etc.) and the User's Variable Cost.
    4. RETURN JSON with "name", "type", "bias", "explanation" (simple terms), "tradeStructure", "maxProfit", "maxLoss", "fixedCost", "variableCost", "greeks" (Delta, Theta, Vega, Gamma), "confidence" (0-100), "payoffPoints" (at least 20 points).`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                systemInstruction: "You are a quantitative finance engine. Strictly return JSON. If confidence < 75%, set confidence to 0."
            }
        });
        const result = JSON.parse(response.text || '{}');
        if (result.confidence < 75) return null;
        
        return {
            ...result,
            ticker,
            executionPrice: spot,
            timestamp: new Date().toLocaleTimeString()
        };
    } catch (e) {
        console.error("Arbitrage engine failed", e);
        return null;
    }
}

/**
 * Engine for Strategy-to-Stock (Scanning 180+ F&O Assets)
 */
export async function scanStrategyForStocks(
    strategyType: string,
    stocks: ProcessedStock[],
    variableCostRate: number
): Promise<DerivativeStrategy[]> {
    const ai = getAiClient();
    
    // Sample top 15 stocks based on interesting technicals to save tokens but keep variety
    const candidates = stocks
        .sort((a, b) => (b.indicators.rvol[b.indicators.rvol.length-1] || 0) - (a.indicators.rvol[a.indicators.rvol.length-1] || 0))
        .slice(0, 15)
        .map(s => ({
            ticker: s.ticker,
            price: s.data.currentPrice,
            iv: s.indicators.volatilityPct[s.indicators.volatilityPct.length-1],
            trend: s.signals.trendSignal,
            rsi: s.indicators.rsi[s.indicators.rsi.length-1]
        }));

    const prompt = `Identify the top 3 high-confidence fits for a "${strategyType}" strategy across these NSE F&O stocks.
    CANDIDATES: ${JSON.stringify(candidates)}
    USER COST: ${variableCostRate}%

    ORDER BY CONFIDENCE (Highest First).
    For each, calculate legs, Greeks (Delta, Theta, Vega, Gamma), and simple explanation.
    RETURN JSON: { "results": [ { DerivativeStrategy Object } ] }`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                systemInstruction: "Strictly return an array of DerivativeStrategy objects in the 'results' key."
            }
        });
        const parsed = JSON.parse(response.text || '{"results":[]}');
        return parsed.results.map((r: any) => ({
            ...r,
            timestamp: new Date().toLocaleTimeString()
        }));
    } catch (e) {
        console.error("Strategy scanner failed", e);
        return [];
    }
}

export async function getComprehensiveAnalysis(stock: ProcessedStock): Promise<ComprehensiveAnalysis> {
    const ai = getAiClient();
    const prompt = `Perform an institutional Omni-Analysis for the Indian stock: ${stock.ticker}.`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    return extractJsonFromText(response.text || '{}');
}

export async function getMacroDeepDive(event: string, label: string): Promise<MacroDeepDive> {
    const ai = getAiClient();
    const prompt = `Analyze: "${label}: ${event}".`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    return extractJsonFromText(response.text || '{}');
}

export async function suggestFundamentalFilters(marketRegime: string): Promise<FundamentalFilters> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Suggest filters for regime: ${marketRegime}`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
}

export async function getSentiment(ticker: string): Promise<Sentiment> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Sentiment scan for ${ticker}`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return { sentiment: 'Neutral', summary: response.text || '' };
}

/**
 * STREAMING MACRO ANALYZER
 * This function provides the strictly formatted data required by MacroSentimentDashboard.tsx
 */
export async function* getMacroSentimentStream() {
    const ai = getAiClient();
    const systemInstruction = `You are a Global Macro Strategist. You must provide a streaming update on the global and Indian economic landscape.
    Your response MUST follow this exact format for parsing:

    1. Start with "CONSENSUS: [Your 1-sentence summary of overall market sentiment]"
    2. Then provide sections with headers: GLOBAL_ECONOMY, INDIAN_ECONOMY, TRADE_TARIFFS, INSTITUTIONS.
    3. Under each header, provide 2-3 items using this pipe-separated format:
       - Item Label | Sentiment (Bullish/Bearish/Neutral) | Impact Level (High/Medium/Low) | Concise Description | Investment Thesis | Affected Sector List | Impacted Stock Tickers
    
    Example:
    GLOBAL_ECONOMY
    - US Fed Rates | Neutral | High | FOMC maintaining status quo on inflation concerns. | Longer 'higher' rates pressure growth assets. | Technology, Banking | INFY, TCS

    Use real-time news grounding via Google Search to be accurate.`;

    const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: "Execute full sectoral macro intelligence report for Indian and Global markets.",
        config: { 
            tools: [{ googleSearch: {} }],
            systemInstruction: systemInstruction
        }
    });

    for await (const chunk of stream) {
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .map((c: any) => c.web ? { uri: c.web.uri, title: c.web.title } : null)
            .filter((s: any) => s !== null);

        yield { text: chunk.text, sources: sources };
    }
}

export async function getTechnicalInsight(ticker: string, indicators: any, signals: any): Promise<TechnicalInsight> {
    return { thesis: "Analysis offline.", outlook: "Neutral", keyFactors: [], confidenceScore: 0 };
}

export async function generateCoachingInsight(result: PortfolioBacktestResult): Promise<CoachInsight> {
    return { traderArchetype: "Unknown", mentalCapitalScore: 50, psychologicalTraits: { discipline: 50, patience: 50, riskMgmt: 50, consistency: 50 }, detectedBiases: [], actionableFeedback: "Offline." };
}

export async function fetchLogisticsAnalysis(query: string): Promise<LogisticsAnalysis> {
    return { analysisText: "Offline.", outlook: "Neutral", detectedLocations: [] };
}