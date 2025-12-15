import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-10">
        <h2 className="text-xl font-bold text-bb-orange border-b border-bb-border pb-1 mb-4 uppercase tracking-wider">{title}</h2>
        <div className="space-y-4 text-bb-text text-sm leading-relaxed font-mono">
            {children}
        </div>
    </div>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6 pl-4 border-l-2 border-bb-border">
        <h3 className="text-base font-bold text-white mb-2 uppercase">{title}</h3>
        <div className="space-y-3">
         {children}
        </div>
    </div>
);

const Highlight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="font-bold text-bb-blue">{children}</span>
);

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <code className="bg-bb-panel text-bb-green px-2 py-0.5 text-xs">{children}</code>
);

const UserManual: React.FC = () => {
    return (
        <div className="p-8 max-w-5xl mx-auto font-mono h-full overflow-y-auto">
            <header className="mb-12 border-b-2 border-bb-orange pb-6">
                <h1 className="text-3xl font-bold text-white uppercase">System Documentation <span className="text-bb-orange text-lg">v2.4.0</span></h1>
                <p className="mt-2 text-bb-muted uppercase">Automated Trading Strategy & Signal Logic</p>
            </header>

            <div className="bg-bb-panel border border-bb-blue p-4 mb-8 text-xs text-bb-blue uppercase font-bold">
                [SYSTEM ALERT] Strategy Simulation Mode: LONG-ONLY. "SELL" Signals initiate exit of LONG positions. Short selling is disabled in current firmware.
            </div>
            
            <Section title="1.0 // Volatility Breakout Protocol">
                <p>Designed for rapid momentum capture. Identifies assets in confirmed uptrend exhibiting statistically significant volume surge.</p>
                
                <SubSection title="1.1 ENTRY PARAMETERS">
                    <ul className="list-square pl-5 space-y-2">
                        <li><Highlight>RVOL > 3.0</Highlight>: Relative Volume exceeds 300% of 20-day baseline.</li>
                        <li><Highlight>ADX > 25</Highlight>: Trend strength confirmed. +DI must exceed -DI.</li>
                    </ul>
                </SubSection>

                <SubSection title="1.2 RISK MANAGEMENT">
                     <p>Dynamic volatility-based stop calculation.</p>
                     <p><Code>STOP_LOSS = PRICE - (3 * ATR_7)</Code></p>
                     <p><Code>TAKE_PROFIT = PRICE + (RISK * 2)</Code></p>
                </SubSection>
            </Section>

            <Section title="2.0 // Short-Term Crossover Protocol">
                <p>Standard momentum shift detection for medium-frequency swing trading.</p>
                 <SubSection title="2.1 LOGIC GATE">
                    <ul className="list-square pl-5 space-y-2">
                        <li><Highlight>ENTRY</Highlight>: SMA_20 CROSS_OVER SMA_50 (Golden Cross).</li>
                        <li><Highlight>EXIT</Highlight>: SMA_20 CROSS_UNDER SMA_50 (Death Cross) OR Stop/Target Hit.</li>
                        <li><Highlight>RISK CALC</Highlight>: Swing Low (20-period) vs Swing High (50-period).</li>
                        <li><Highlight>FILTER</Highlight>: Reward/Risk Ratio >= 1.5 REQUIRED.</li>
                    </ul>
                </SubSection>
            </Section>

             <Section title="3.0 // VWLM (Volume-Weighted Log Momentum)">
                <p>Advanced algorithmic signal derived from volume-weighted logarithmic returns (Xt).</p>
                <SubSection title="3.1 FORMULA">
                     <p><Code>Xt = Log(Close/Prev) * (Vol / Vol_Avg_20)</Code></p>
                </SubSection>
                <SubSection title="3.2 SIGNAL GENERATION">
                     <ul className="list-square pl-5 space-y-2">
                        <li><Highlight>BUY</Highlight>: EMA_9(Xt) > EMA_21(Xt) AND Xt >= 0.1 AND RSI > 50.</li>
                        <li><Highlight>SELL</Highlight>: EMA_9(Xt) &lt; EMA_21(Xt) AND Xt &lt;= -0.1 AND RSI &lt; 50.</li>
                    </ul>
                </SubSection>
            </Section>

            <Section title="4.0 // Portfolio Simulator Engine">
                <p>Historical backtesting kernel running independent simulations for each strategy logic.</p>

                <SubSection title="4.1 EXECUTION RULES">
                     <ul className="list-square pl-5 space-y-2">
                        <li><Highlight>CAPITAL</Highlight>: 100,000 INR Initial Seed.</li>
                        <li><Highlight>RISK MODEL</Highlight>: Fixed Fractional (2% Risk of Total Equity per Trade).</li>
                        <li><Highlight>DIVERSIFICATION</Highlight>: Hard cap of 25% Equity per Position.</li>
                    </ul>
                </SubSection>
            </Section>
        </div>
    );
};

export default UserManual;