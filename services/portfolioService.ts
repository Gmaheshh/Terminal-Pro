
import type { ProcessedStock, PortfolioMetrics, OptimizationRecommendation } from '../types';
import { GoogleGenAI } from "@google/genai";

const RISK_FREE_RATE = 0.07; // 7% Indian Risk-Free Rate (proxy)

export const calculateSharpeRatio = (returns: number[], volatility: number): number => {
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const annualizedReturn = avgReturn * 252; // Daily to Yearly
    const excessReturn = annualizedReturn - RISK_FREE_RATE;
    return excessReturn / volatility;
};

export const getPortfolioMetrics = async (selectedStocks: ProcessedStock[], allStocks: ProcessedStock[]): Promise<PortfolioMetrics> => {
    if (selectedStocks.length === 0) {
        // Fix: Added missing 'aiInsight' property on line 16 to satisfy PortfolioMetrics interface
        return { 
            annualReturn: 0, 
            annualVolatility: 0, 
            sharpeRatio: 0, 
            optimalWeights: {}, 
            recommendations: [],
            aiInsight: "Portfolio not yet configured."
        };
    }

    // 1. Calculate individual metrics for optimization
    const stockStats = selectedStocks.map(stock => {
        const lastIdx = stock.data.historical.length - 1;
        const prices = stock.data.historical.map(d => d.close);
        const dailyReturns = prices.slice(1).map((p, idx) => (p - prices[idx]) / prices[idx]);
        const avgDaily = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
        const annualizedRet = avgDaily * 252;
        
        const atr = stock.indicators.atr[lastIdx];
        const annVol = (atr / stock.data.currentPrice) * Math.sqrt(252);
        
        const stockSharpe = (annualizedRet - RISK_FREE_RATE) / (annVol || 0.01);
        
        return {
            ticker: stock.ticker,
            ret: annualizedRet,
            vol: annVol,
            sharpe: Math.max(0.1, stockSharpe) // Clamp at 0.1 for weight calculation
        };
    });

    // 2. Heuristic Optimization: Weight = (Sharpe / Variance) normalized
    // This rewards higher Sharpe stocks while penalizing volatility exponentially
    let totalScore = 0;
    const scores = stockStats.map(s => {
        const score = s.sharpe / (s.vol * s.vol);
        totalScore += score;
        return { ticker: s.ticker, score };
    });

    const optimalWeights: Record<string, number> = {};
    scores.forEach(s => {
        optimalWeights[s.ticker] = (s.score / totalScore) * 100;
    });

    // 3. Calculate Portfolio Totals based on Optimal Weights
    let totalAnnReturn = 0;
    let totalAnnVol = 0;

    stockStats.forEach(s => {
        const weight = optimalWeights[s.ticker] / 100;
        totalAnnReturn += s.ret * weight;
        totalAnnVol += s.vol * weight;
    });

    const finalPortfolioSharpe = (totalAnnReturn - RISK_FREE_RATE) / (totalAnnVol || 0.01);

    // 4. Recommendation Logic (Suggesting high-alpha assets)
    const nonSelected = allStocks.filter(s => !selectedStocks.some(sel => sel.ticker === s.ticker));
    const recommendations: OptimizationRecommendation[] = nonSelected
        .map(s => {
            const prices = s.data.historical.map(d => d.close);
            const dailyReturns = prices.slice(1).map((p, idx) => (p - prices[idx]) / prices[idx]);
            const avgDaily = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
            const annRet = avgDaily * 252;
            const atr = s.indicators.atr[s.indicators.atr.length - 1];
            const annVol = (atr / s.data.currentPrice) * Math.sqrt(252);
            const stockSharpe = (annRet - RISK_FREE_RATE) / (annVol || 0.01);
            return {
                ticker: s.ticker,
                action: 'ADD' as const,
                reason: `Alpha Opportunity (Sharpe: ${stockSharpe.toFixed(2)})`,
                expectedImpactOnSharpe: stockSharpe,
                historicalSharpe: stockSharpe
            };
        })
        .sort((a, b) => b.historicalSharpe - a.historicalSharpe)
        .slice(0, 3);

    // 5. AI Insight
    let aiInsight = "Recalculating efficient frontier...";
    try {
        const apiKey = process.env.API_KEY;
        if (apiKey) {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Analyze this optimized Indian equity portfolio: 
            Tickers & Weights: ${JSON.stringify(optimalWeights)}. 
            Portfolio Sharpe: ${finalPortfolioSharpe.toFixed(2)}. 
            Return: ${(totalAnnReturn * 100).toFixed(2)}%, Vol: ${(totalAnnVol * 100).toFixed(2)}%.
            Provide a 2-sentence institutional recommendation on rebalancing or sector rotation to improve this Sharpe Ratio.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            aiInsight = response.text || "Insight unavailable.";
        }
    } catch (e) {
        aiInsight = "AI Matrix Offline. Using mathematical core for suggestions.";
    }

    return {
        annualReturn: totalAnnReturn * 100,
        annualVolatility: totalAnnVol * 100,
        sharpeRatio: finalPortfolioSharpe,
        optimalWeights,
        recommendations,
        aiInsight
    };
};
