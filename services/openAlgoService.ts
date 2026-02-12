
import type { OpenAlgoConfig, OpenAlgoOrder } from '../types';

export interface ConnectionResult {
    ok: boolean;
    status?: number;
    error?: 'OFFLINE' | 'CORS' | 'UNKNOWN' | '404' | 'MIXED_CONTENT' | 'SSL_REQUIRED';
    detectedUrl?: string;
    protocolMismatch?: boolean;
}

const normalizeUrl = (base: string, path: string) => {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
};

/**
 * Aggressive probe for OpenAlgo Bridge.
 * Treats ANY response (even 404) from the port as proof the server is alive.
 */
export const checkOpenAlgoConnection = async (apiUrl: string, apiPrefix: string = '/api/v1'): Promise<ConnectionResult> => {
    const isAppHttps = window.location.protocol === 'https:';
    const isTargetHttp = apiUrl.startsWith('http:');
    const protocolMismatch = isAppHttps && isTargetHttp;

    const variants = [
        apiUrl,
        'http://127.0.0.1:5000',
        'http://127.0.0.1:8000',
        'http://localhost:5000'
    ];

    for (const base of variants) {
        // Try both the API ping and the root landing page
        const endpoints = [`${apiPrefix}/ping`, '/', '/ping'];
        
        for (const endpoint of endpoints) {
            const url = normalizeUrl(base, endpoint);
            try {
                const response = await fetch(url, { 
                    method: 'GET',
                    mode: 'cors',
                    signal: AbortSignal.timeout(1200) 
                });
                
                // If we get a response (200 OK, 404 Not Found, etc.), 
                // it means the server IS listening on that port.
                if (response.status === 200 || response.status === 404) {
                    return { 
                        ok: true, 
                        status: response.status, 
                        detectedUrl: base, 
                        protocolMismatch 
                    };
                }
            } catch (e: any) {
                // If protocol mismatch (HTTPS -> HTTP), fetch might fail with TypeError
                // but if we got a 404 in the browser, the protocol mismatch is already bypassed by the user
                continue;
            }
        }
    }

    return { ok: false, error: 'OFFLINE', protocolMismatch };
};

export const placeOpenAlgoOrder = async (
    config: OpenAlgoConfig, 
    ticker: string, 
    action: 'BUY' | 'SELL', 
    quantity: number, 
    strategyName: string
): Promise<Partial<OpenAlgoOrder>> => {
    if (!config.isActive) throw new Error("Sync disabled.");

    const symbol = ticker.replace('.NS', '').replace('-EQ', '').trim();
    const orderUrl = normalizeUrl(config.apiUrl, `${config.apiPrefix}/placeorder`);

    const orderPayload = {
        symbol: symbol,
        exchange: 'NSE',
        action: action,
        quantity: Math.floor(quantity) || 1,
        strategy: strategyName || 'GP_ALPHA',
        product: 'MIS',
        order_type: 'MARKET',
        apikey: config.apikey
    };

    // Use URLSearchParams for form-encoding
    const formBody = new URLSearchParams();
    Object.entries(orderPayload).forEach(([key, val]) => formBody.append(key, val.toString()));

    try {
        const response = await fetch(orderUrl, {
            method: 'POST',
            body: formBody,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            mode: 'no-cors' // Use no-cors to bypass protocol/CORS restrictions for local bridges
        });
        
        // In no-cors mode, we get an opaque response (status 0). 
        // We consider this SENT since the request successfully left the browser.
        return { 
            status: 'SENT', 
            response: "Signal Transmitted. Confirm receipt in OpenAlgo Terminal logs." 
        };
    } catch (e: any) {
        return { 
            status: 'FAILED', 
            response: `ERR: ${e.message}. Ensure terminal is running at ${config.apiUrl}` 
        };
    }
};
