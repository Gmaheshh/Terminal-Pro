
import type { OpenAlgoConfig, OpenAlgoOrder } from '../types';

/**
 * OpenAlgo Service
 * Interfaces with the local or cloud OpenAlgo bridge.
 */

export interface ConnectionResult {
    ok: boolean;
    error?: 'OFFLINE' | 'CORS' | 'UNKNOWN';
}

export const checkOpenAlgoConnection = async (apiUrl: string): Promise<ConnectionResult> => {
    try {
        const response = await fetch(`${apiUrl}/api/v1/ping`, { 
            method: 'GET',
            mode: 'cors', // Explicitly request CORS
            signal: AbortSignal.timeout(3000) 
        });
        return { ok: response.ok };
    } catch (e: any) {
        if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            return { ok: false, error: 'CORS' };
        }
        return { ok: false, error: 'OFFLINE' };
    }
};

export const placeOpenAlgoOrder = async (
    config: OpenAlgoConfig, 
    ticker: string, 
    action: 'BUY' | 'SELL', 
    quantity: number, 
    strategyName: string
): Promise<Partial<OpenAlgoOrder>> => {
    if (!config.isActive) {
        throw new Error("OpenAlgo Sync is disabled.");
    }

    // Standardize symbol for NSE India (Remove .NS suffix)
    const symbol = ticker.replace('.NS', '');
    const exchange = 'NSE';

    const orderPayload = {
        symbol: symbol,
        exchange: exchange,
        action: action,
        quantity: quantity,
        strategy: strategyName,
        product: config.isSandbox ? 'PAPER' : 'MIS',
        order_type: 'MARKET',
        apikey: config.apikey
    };

    try {
        const response = await fetch(`${config.apiUrl}/api/v1/placeorder`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderPayload)
        });

        const data = await response.json();

        if (response.ok) {
            return {
                status: 'SENT',
                response: data.message || "Order success"
            };
        } else {
            return {
                status: 'REJECTED',
                response: data.error || data.message || "Order rejected"
            };
        }
    } catch (e: any) {
        let errorMsg = e.message;
        if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            errorMsg = "Network/CORS Error. Check OpenAlgo Terminal.";
        }
        return {
            status: 'FAILED',
            response: errorMsg
        };
    }
};
