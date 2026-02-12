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

const UserManual: React.FC = () => {
    return (
        <div className="p-8 max-w-5xl mx-auto font-mono h-full overflow-y-auto custom-scrollbar bg-bb-black">
            <header className="mb-12 border-b-2 border-bb-orange pb-6">
                <h1 className="text-3xl font-bold uppercase flex items-baseline">
                  <span className="text-pro-red">PRA</span>
                  <span className="text-pro-green">-GATI</span>
                  <span className="text-bb-orange text-sm ml-4">by Growth Prospect Investments</span>
                </h1>
                <p className="mt-2 text-bb-muted uppercase">Quantitative Core & AI Intelligence Framework v3.1.0</p>
            </header>

            <div className="bg-bb-panel border border-bb-blue p-4 mb-8 text-xs text-bb-blue uppercase font-bold">
                [SYSTEM NOTE] All strategies prioritize institutional Open Interest (OI) accrual. Pure retail breakouts without contract build-up are flagged as "Noise."
            </div>
            
            <Section title="1.0 // Smart Breakout Protocol (Volatility + OI)">
                <p className="text-bb-muted mb-4 italic">"This Strategy Mainly works on: Price Action, Volume Spikes, ADX Based trend confirmation and Open Interest Build Up."</p>
                
                <SubSection title="1.1 ENTRY CRITERIA">
                    <ul className="list-none space-y-2">
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span><Highlight>Squeeze Release:</Highlight> Bollinger Bands moving outside Keltner Channel.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span><Highlight>Relative Volume (RVOL) > 2.5:</Highlight> High transactional conviction vs 21-day average.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span><Highlight>OI Build > 1.0%:</Highlight> <span className="text-bb-green font-bold">MANDATORY.</span> Confirms Long Build-up. Breaks without OI are rejected.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span><Highlight>Trend Filter:</Highlight> Price must be maintained above the 200 EMA.</span>
                        </li>
                    </ul>
                </SubSection>

                <SubSection title="1.2 EXIT PROTOCOL">
                    <ul className="list-none space-y-2">
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span>Liquidate on <Highlight>ATR-based Stoploss</Highlight> (3x ATR7) or <Highlight>Take Profit</Highlight> (2x Risk).</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span>Immediate exit if <Highlight>Opposite Trend Signal</Highlight> is detected.</span>
                        </li>
                    </ul>
                </SubSection>
            </Section>

             <Section title="2.0 // Conviction-Weighted Momentum (VWLM)">
                <p className="text-bb-muted mb-4 italic">"This Strategy identifies 'True Alpha' by weighting Log-Returns against transactional conviction (Relative Volume)."</p>
                
                <SubSection title="2.1 ENTRY CRITERIA">
                    <ul className="list-none space-y-2">
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span><Highlight>EMA Crossover:</Highlight> 9-EMA of Xt vector crosses above 21-EMA of Xt vector.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span><Highlight>Magnitude (Xt) ≥ 0.1:</Highlight> Ensures move is driven by high-velocity volume.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span><Highlight>Strength Crossover:</Highlight> ADX > 25 (Trend) and RSI > 50 (Bullish Momentum).</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span><Highlight>Institutional Filter:</Highlight> Mandatory > 0.5% OI build-up on crossover date.</span>
                        </li>
                    </ul>
                </SubSection>

                <SubSection title="2.2 RISK MANAGEMENT">
                    <ul className="list-none space-y-2">
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span>Stoploss: 2x ATR (7-day).</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-bb-red mr-2">•</span>
                            <span>Target: 4x ATR (7-day) [Institutional 1:2 R/R ratio].</span>
                        </li>
                    </ul>
                </SubSection>
            </Section>

            <Section title="3.0 // AI Intelligence Framework">
                <SubSection title="3.1 GEMINI SEARCH GROUNDING">
                    <p>The system probes official <Highlight>NSE/BSE Filings</Highlight> and <Highlight>Quarterly Results</Highlight> in real-time. It identifies "Divergence" when technical signals conflict with corporate disclosures.</p>
                </SubSection>
                <SubSection title="3.2 PSYCHE-ALPHA COACH">
                    <p>Uses behavioral modeling to detect <Highlight>FOMO</Highlight> or <Highlight>Loss Aversion</Highlight> within simulation logs, assigning a "Mental Capital Score" to the strategy profile.</p>
                </SubSection>
            </Section>
        </div>
    );
};

export default UserManual;