import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import type { OHLCV } from '../types';

interface StockChartProps {
  data: OHLCV[];
  ticker: string;
}

const StockChart: React.FC<StockChartProps> = ({ data, ticker }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#000000' },
        textColor: '#ff9900', // BB Orange
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
            color: '#d4d4d4',
            width: 1,
            style: 3,
        },
        horzLine: {
            color: '#d4d4d4',
            width: 1,
            style: 3,
        },
      },
      timeScale: {
        borderColor: '#333333',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#333333',
      },
    });

    // Candlestick Series - High Contrast
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#000000', // Hollow body for up
      downColor: '#ff3333', // Filled red for down
      borderUpColor: '#00ff00', // Neon green border
      borderDownColor: '#ff3333',
      wickUpColor: '#00ff00',
      wickDownColor: '#ff3333',
    });

    const chartData = data.map((d) => ({
      time: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(chartData);

    // Volume Series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set as an overlay
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, 
        bottom: 0,
      },
    });

    const volumeData = data.map((d) => ({
      time: d.date,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 51, 51, 0.3)',
    }));

    volumeSeries.setData(volumeData);

    // Fit content
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col bg-bb-black">
      <div ref={chartContainerRef} className="w-full flex-grow" />
    </div>
  );
};

export default StockChart;