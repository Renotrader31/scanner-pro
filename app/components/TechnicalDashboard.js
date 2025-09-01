'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3, Target, Zap, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

const TechnicalDashboard = () => {
  const [technicalData, setTechnicalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const popularTickers = ['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'AMZN', 'MSFT', 'META', 'GOOGL', 'AMD'];

  useEffect(() => {
    fetchTechnicalData();
  }, [selectedTicker]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchTechnicalData, 30000); // Update every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedTicker]);

  const fetchTechnicalData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/technical-indicators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'comprehensive',
          ticker: selectedTicker
        })
      });

      const data = await response.json();
      if (data.success) {
        setTechnicalData(data.results);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching technical data:', error);
    }
    setLoading(false);
  };

  const getSignalColor = (signal) => {
    switch (signal?.toUpperCase()) {
      case 'STRONG_BULLISH':
        return 'text-green-400 bg-green-500/30 border-green-500/50';
      case 'BULLISH':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'STRONG_BEARISH':
        return 'text-red-400 bg-red-500/30 border-red-500/50';
      case 'BEARISH':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'OVERBOUGHT':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'OVERSOLD':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'NEUTRAL':
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSignalIcon = (signal) => {
    switch (signal?.toUpperCase()) {
      case 'STRONG_BULLISH':
      case 'BULLISH':
        return <TrendingUp size={16} />;
      case 'STRONG_BEARISH':
      case 'BEARISH':
        return <TrendingDown size={16} />;
      case 'OVERBOUGHT':
      case 'OVERSOLD':
        return <AlertTriangle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '$0.00';
    return `$${Number(price).toFixed(2)}`;
  };

  const formatPercent = (percent, decimals = 2) => {
    if (!percent || isNaN(percent)) return '0.00%';
    return `${Number(percent).toFixed(decimals)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="text-blue-400" size={32} />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">
            Real-Time Technical Analysis
          </span>
        </h2>
        
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <Clock size={14} />
              Updated {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600"
            />
            Auto-refresh
          </label>
          
          <button
            onClick={fetchTechnicalData}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Ticker Selection */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Ticker</label>
            <input
              type="text"
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
              className="px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white"
              placeholder="Enter ticker..."
              maxLength={10}
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {popularTickers.map(ticker => (
              <button
                key={ticker}
                onClick={() => setSelectedTicker(ticker)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  selectedTicker === ticker
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {ticker}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Technical Analysis Content */}
      {loading ? (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-12 border border-gray-700/50">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xl text-gray-300">Analyzing {selectedTicker} with real Polygon data...</span>
            </div>
          </div>
        </div>
      ) : !technicalData ? (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-8 border border-gray-700/50 text-center">
          <AlertTriangle className="mx-auto mb-4 text-yellow-400" size={48} />
          <p className="text-gray-400 text-lg">No technical data available for {selectedTicker}.</p>
          <p className="text-sm text-gray-500 mt-2">Try a different ticker or check if the market is open.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Price & Overall Signal */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Price */}
              <div className="text-center">
                <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Current Price</div>
                <div className="text-4xl font-bold text-white mb-2">
                  {formatPrice(technicalData.currentPrice)}
                </div>
                <div className="text-sm text-gray-400">
                  Live from Polygon API • {selectedTicker}
                </div>
              </div>

              {/* Overall Signal */}
              <div className="text-center">
                <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Overall Signal</div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold border ${getSignalColor(technicalData.overallSignal)}`}>
                  {getSignalIcon(technicalData.overallSignal)}
                  {technicalData.overallSignal}
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  {technicalData.confidence}% Confidence
                </div>
              </div>

              {/* Signal Distribution */}
              <div className="text-center">
                <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Signal Breakdown</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-green-400">Bullish:</span>
                    <span className="font-bold">{technicalData.signals.bullishWeight}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-400">Bearish:</span>
                    <span className="font-bold">{technicalData.signals.bearishWeight}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Indicators */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-400">
              <Target size={20} />
              Technical Indicators Breakdown
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SMA */}
              {technicalData.indicators.sma && (
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-300">Simple Moving Average (20)</h4>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-bold border ${getSignalColor(technicalData.indicators.sma.signal)}`}>
                      {getSignalIcon(technicalData.indicators.sma.signal)}
                      {technicalData.indicators.sma.signal}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">SMA Value:</span>
                      <span className="font-bold">{formatPrice(technicalData.indicators.sma.value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Distance:</span>
                      <span className="font-bold">{formatPercent(technicalData.indicators.sma.strength)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Weight:</span>
                      <span className="font-bold">20%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* EMA */}
              {technicalData.indicators.ema && (
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-300">Exponential Moving Average (20)</h4>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-bold border ${getSignalColor(technicalData.indicators.ema.signal)}`}>
                      {getSignalIcon(technicalData.indicators.ema.signal)}
                      {technicalData.indicators.ema.signal}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">EMA Value:</span>
                      <span className="font-bold">{formatPrice(technicalData.indicators.ema.value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Distance:</span>
                      <span className="font-bold">{formatPercent(technicalData.indicators.ema.strength)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Weight:</span>
                      <span className="font-bold">25%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* MACD */}
              {technicalData.indicators.macd && (
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-300">MACD (12,26,9)</h4>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-bold border ${getSignalColor(technicalData.indicators.macd.trend)}`}>
                      {getSignalIcon(technicalData.indicators.macd.trend)}
                      {technicalData.indicators.macd.trend}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">MACD Line:</span>
                      <span className="font-bold">{technicalData.indicators.macd.value.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Signal Line:</span>
                      <span className="font-bold">{technicalData.indicators.macd.signal.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Histogram:</span>
                      <span className={`font-bold ${technicalData.indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {technicalData.indicators.macd.histogram.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Weight:</span>
                      <span className="font-bold">30%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* RSI */}
              {technicalData.indicators.rsi && (
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-300">RSI (14)</h4>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-bold border ${getSignalColor(technicalData.indicators.rsi.signal)}`}>
                      {getSignalIcon(technicalData.indicators.rsi.signal)}
                      {technicalData.indicators.rsi.signal}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">RSI Value:</span>
                      <span className="font-bold">{technicalData.indicators.rsi.value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Level:</span>
                      <span className="font-bold">
                        {technicalData.indicators.rsi.value > 70 ? 'Overbought' : 
                         technicalData.indicators.rsi.value < 30 ? 'Oversold' : 'Normal'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Weight:</span>
                      <span className="font-bold">25%</span>
                    </div>
                  </div>
                  
                  {/* RSI Visual Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-700 rounded-full h-2 relative">
                      <div 
                        className={`h-2 rounded-full ${
                          technicalData.indicators.rsi.value > 70 ? 'bg-red-400' :
                          technicalData.indicators.rsi.value < 30 ? 'bg-blue-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${technicalData.indicators.rsi.value}%` }}
                      />
                      <div className="absolute top-0 left-[30%] w-0.5 h-2 bg-blue-600"></div>
                      <div className="absolute top-0 left-[70%] w-0.5 h-2 bg-red-600"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>30</span>
                      <span>70</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Signal Summary */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-400">
              <Zap size={20} />
              AI Analysis Summary
            </h3>
            
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-gray-300 leading-relaxed">
                {technicalData.signals.summary}
              </p>
              
              <div className="mt-4 space-y-2">
                {technicalData.signals.individual.map((signal, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-gray-400">{signal.indicator}:</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getSignalColor(signal.signal)}`}>
                        {signal.signal}
                      </span>
                      <span className="text-sm text-gray-300">
                        {signal.strength.toFixed(2)}% • {(signal.weight * 100).toFixed(0)}% weight
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicalDashboard;