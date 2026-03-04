import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Loader } from './Loader';
import { XIcon } from './Icons';
import type { ChatMessage } from '../types';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      parts: [{ text: "PRA-GATI KERNEL_v4.2 ONLINE. I am your quantitative analyst assistant. How can I assist with your market strategy today?" }] 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const chat = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
          systemInstruction: `You are the PRA-GATI Quantitative Analyst, an institutional-grade AI assistant for a high-performance stock market terminal.
          Your expertise includes:
          - The "Smart Breakout Protocol": Focuses on Volume Spikes, Squeeze Releases (BB/KC), and mandatory OI Build-up (>1.0%).
          - "VWLM" (Conviction-Weighted Momentum): Identifies true Alpha by weighting Log-Returns against Relative Volume.
          - Market Regimes: Trending, Risk-Off, Range-Bound, High-Volatility.
          - Derivatives: Option chains, Greeks, institutional spreads.
          
          Guidelines:
          - Maintain a professional, institutional, data-driven tone (like a Bloomberg analyst).
          - Be concise but insightful.
          - If the user asks about app features, refer to the "User Manual" tab or specific quantitative models used.
          - Format responses with clear bullet points if necessary.
          - Use financial terminology (Alpha, Beta, Delta, Gamma, OI, RVOL, etc.) correctly.`,
        },
        history: messages.slice(-10), 
      });

      const result = await chat.sendMessage({ message: input });
      const modelResponse: ChatMessage = { 
        role: 'model', 
        parts: [{ text: result.text || "Kernel response timeout. Re-establishing link..." }] 
      };
      setMessages(prev => [...prev, modelResponse]);
    } catch (error) {
      console.error("AI Link Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: "CRITICAL_ERROR: Neural link interrupted. Please check connectivity." }] 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-14 right-8 z-[70] w-14 h-14 bg-pro-primary text-white rounded-full shadow-heavy flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group"
        title="Open AI Analyst"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform">
          <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 5 8.12L12 21Z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M12 14c-1.5 0-3-.5-4-1.5" stroke="currentColor" strokeWidth="2.5"/>
        </svg>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pro-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-pro-accent border-2 border-white"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-14 right-8 z-[70] w-[400px] h-[580px] bg-white rounded-3xl shadow-heavy flex flex-col font-sans text-xs overflow-hidden animate-fade-in border border-pro-border ring-1 ring-black/5">
      {/* Header */}
      <div className="bg-pro-primary p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-white font-black uppercase tracking-tighter text-sm">AI_QUANTO_ANALYST</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors bg-white/10 p-1 rounded-lg">
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-50/50">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm border ${
              m.role === 'user' 
                ? 'bg-pro-primary text-white border-pro-primary rounded-tr-none' 
                : 'bg-white border-pro-border text-pro-text rounded-tl-none'
            }`}>
              <div className={`text-[9px] font-bold mb-1 uppercase tracking-widest opacity-60 ${m.role === 'user' ? 'text-white' : 'text-pro-muted'}`}>
                {m.role === 'user' ? 'OPERATOR' : 'GEMINI_CORE'}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed font-medium">
                {m.parts[0].text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-pro-border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-3">
              <Loader className="w-4 h-4 text-pro-primary" />
              <span className="text-pro-muted font-bold uppercase text-[9px] animate-pulse">Analyzing vector signals...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-pro-border shrink-0">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query institutional analyst..."
            className="w-full bg-pro-surface border border-pro-border rounded-xl p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-pro-primary/20 focus:border-pro-primary uppercase font-bold text-pro-text placeholder:text-pro-muted text-[11px]"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-pro-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-30 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
            </svg>
          </button>
        </div>
        <div className="mt-3 text-[8px] text-pro-muted text-center font-bold uppercase tracking-widest opacity-50">
          Powered by Gemini 2.5 Pro Neural Matrix
        </div>
      </div>
    </div>
  );
};

export default ChatBot;