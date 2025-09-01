'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

export default function MarketHeatmap() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedSector, setSelectedSector] = useState('all');

  const sectors = [
    { id: 'all', name: 'All Sectors', color: 'text-white' },
    { id: 'tech', name: 'Technology', color: 'text-blue-400' },
    { id: 'finance', name: 'Financial', color: 'text-green-400' },
    { id: 'healthcare', name: 'Healthcare', color: 'text-purple-400' },
    { id: 'energy', name: 'Energy', color: 'text-yellow-400' },
    { id: 'consumer', name: 'Consumer', color: 'text-pink-400' }
  ];

  const generateHeatmapData = () => {
    const symbols = {
      tech: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'TSLA', 'AMD', 'NFLX', 'CRM', 'ORCL'],
      finance: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BRK.B', 'AXP', 'BLK', 'SCHW'],
      healthcare: ['JNJ', 'PFE', 'ABT', 'MRK', 'TMO', 'DHR', 'BMY', 'ABBV', 'LLY', 'UNH'],
      energy: ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'VLO', 'PSX', 'OXY', 'HAL'],
      consumer: ['AMZN', 'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'COST', 'KO']
    };

    const allSymbols = selectedSector === 'all' 
      ? Object.values(symbols).flat() 
      : symbols[selectedSector] || symbols.tech;

    return allSymbols.map(symbol => {
      const change = (Math.random() - 0.5) * 10; // -5% to +5%
      const volume = Math.random() * 100 + 10; // 10M to 110M
      const price = Math.random() * 500 + 20; // $20 to $520
      const marketCap = Math.random() * 2000 + 100; // 100B to 2.1T
      
      return {
        symbol,
        change: parseFloat(change.toFixed(2)),
        volume: parseFloat(volume.toFixed(1)),
        price: parseFloat(price.toFixed(2)),
        marketCap: parseFloat(marketCap.toFixed(1)),
        sector: Object.keys(symbols).find(key => symbols[key].includes(symbol)) || 'tech'
      };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  };

  useEffect(() => {
    setHeatmapData(generateHeatmapData());
    const interval = setInterval(() => {
      setHeatmapData(generateHeatmapData());
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [selectedSector]);

  const getHeatmapColor = (change) => {
    const intensity = Math.min(Math.abs(change) / 5, 1); // Normalize to 0-1
    if (change > 0) {
      return {
        bg: `rgba(16, 185, 129, ${intensity * 0.3})`,
        border: `rgba(16, 185, 129, ${intensity * 0.6})`,
        text: 'text-green-400'
      };
    } else {
      return {
        bg: `rgba(239, 68, 68, ${intensity * 0.3})`,
        border: `rgba(239, 68, 68, ${intensity * 0.6})`,
        text: 'text-red-400'
      };
    }
  };

  const getSize = (marketCap) => {
    if (marketCap > 1000) return 'large'; // > 1T
    if (marketCap > 500) return 'medium'; // 500B - 1T
    return 'small'; // < 500B
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="text-cyan-400" size={20} />
          Market Heatmap
        </h3>
        <div className="flex items-center gap-2">
          {sectors.map(sector => (
            <button
              key={sector.id}
              onClick={() => setSelectedSector(sector.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedSector === sector.id
                  ? 'bg-cyan-600 text-white'
                  : `trading-card ${sector.color} hover:bg-cyan-600/20`
              }`}
            >
              {sector.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {heatmapData.slice(0, 40).map((stock, index) => {
          const colors = getHeatmapColor(stock.change);
          const size = getSize(stock.marketCap);
          
          return (
            <div
              key={stock.symbol}
              className={`
                relative p-3 rounded-lg border transition-all duration-300 hover:scale-105 cursor-pointer group
                ${size === 'large' ? 'col-span-2 row-span-2' : size === 'medium' ? 'col-span-1' : ''}
              `}
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
                minHeight: size === 'large' ? '80px' : size === 'medium' ? '60px' : '50px'
              }}
              title={`${stock.symbol}: ${stock.change > 0 ? '+' : ''}${stock.change}% | $${stock.price} | ${stock.volume}M vol | ${stock.marketCap}B cap`}
            >
              <div className="flex flex-col h-full justify-between">
                <div className={`font-bold text-xs ticker-symbol ${colors.text}`}>
                  {stock.symbol}
                </div>
                <div className="flex flex-col items-end">
                  <div className={`font-bold text-sm market-data ${colors.text}`}>
                    {stock.change > 0 ? '+' : ''}{stock.change}%
                  </div>
                  {size !== 'small' && (
                    <div className="text-xs text-gray-400 market-data">
                      ${stock.price}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-2">
                <div className="text-white font-bold text-sm ticker-symbol">{stock.symbol}</div>
                <div className={`font-bold ${colors.text}`}>
                  {stock.change > 0 ? '+' : ''}{stock.change}%
                </div>
                <div className="text-gray-300 text-xs">${stock.price}</div>
                <div className="text-gray-400 text-xs">{stock.volume}M vol</div>
                <div className="text-gray-400 text-xs">{stock.marketCap}B cap</div>
              </div>

              {/* Movement indicator */}
              <div className={`absolute top-1 right-1 ${colors.text}`}>
                {stock.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              </div>

              {/* Activity indicator for high volume */}
              {stock.volume > 80 && (
                <div className="absolute bottom-1 left-1 text-cyan-400">
                  <Activity size={10} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500/30 border border-green-500/60 rounded"></div>
            <span>Positive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500/30 border border-red-500/60 rounded"></div>
            <span>Negative</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity size={12} className="text-cyan-400" />
            <span>High Volume</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live updates every 5s</span>
        </div>
      </div>
    </div>
  );
}