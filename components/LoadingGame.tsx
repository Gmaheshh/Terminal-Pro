import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tickers } from '../constants';
import { fetchStockData } from '../services/stockDataService';
import type { OHLCV } from '../types';
import { Loader } from './Loader';

interface GameData {
  ticker: string;
  visibleData: OHLCV[];
  hiddenData: OHLCV[];
}

interface MiniChartProps {
    visibleData: OHLCV[];
    hiddenData: OHLCV[];
    revealed: boolean;
    width?: number;
    height?: number;
}

const MiniChart: React.FC<MiniChartProps> = ({ visibleData, hiddenData, revealed, width = 500, height = 250 }) => {
    const chartData = useMemo(() => {
        if (visibleData.length === 0) return null;

        const allData = [...visibleData, ...hiddenData];
        const prices = allData.map(d => d.close);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const priceRange = maxPrice - minPrice === 0 ? 1 : maxPrice - minPrice;

        const toSvgPoint = (price: number, index: number, totalPoints: number) => {
            const x = (index / (totalPoints - 1)) * width;
            const y = height - (((price - minPrice) / priceRange) * (height * 0.9) + (height * 0.05));
            return { x, y };
        };

        const visiblePoints = visibleData.map((d, i) => {
            const { x, y } = toSvgPoint(d.close, i, allData.length);
            return `${x},${y}`;
        }).join(' ');

        const lastVisiblePoint = toSvgPoint(visibleData[visibleData.length - 1].close, visibleData.length - 1, allData.length);

        const hiddenPointsData = hiddenData.map((d, i) => {
            const pointIndex = visibleData.length + i;
            return toSvgPoint(d.close, pointIndex, allData.length);
        });

        const hiddenPoints = [`${lastVisiblePoint.x},${lastVisiblePoint.y}`, ...hiddenPointsData.map(p => `${p.x},${p.y}`)].join(' ');
        
        const separatorX = lastVisiblePoint.x;

        const trendUp = hiddenData.length > 0 && hiddenData[hiddenData.length - 1].close >= visibleData[visibleData.length - 1].close;
        const revealedColor = trendUp ? 'stroke-pro-green' : 'stroke-pro-red';

        return { visiblePoints, hiddenPoints, separatorX, revealedColor };
    }, [visibleData, hiddenData, width, height]);

    if (!chartData) return null;

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <rect width="100%" height="100%" fill="#f8fafc" />
            <polyline fill="none" stroke="#2563eb" strokeWidth="3" points={chartData.visiblePoints} />
            {revealed && (
                <polyline fill="none" className={chartData.revealedColor} strokeWidth="3" points={chartData.hiddenPoints} />
            )}
            <line
                x1={chartData.separatorX}
                y1="0"
                x2={chartData.separatorX}
                y2={height}
                stroke="#e2e8f0"
                strokeWidth="2"
                strokeDasharray="4 4"
            />
        </svg>
    );
};


const LoadingGame: React.FC = () => {
  const [gameState, setGameState] = useState<'loading' | 'guessing' | 'revealed'>('loading');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const setupNewRound = useCallback(async () => {
    setGameState('loading');
    setResult(null);
    let fetched = false;

    while (!fetched) {
        try {
            const randomTicker = Tickers[Math.floor(Math.random() * Tickers.length)];
            const stockData = await fetchStockData(randomTicker);
            
            if (stockData.historical.length > 120) {
                const totalLength = stockData.historical.length;
                const gameSlice = stockData.historical.slice(-120);
                const visibleData = gameSlice.slice(0, 100);
                const hiddenData = gameSlice.slice(100);

                setGameData({ ticker: randomTicker, visibleData, hiddenData });
                setGameState('guessing');
                fetched = true;
            }
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
  }, []);

  useEffect(() => {
    setupNewRound();
  }, [setupNewRound]);

  const handleGuess = (guess: 'up' | 'down') => {
    if (gameState !== 'guessing' || !gameData) return;
    
    const startPrice = gameData.visibleData[gameData.visibleData.length - 1].close;
    const endPrice = gameData.hiddenData[gameData.hiddenData.length - 1].close;
    
    const actualTrend = endPrice >= startPrice ? 'up' : 'down';
    
    if (guess === actualTrend) {
      setResult('correct');
      setScore(s => s + 10 * (streak + 1));
      setStreak(s => s + 1);
    } else {
      setResult('wrong');
      setStreak(0);
    }
    
    setGameState('revealed');
    
    setTimeout(() => {
      setupNewRound();
    }, 2500);
  };
  
  const renderContent = () => {
    switch(gameState) {
        case 'loading':
            return (
                <div className="flex flex-col items-center justify-center h-60 bg-pro-surface">
                    <Loader className="w-8 h-8 text-pro-primary"/>
                    <p className="mt-3 text-pro-muted text-[10px] font-bold uppercase animate-pulse">Identifying Targets...</p>
                </div>
            );
        case 'guessing':
            return (
                <>
                    <div className="absolute top-3 left-4 text-pro-primary font-black text-xs bg-white px-2 py-1 rounded shadow-sm border border-pro-border">{gameData?.ticker}</div>
                    <div className="p-1 h-60 bg-pro-surface border-b border-pro-border">
                        <MiniChart visibleData={gameData?.visibleData || []} hiddenData={gameData?.hiddenData || []} revealed={false} />
                    </div>
                    <div className="flex justify-center space-x-3 p-4 bg-white">
                        <button onClick={() => handleGuess('up')} className="flex-1 py-3 bg-pro-green text-white rounded-xl font-black text-xs uppercase transition-all shadow-sm hover:brightness-110 active:scale-95">
                            LONG
                        </button>
                        <button onClick={() => handleGuess('down')} className="flex-1 py-3 bg-pro-red text-white rounded-xl font-black text-xs uppercase transition-all shadow-sm hover:brightness-110 active:scale-95">
                            SHORT
                        </button>
                    </div>
                </>
            );
        case 'revealed':
             return (
                <>
                    <div className="absolute top-3 left-4 text-pro-primary font-black text-xs bg-white px-2 py-1 rounded shadow-sm border border-pro-border">{gameData?.ticker}</div>
                    <div className="relative p-1 h-60 bg-pro-surface border-b border-pro-border">
                        <MiniChart visibleData={gameData?.visibleData || []} hiddenData={gameData?.hiddenData || []} revealed={true} />
                        {result && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                                <span className={`text-2xl font-black px-6 py-3 rounded-2xl shadow-heavy uppercase ${result === 'correct' ? 'text-pro-green bg-white' : 'text-pro-red bg-white'}`}>
                                    {result === 'correct' ? 'PROFIT' : 'LOSS'}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="h-[76px] flex items-center justify-center bg-white">
                        <p className="text-pro-muted text-[10px] font-bold uppercase animate-pulse">Calibrating next sequence...</p>
                    </div>
                </>
            );
    }
  };

  return (
      <div className="bg-white rounded-2xl overflow-hidden font-sans border border-pro-border">
        <header className="px-5 py-3 bg-pro-surface text-pro-text flex justify-between items-center text-[10px] font-black uppercase border-b border-pro-border">
            <h3 className="tracking-widest">MINI_QUANT_SIMULATOR</h3>
            <div className="flex space-x-6">
                <p>POINTS: <span className="text-pro-primary">{score}</span></p>
                <p>STREAK: <span className="text-pro-primary">{streak}</span></p>
            </div>
        </header>
        <div className="relative">
            {renderContent()}
        </div>
      </div>
  );
};

export default LoadingGame;