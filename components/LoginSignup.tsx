import React, { useState } from 'react';
import { BrainCircuitIcon, ListIcon, ArrowDownIcon } from './Icons';

interface LoginSignupProps {
  onLogin: (user: {name: string}) => void;
}

const PricingCard: React.FC<{ 
    name: string, 
    price: string, 
    features: string[], 
    highlighted?: boolean,
    buttonText: string,
    isFree?: boolean
}> = ({ name, price, features, highlighted, buttonText, isFree }) => (
    <div className={`flex flex-col p-6 rounded-3xl border transition-all duration-500 hover:scale-[1.02] ${highlighted ? 'bg-pro-primary text-white shadow-heavy border-pro-primary ring-4 ring-pro-primary/10 scale-105 z-10' : 'bg-white text-pro-text border-pro-border shadow-soft'}`}>
        {highlighted && (
            <span className="bg-pro-accent text-pro-text text-[9px] font-black uppercase tracking-widest py-1 px-3 rounded-full self-start mb-4">Most Popular</span>
        )}
        <h3 className={`text-lg font-black uppercase tracking-tight ${highlighted ? 'text-white' : 'text-pro-primary'}`}>{name}</h3>
        <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-black tracking-tighter">{isFree ? '₹0' : `₹${price}`}</span>
            {!isFree && <span className={`ml-1 text-[10px] font-bold uppercase tracking-widest ${highlighted ? 'text-white/60' : 'text-pro-muted'}`}>/ Month</span>}
            {isFree && <span className={`ml-1 text-[10px] font-bold uppercase tracking-widest ${highlighted ? 'text-white/60' : 'text-pro-muted'}`}>Forever</span>}
        </div>
        <ul className="mt-6 space-y-3 flex-1">
            {features.map((feature, i) => (
                <li key={i} className="flex items-start text-[10px] font-bold uppercase tracking-tight">
                    <span className={`mr-2 ${highlighted ? 'text-pro-accent' : 'text-pro-primary'}`}>✓</span>
                    <span className={highlighted ? 'text-white/90' : 'text-pro-muted'}>{feature}</span>
                </li>
            ))}
        </ul>
        <button className={`mt-8 w-full py-3 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all active:scale-95 ${highlighted ? 'bg-white text-pro-primary hover:bg-pro-bg' : 'bg-pro-primary text-white hover:bg-blue-700'}`}>
            {buttonText}
        </button>
    </div>
);

