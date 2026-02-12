import React, { useState } from 'react';
import { InfoIcon, ArrowDownIcon } from './Icons';

interface FAQItemProps {
    question: string;
    answer: React.ReactNode;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-pro-border last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-5 flex justify-between items-center text-left group"
            >
                <span className={`text-sm font-extrabold uppercase tracking-tight transition-colors ${isOpen ? 'text-pro-primary' : 'text-pro-text group-hover:text-pro-primary'}`}>
                    {question}
                </span>
                <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-pro-primary' : 'text-pro-muted'}`}>
                    <ArrowDownIcon className="w-4 h-4" />
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="text-[13px] text-pro-muted leading-relaxed font-medium uppercase border-l-2 border-pro-primary/20 pl-4">
                    {answer}
                </div>
            </div>
        </div>
    );
};

const FAQSection: React.FC = () => {
    return (
        <div className="bg-white h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto py-16 px-8">
                <header className="mb-12">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-pro-primary/10 p-2 rounded-lg">
                            <InfoIcon className="w-5 h-5 text-pro-primary" />
                        </div>
                        <span className="text-xs font-black text-pro-primary uppercase tracking-[0.3em]">Learning Center</span>
                    </div>
                    <h1 className="text-4xl font-black text-pro-text uppercase tracking-tighter mb-4">Trader Knowledge Base</h1>
                    <p className="text-sm text-pro-muted font-bold uppercase tracking-wider">Demystifying institutional strategies for the modern individual</p>
                </header>

                <div className="space-y-2">
                    <div className="mb-6">
                        <h3 className="text-[10px] font-black text-pro-muted uppercase tracking-[0.2em] mb-4 border-b border-pro-border pb-2">For Individual Traders</h3>
                        <FAQItem 
                            question="Is GP Alpha suitable for beginners?" 
                            answer="Absolutely. While our core models are mathematically complex, our interface translates them into simple 'LONG' or 'SHORT' signals. We recommend new traders start with the 'Mini Quant Simulator' (Loading Game) to build pattern recognition skills before trading live markets."
                        />
                        <FAQItem 
                            question="What is the minimum capital required?" 
                            answer="The terminal is designed for portfolios of all sizes. Our default position sizing algorithm assumes a ₹1,00,000 base for simulations, but the technical signals apply whether you are trading 1 share or 10,000."
                        />
                        <FAQItem 
                            question="How much time daily do I need to spend?" 
                            answer="The GP Alpha Terminal is optimized for 'End-of-Day' and 'Swing' traders. Most operators find that spending 15-20 minutes after market close reviewing the 'Volume/Trend' spikes is sufficient to plan the next day's execution."
                        />
                    </div>

                    <div>
                        <h3 className="text-[10px] font-black text-pro-muted uppercase tracking-[0.2em] mb-4 border-b border-pro-border pb-2">Technical Methodology</h3>
                        <FAQItem 
                            question="What is the 'Smart Breakout Protocol'?" 
                            answer="This is our flagship volatility-expansion model. It scans for stocks stuck in a 'low volatility squeeze' and triggers when institutional volume forces a breakout. It uses Open Interest to ensure 'Smart Money' is behind the move, not just retail hype."
                        />
                        <FAQItem 
                            question="How does VWLM (Conviction Momentum) work?" 
                            answer="VWLM (Volume-Weighted Log-Momentum) identifies true market Alpha by weighting price returns against volume conviction. If the vector is high and positive while a trend is strong, it's a high-probability institutional buy."
                        />
                        <FAQItem 
                            question="Are Stop Losses guaranteed?" 
                            answer="No stop loss can guarantee execution at an exact price in a gap-down market. However, our system calculates 'ATR-based' stops which dynamically adjust to the stock's natural volatility, giving your trades 'room to breathe' while protecting capital."
                        />
                    </div>
                </div>

                <div className="mt-16 bg-pro-surface border border-pro-border p-8 rounded-[32px]">
                    <h3 className="text-xs font-black text-pro-primary uppercase tracking-widest mb-4">New to Quants?</h3>
                    <p className="text-sm text-pro-text font-bold uppercase leading-relaxed mb-6">
                        Use the "AI Analyst" chat in the bottom right. You can ask it to explain any chart, indicator, or strategy in "simple terms."
                    </p>
                    <div className="flex space-x-4">
                        <button className="px-6 py-3 bg-pro-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">
                            Download Starter Guide
                        </button>
                        <button className="px-6 py-3 bg-white border border-pro-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-pro-primary transition-all shadow-sm">
                            Join Community Discord
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQSection;