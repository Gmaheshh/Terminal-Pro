import { GoogleGenAI, Type } from "@google/genai";
import type { ProcessedStock, SignalAlert } from '../types';

/**
 * Scan specific stocks that have active signals for news events.
 * Classify if the news is CONFIRMING the signal or THREATENING it.
 */
export const generateSignalAlerts = async (stocks: ProcessedStock[]): Promise<SignalAlert[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || stocks.length === 0) return [];

    const ai = new GoogleGenAI({ apiKey });

    // 1. Filter: Only look at stocks with active signals to reduce noise and API cost
    const activeSignalStocks = stocks.filter(s => 
        s.signals.volumeSignal === 'Spike' || 
        s.signals.shortTermCrossBuySignal || 
        s.signals.vwlmBuySignal
    );

    // Limit to top 5 for demo performance/quota reasons
    const targetStocks = activeSignalStocks.slice(0, 5);
    
    if (targetStocks.length === 0) return [];

    // Prepare context for LLM
    const targetsInfo = targetStocks.map(s => {
        let direction = 'NEUTRAL';
        if (s.signals.vwlmBuySignal || s.signals.shortTermCrossBuySignal) direction = 'LONG';
        else if (s.signals.vwlmSellSignal || s.signals.shortTermCrossSellSignal) direction = 'SHORT';
        else if (s.signals.volumeSignal === 'Spike' && s.signals.trendSignal === 'Uptrend') direction = 'LONG';

        return { ticker: s.ticker, direction };
    }).filter(t => t.direction !== 'NEUTRAL');

    if (targetsInfo.length === 0) return [];

    const prompt = `You are a Trading Risk Engine. I have active technical signals for the following stocks.
    Check for recent (last 7 days) Earnings, Ratings, or Macro events for these specific tickers.
    
    Targets: ${JSON.stringify(targetsInfo)}

    Rules:
    1. If Signal is LONG and News is Positive -> Impact: CONFIRMING
    2. If Signal is LONG and News is Negative -> Impact: THREATENING
    3. If Signal is SHORT and News is Negative -> Impact: CONFIRMING
    4. If Signal is SHORT and News is Positive -> Impact: THREATENING
    5. Ignore Neutral news.

    Return a JSON array of objects. Schema:
    [
        {
            "ticker": "string",
            "event": "string",
            "impact": "CONFIRMING" | "THREATENING" | "NEUTRAL",
            "reason": "string"
        }
    ]
    
    Use Google Search to find real, recent events. If no significant news, do not return an object for that ticker.
    Ensure response is strictly a valid JSON array.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                // responseMimeType and responseSchema cannot be used with googleSearch
            }
        });

        let jsonString = response.text || '[]';
        
        // Extract JSON from markdown if present
        const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || jsonString.match(/```\s*([\s\S]*?)\s*```/);
        if (match) {
            jsonString = match[1];
        }

        // Clean up array bounds
        const start = jsonString.indexOf('[');
        const end = jsonString.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            jsonString = jsonString.substring(start, end + 1);
        }

        let rawAlerts = [];
        try {
            rawAlerts = JSON.parse(jsonString);
        } catch (e) {
            console.warn("Failed to parse alerts JSON", e);
            rawAlerts = [];
        }
        
        if (!Array.isArray(rawAlerts)) {
             rawAlerts = [];
        }

        // Post-processing to map back to our types and add timestamps
        const alerts: SignalAlert[] = rawAlerts.map((a: any) => {
            const stockRef = targetsInfo.find(t => t.ticker === a.ticker);
            const direction = stockRef?.direction === 'LONG' || stockRef?.direction === 'SHORT' 
                ? stockRef.direction 
                : 'LONG'; // Default fallback

            return {
                ticker: a.ticker,
                signalDirection: direction as 'LONG' | 'SHORT',
                event: a.event,
                impact: ['CONFIRMING', 'THREATENING', 'NEUTRAL'].includes(a.impact) ? a.impact : 'NEUTRAL',
                reason: a.reason,
                timestamp: new Date().toLocaleTimeString()
            };
        });

        return alerts;

    } catch (error) {
        console.error("Intelligence Engine Failed:", error);
        return [];
    }
};