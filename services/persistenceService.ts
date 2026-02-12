
import type { PaperAccount, PaperOrder, PaperTrade, PaperPosition } from '../types';

const STORAGE_KEYS = {
    ACCOUNT: 'gp_alpha_paper_account',
    ORDERS: 'gp_alpha_paper_orders',
    TRADES: 'gp_alpha_paper_trades',
    POSITIONS: 'gp_alpha_paper_positions',
    LOGS: 'gp_alpha_paper_logs'
};

export const savePaperState = (state: {
    account: PaperAccount;
    orders: PaperOrder[];
    trades: PaperTrade[];
    positions: PaperPosition[];
    logs: string[];
}) => {
    try {
        localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(state.account));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(state.orders));
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(state.trades));
        localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(state.positions));
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.logs));
    } catch (e) {
        console.error("Failed to sync paper state to persistent storage:", e);
    }
};

export const loadPaperState = () => {
    try {
        const account = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
        const orders = localStorage.getItem(STORAGE_KEYS.ORDERS);
        const trades = localStorage.getItem(STORAGE_KEYS.TRADES);
        const positions = localStorage.getItem(STORAGE_KEYS.POSITIONS);
        const logs = localStorage.getItem(STORAGE_KEYS.LOGS);

        return {
            account: account ? JSON.parse(account) : null,
            orders: orders ? JSON.parse(orders) : [],
            trades: trades ? JSON.parse(trades) : [],
            positions: positions ? JSON.parse(positions) : [],
            logs: logs ? JSON.parse(logs) : ["[SYS] Persistent Ledger Connected."]
        };
    } catch (e) {
        console.error("Failed to load paper state:", e);
        return null;
    }
};

export const clearPaperState = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
};
