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
        const revealedColor = trendUp ? 'stroke-bb-green' : 'stroke-bb-red';

        return { visiblePoints, hiddenPoints, separatorX, revealedColor };
    }, [visibleData, hiddenData, width, height]);

    if (!chartData) return null;

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <rect width="100%" height="100%" fill="#000000" />
            <polyline fill="none" stroke="#ff9900" strokeWidth="2" points={chartData.visiblePoints} />
            {revealed && (
                <polyline fill="none" className={chartData.revealedColor} strokeWidth="2" points={chartData.hiddenPoints} />
            )}
            <line
                x1={chartData.separatorX}
                y1="0"
                x2={chartData.separatorX}
                y2={height}
                stroke="#333333"
                strokeWidth="1"
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
                const hiddenPartLength = 20;
                const visiblePartLength = 100;
                const gameSegmentLength = visiblePartLength + hiddenPartLength;

                const segmentEndIndex = totalLength;
                const segmentStartIndex = Math.max(0, segmentEndIndex - gameSegmentLength);

                if (segmentEndIndex - segmentStartIndex === gameSegmentLength) {
                    const gameSlice = stockData.historical.slice(segmentStartIndex, segmentEndIndex);
                    const visibleData = gameSlice.slice(0, visiblePartLength);
                    const hiddenData = gameSlice.slice(visiblePartLength);

                    setGameData({ ticker: randomTicker, visibleData, hiddenData });
                    setGameState('guessing');
                    fetched = true;
                }
            }
        } catch (error) {
            console.error("Game data fetch failed, trying another ticker.", error);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
  }, []);

  useEffect(() => {
    setupNewRound();
  }, []);

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
    }, 3000);
  };
  
  const renderContent = () => {
    switch(gameState) {
        case 'loading':
            return (
                <div className="flex flex-col items-center justify-center h-64 bg-bb-black">
                    <Loader className="w-6 h-6 text-bb-orange"/>
                    <p className="mt-2 text-bb-muted text-xs uppercase animate-pulse">Initializing Round...</p>
                </div>
            );
        case 'guessing':
            return (
                <>
                    <div className="absolute top-2 left-4 text-bb-orange font-bold text-sm bg-bb-dark px-2">{gameData?.ticker}</div>
                    <div className="p-1 h-64 bg-bb-black border-b border-bb-border">
                        <MiniChart visibleData={gameData?.visibleData || []} hiddenData={gameData?.hiddenData || []} revealed={false} />
                    </div>
                    <div className="flex justify-center space-x-1 p-2 bg-bb-dark">
                        <button onClick={() => handleGuess('up')} className="flex-1 py-2 bg-bb-green/20 hover:bg-bb-green text-bb-green hover:text-black border border-bb-green font-bold text-sm uppercase transition-colors">
                            [ BUY ]
                        </button>
                        <button onClick={() => handleGuess('down')} className="flex-1 py-2 bg-bb-red/20 hover:bg-bb-red text-bb-red hover:text-black border border-bb-red font-bold text-sm uppercase transition-colors">
                            [ SELL ]
                        </button>
                    </div>
                </>
            );
        case 'revealed':
             return (
                <>
                    <div className="absolute top-2 left-4 text-bb-orange font-bold text-sm bg-bb-dark px-2">{gameData?.ticker}</div>
                    <div className="relative p-1 h-64 bg-bb-black border-b border-bb-border">
                        <MiniChart visibleData={gameData?.visibleData || []} hiddenData={gameData?.hiddenData || []} revealed={true} />
                        {result && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                <span className={`text-2xl font-bold px-4 py-2 border-2 uppercase ${result === 'correct' ? 'border-bb-green text-bb-green bg-black' : 'border-bb-red text-bb-red bg-black'}`}>
                                    {result === 'correct' ? '>> PROFIT <<' : '>> LOSS <<'}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="h-[58px] flex items-center justify-center bg-bb-dark">
                        <p className="text-bb-muted text-xs uppercase animate-pulse">Loading Next Ticker...</p>
                    </div>
                </>
            );
    }
  };

  return (
      <div className="bg-bb-black border border-bb-orange shadow-lg w-full font-mono">
        <header className="px-3 py-1 bg-bb-orange text-bb-black flex justify-between items-center text-xs font-bold uppercase">
            <h3>SIM_TRADER.EXE</h3>
            <div className="flex space-x-4">
                <p>PNL: <span className="text-black">{score}</span></p>
                <p>STREAK: <span className="text-black">{streak}</span></p>
            </div>
        </header>
        <div className="relative">
            {renderContent()}
        </div>
      </div>
  );
};

export default LoadingGame;