const LoginSignup: React.FC<LoginSignupProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin({ name: name || email.split('@')[0] || 'Alpha Trader' });
      setLoading(false);
    }, 1500);
  };

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-pro-bg flex flex-col font-sans selection:bg-pro-primary/20 overflow-x-hidden">
      {/* Website Header */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-[100] border-b border-pro-border">
        <div className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
            <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-tighter uppercase flex items-center">
                    <span className="text-pro-red">PRA</span>
                    <span className="text-pro-green">-GATI</span>
                </h1>
            </div>
            <div className="hidden md:flex space-x-8 text-[10px] font-black text-pro-muted uppercase tracking-[0.2em]">
                <a href="#hero" className="hover:text-pro-primary transition-colors">Hero</a>
                <button onClick={scrollToPricing} className="hover:text-pro-primary transition-colors">Retail Pricing</button>
                <a href="#faq" className="hover:text-pro-primary transition-colors">Documentation</a>
            </div>
            <button 
                onClick={() => document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-pro-primary text-white px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md"
            >
                Launch Terminal
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-40 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 animate-fade-in">
            <div className="inline-flex px-3 py-1 bg-pro-primary/10 text-pro-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                Institutional Intel. Democratized.
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-pro-text tracking-tighter leading-[0.85] uppercase">
                Trade with the Conviction of <span className="text-pro-red">PRA</span><span className="text-pro-green">-GATI</span>.
            </h1>
            <p className="text-lg text-pro-muted font-medium leading-relaxed max-w-lg">
                PRA-GATI bridges the gap. We provide individual traders with the same quantitative models, NSE live-links, and AI neural scans used by elite hedge funds.
            </p>
            <div className="flex space-x-4">
                <button 
                    onClick={() => document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-pro-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                    Start Free Trial
                </button>
                <button onClick={scrollToPricing} className="bg-white border border-pro-border text-pro-text px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-pro-bg transition-all active:scale-95">
                    View Plans
                </button>
            </div>
        </div>

        {/* Auth Card Placement */}
        <div id="auth-card" className="w-full max-w-[420px] bg-white rounded-[40px] shadow-heavy border border-pro-border p-10 relative overflow-hidden animate-fade-in lg:ml-auto">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-pro-primary/5 rounded-full blur-3xl"></div>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-pro-primary/10 rounded-2xl mb-4">
                <BrainCircuitIcon className="w-7 h-7 text-pro-primary" />
            </div>
            <h1 className="text-2xl font-black text-pro-text tracking-tight uppercase">
                {isLogin ? 'Access Terminal' : 'Create Account'}
            </h1>
            <p className="text-xs text-pro-muted font-bold uppercase tracking-wider mt-1 px-4">
                {isLogin ? 'Enter your credentials to enter' : 'Join the PRA-GATI network'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[9px] font-black text-pro-muted uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                    className="w-full bg-pro-surface border border-pro-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-pro-primary/20 focus:border-pro-primary outline-none transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-[9px] font-black text-pro-muted uppercase tracking-widest mb-1.5 ml-1">Work Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="trader@market.com"
                className="w-full bg-pro-surface border border-pro-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-pro-primary/20 focus:border-pro-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-pro-muted uppercase tracking-widest mb-1.5 ml-1">Security Key</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-pro-surface border border-pro-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-pro-primary/20 focus:border-pro-primary outline-none transition-all"
              />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-pro-primary text-white font-black py-4 rounded-xl shadow-lg shadow-pro-primary/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center uppercase tracking-widest text-[10px]"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : isLogin ? 'Authenticate Access' : 'Create Alpha Account'}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-pro-border/50">
            <p className="text-[10px] text-pro-muted font-bold uppercase tracking-widest">
              {isLogin ? "New Operator?" : "Existing User?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-pro-primary font-black hover:underline"
              >
                {isLogin ? 'Register Here' : 'Login Access'}
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white border-y border-pro-border overflow-hidden relative">
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] text-[20rem] font-black text-pro-text pointer-events-none select-none tracking-tighter">PRICING</div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <header className="text-center mb-16">
                <div className="inline-flex px-3 py-1 bg-pro-primary/10 text-pro-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
                    Retail & Institutional Tiers
                </div>
                <h2 className="text-5xl font-black text-pro-text uppercase tracking-tighter mb-4">Scaled for your Ambition</h2>
                <p className="text-pro-muted font-bold uppercase tracking-widest text-sm">Professional quantitative tools for every level of capital</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                <PricingCard 
                    name="Alpha Free"
                    price="0"
                    isFree={true}
                    features={[
                        "Volume/Trend Dashboard",
                        "User Manual Access",
                        "Mini Quant Game",
                        "Ticker Tape Access",
                        "Community Support"
                    ]}
                    buttonText="Start Discovery"
                />
                <PricingCard 
                    name="Alpha Lite"
                    price="499"
                    features={[
                        "Everything in Free",
                        "Recent News Feed",
                        "Backtest Simulations",
                        "SMA/EMA Indicators",
                        "Basic Signal Reports"
                    ]}
                    buttonText="Get Lite"
                />
                <PricingCard 
                    name="Alpha Pro"
                    price="899"
                    highlighted={true}
                    features={[
                        "Everything in Lite",
                        "VWLM Alpha Signals",
                        "Derivatives Desk",
                        "Strategy Backtester",
                        "OI Build-up Scans"
                    ]}
                    buttonText="Unlock Pro"
                />
                <PricingCard 
                    name="Alpha Elite"
                    price="1499"
                    features={[
                        "Everything in Pro",
                        "Macro Analysis Matrix",
                        "Portfolio Maker",
                        "Payoff Visualizer",
                        "AI Analyst Chatbot",
                        "Full Historical Data"
                    ]}
                    buttonText="Full Access"
                />
            </div>

            {/* Feature Matrix for Retailers */}
            <div className="max-w-5xl mx-auto bg-pro-surface border border-pro-border rounded-3xl overflow-hidden shadow-soft">
                <div className="p-6 bg-white border-b border-pro-border flex items-center justify-between">
                    <span className="font-black text-pro-text uppercase tracking-widest text-xs">Tiered Feature Matrix</span>
                    <ListIcon className="w-4 h-4 text-pro-primary" />
                </div>
                <div className="p-8 space-y-6">
                    <FeatureRow label="Volume/Trend Dashboard" free={true} lite={true} pro={true} elite={true} />
                    <FeatureRow label="Mini Quant Training" free={true} lite={true} pro={true} elite={true} />
                    <FeatureRow label="Portfolio Backtester" free={false} lite={true} pro={true} elite={true} />
                    <FeatureRow label="VWLM Momentum Signals" free={false} lite={false} pro={true} elite={true} />
                    <FeatureRow label="Derivatives Trading Desk" free={false} lite={false} pro={true} elite={true} />
                    <FeatureRow label="Macro Correlation Matrix" free={false} lite={false} freeStatus={false} liteStatus={false} pro={false} elite={true} />
                    <FeatureRow label="AI Quant Analyst Chat" free={false} lite={false} freeStatus={false} liteStatus={false} pro={false} elite={true} />
                </div>
                <div className="bg-white p-4 border-t border-pro-border flex justify-around text-[9px] font-black uppercase text-pro-muted">
                    <span>FREE</span>
                    <span>LITE</span>
                    <span>PRO</span>
                    <span>ELITE</span>
                </div>
            </div>
        </div>
      </section>

      {/* Safety Guardrail for Retailers */}
      <section className="py-20 bg-pro-bg text-center px-6">
          <p className="text-[10px] max-w-3xl mx-auto text-pro-muted leading-relaxed font-bold uppercase tracking-widest opacity-60">
              Disclaimer: Quantitative trading involves significant risk of loss. PRA-GATI provides intelligence tools for educational and research purposes. Individual results will vary based on market conditions and capital management. Always trade responsibly.
          </p>
      </section>
      
      <footer className="p-12 text-center bg-white border-t border-pro-border">
        <div className="flex items-center justify-center space-x-2 mb-6">
            <h1 className="text-lg font-black tracking-tighter uppercase flex items-center">
                <span className="text-pro-red">PRA</span>
                <span className="text-pro-green">-GATI</span>
            </h1>
        </div>
        <p className="text-[9px] text-pro-muted font-bold uppercase tracking-[0.4em]">&copy; 2025 Growth Prospect Investments. Developed for the next generation of retailers.</p>
      </footer>
    </div>
  );
};

const FeatureRow: React.FC<{ label: string, free: boolean, lite: boolean, pro: boolean, elite: boolean, freeStatus?: boolean, liteStatus?: boolean }> = ({ label, free, lite, pro, elite }) => (
    <div className="flex items-center justify-between border-b border-pro-border/50 pb-4 last:border-0 last:pb-0">
        <span className="text-[11px] font-black text-pro-text uppercase tracking-tight w-1/4">{label}</span>
        <div className="flex flex-1 justify-around text-center">
            <span className={free ? 'text-pro-green font-bold' : 'text-pro-muted/30'}>{free ? '✓' : '×'}</span>
            <span className={lite ? 'text-pro-green font-bold' : 'text-pro-muted/30'}>{lite ? '✓' : '×'}</span>
            <span className={pro ? 'text-pro-green font-bold' : 'text-pro-muted/30'}>{pro ? '✓' : '×'}</span>
            <span className={elite ? 'text-pro-green font-bold' : 'text-pro-muted/30'}>{elite ? '✓' : '×'}</span>
        </div>
    </div>
);

export default LoginSignup;