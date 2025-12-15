import { GoogleGenAI } from "@google/genai";
import type { NewsResult, SearchSource } from '../types';

export const fetchMarketNews = async (tickers: string[]): Promise<NewsResult> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // We limit the number of tickers sent to the prompt to avoid token limits or confusion
    const tickersToSearch = tickers.slice(0, 10).join(', ');

    const prompt = `Identify the most significant recent news events (last 7 days) for the following list of Indian stock tickers: ${tickersToSearch}.
    Focus on earnings reports, major regulatory actions, significant mergers/acquisitions, or reasons for unusual price movement.
    
    Return a JSON object with a key 'items' containing an array of news items.
    Each item object must have:
    - 'title': A concise headline.
    - 'summary': A short description (max 2 sentences).
    - 'relatedTickers': An array of strings containing the tickers involved.
    - 'sentiment': 'Bullish', 'Bearish', or 'Neutral'.
    
    Do not add markdown formatting. Just return the JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        let jsonString = '';
        
        // Extract JSON
        const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
            jsonString = markdownMatch[1];
        } else {
            const jsonStartIndex = text.indexOf('{');
            const jsonEndIndex = text.lastIndexOf('}');
            if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
                jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);
            } else {
                jsonString = text;
            }
        }
        
        let parsedData;
        try {
            parsedData = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse news JSON", e);
            throw new Error("Failed to parse news data.");
        }

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: SearchSource[] = groundingChunks
            ?.map((chunk: any) => (chunk.web ? {
                uri: chunk.web.uri,
                title: chunk.web.title,
            } : null))
            .filter((source: any): source is SearchSource => source !== null && !!source.uri && !!source.title) ?? [];

        return {
            items: parsedData.items || [],
            sources: sources
        };

    } catch (error) {
        console.error("Error fetching market news:", error);
        return { items: [], sources: [] };
    }
};