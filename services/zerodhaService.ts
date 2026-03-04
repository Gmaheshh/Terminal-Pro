// Zerodha Kite Connect Service for real market data
import { KiteConnect } from 'kiteconnect';

class ZerodhaService {
  private kite: KiteConnect;
  private accessToken: string | null = null;

  constructor() {
    this.kite = new KiteConnect({
      api_key: process.env.KITE_API_KEY || ''
    });

    // Load access token from environment if available
    const token = process.env.KITE_ACCESS_TOKEN;
    if (token) {
      this.setAccessToken(token);
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    this.kite.setAccessToken(token);
  }

  getLoginUrl(): string {
    return this.kite.getLoginURL();
  }

  async generateSession(requestToken: string): Promise<any> {
    try {
      const session = await this.kite.generateSession(
        requestToken,
        process.env.KITE_API_SECRET || ''
      );
      
      this.setAccessToken(session.access_token);
      return session;
    } catch (error) {
      console.error('Zerodha session generation error:', error);
      throw error;
    }
  }

  async getHistoricalData(
    instrumentToken: number,
    interval: string,
    fromDate: Date,
    toDate: Date
  ): Promise<any[]> {
    try {
      return await this.kite.getHistoricalData(
        instrumentToken,
        interval,
        fromDate,
        toDate
      );
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  async getQuote(instruments: string[]): Promise<any> {
    try {
      return await this.kite.getQuote(instruments);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  }

  async getInstruments(exchange: string = 'NSE'): Promise<any[]> {
    try {
      return await this.kite.getInstruments(exchange);
    } catch (error) {
      console.error('Error fetching instruments:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

export default new ZerodhaService();
