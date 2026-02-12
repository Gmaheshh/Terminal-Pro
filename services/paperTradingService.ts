
import type { PaperAccount, PaperOrder, PaperTrade, PaperPosition, PaperRiskConfig, ProcessedStock } from '../types';

/**
 * Calculates Indian market charges (STT, GST, Transaction, Stamp Duty)
 */
export const calculateIndianCharges = (turnover: number, side: 'BUY' | 'SELL'): number => {
    const brokerage = 20; // Flat ₹20 for MIS
    const stt = side === 'SELL' ? turnover * 0.0001 : 0; // STT on sell for intraday
    const transactionCharge = turnover * 0.0000345; 
    const sebiCharge = turnover * 0.0000001; 
    const gst = (brokerage + transactionCharge) * 0.18; 
    const stampDuty = side === 'BUY' ? turnover * 0.00003 : 0; // 0.003% on buy

    return brokerage + stt + transactionCharge + sebiCharge + gst + stampDuty;
};

export const simulateFill = (
    order: PaperOrder, 
    currentPrice: number, 
    slippageBps: number
): PaperTrade | null => {
    let fillPrice = 0;
    const slippageMult = slippageBps / 10000;

    if (order.orderType === 'MARKET') {
        fillPrice = order.action === 'BUY' 
            ? currentPrice * (1 + slippageMult) 
            : currentPrice * (1 - slippageMult);
    } else if (order.orderType === 'LIMIT') {
        if (order.action === 'BUY' && currentPrice <= (order.limitPrice || 0)) fillPrice = order.limitPrice!;
        if (order.action === 'SELL' && currentPrice >= (order.limitPrice || 0)) fillPrice = order.limitPrice!;
    }

    if (fillPrice > 0) {
        const turnover = fillPrice * order.quantity;
        return {
            id: 'TR-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
            orderId: order.id,
            ticker: order.ticker,
            action: order.action,
            quantity: order.quantity,
            price: fillPrice,
            timestamp: new Date().toLocaleTimeString(),
            charges: calculateIndianCharges(turnover, order.action)
        };
    }

    return null;
};

export const updatePosition = (
    currentPos: PaperPosition | undefined, 
    trade: PaperTrade
): PaperPosition => {
    const ticker = trade.ticker;
    const tradeQty = trade.action === 'BUY' ? trade.quantity : -trade.quantity;
    
    if (!currentPos) {
        return {
            ticker,
            quantity: tradeQty,
            avgPrice: trade.price,
            lastPrice: trade.price,
            realizedPnl: -trade.charges,
            unrealizedPnl: 0
        };
    }

    const newQty = currentPos.quantity + tradeQty;
    let newAvgPrice = currentPos.avgPrice;
    let realizedPnl = currentPos.realizedPnl - trade.charges;

    // Position closing or reducing
    if ((currentPos.quantity > 0 && tradeQty < 0) || (currentPos.quantity < 0 && tradeQty > 0)) {
        const closedQty = Math.min(Math.abs(currentPos.quantity), Math.abs(tradeQty));
        const profitPerUnit = currentPos.quantity > 0 
            ? (trade.price - currentPos.avgPrice) 
            : (currentPos.avgPrice - trade.price);
        realizedPnl += closedQty * profitPerUnit;
    } 
    // Position increasing
    else {
        newAvgPrice = ((currentPos.quantity * currentPos.avgPrice) + (tradeQty * trade.price)) / newQty;
    }

    return {
        ...currentPos,
        quantity: newQty,
        avgPrice: newAvgPrice,
        realizedPnl,
        unrealizedPnl: 0 // Will be calculated live
    };
};
