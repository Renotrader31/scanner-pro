'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Target, AlertTriangle, Clock, DollarSign, BarChart3, Star, Zap, Shield, Activity } from 'lucide-react';

const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [mlAnalysis, setMLAnalysis] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState('SPY');
  const [riskLevel, setRiskLevel] = useState('moderate');
  const [accountSize, setAccountSize] = useState(100000);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const watchedTickers = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'AMD'];

  // Safe number formatting helpers
  const formatPrice = (price) => {
    if (!price || isNaN(price) || price === null || price === undefined) return '0.00';
    return Number(price).toFixed(2);
  };

  const formatPercent = (percent, decimals = 1) => {
    if (!percent || isNaN(percent) || percent === null || percent === undefined) return '0.0';
    return Number(percent).toFixed(decimals);
  };

  const formatNumber = (num, decimals = 0) => {
    if (!num || isNaN(num) || num === null || num === undefined) return '0';
    return Number(num).toFixed(decimals);
  };

  useEffect(() => {
    fetchAIRecommendations();
    
    // Set up auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchAIRecommendations();
    }, 120000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedTicker, riskLevel, accountSize]);

  const fetchAIRecommendations = async () => {
    setLoading(true);
    try {
      // First get market data
      const marketRes = await fetch(`/api/polygon?endpoint=/v2/aggs/ticker/${selectedTicker}/prev`);
      const marketData = await marketRes.json();
      
      if (!marketData.results?.[0]) {
        throw new Error('No market data available');
      }

      const stockData = marketData.results[0];
      const formattedMarketData = {
        ticker: selectedTicker,
        price: stockData.c,
        change: formatPercent(((stockData.c - stockData.o) / stockData.o * 100), 2),
        volume: stockData.v,
        high: stockData.h,
        low: stockData.l
      };

      // Get short interest data if available
      let shortData = null;
      try {
        const shortRes = await fetch(`/api/ortex?ticker=${selectedTicker}`);
        const shortResponse = await shortRes.json();
        shortData = shortResponse.data;
      } catch (error) {
        console.log('Short data not available for', selectedTicker);
      }

      // Get ML Analysis
      const mlRes = await fetch('/api/ml-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: selectedTicker,
          marketData: formattedMarketData,
          shortData
        })
      });

      const mlResponse = await mlRes.json();
      if (!mlResponse.success) {
        throw new Error('ML analysis failed');
      }

      setMLAnalysis(mlResponse.analysis);

      // Get Recommendations
      const recRes = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: selectedTicker,
          marketData: formattedMarketData,
          mlAnalysis: mlResponse.analysis,
          accountSize,
          riskLevel
        })
      });

      const recResponse = await recRes.json();
      if (!recResponse.success) {
        throw new Error('Recommendations generation failed');
      }

      setRecommendations(recResponse.recommendations || []);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      // Set fallback recommendations
      setRecommendations([]);
      setMLAnalysis({});
    }
    setLoading(false);
  };

  const getDirectionIcon = (direction) => {
    switch (direction?.toLowerCase()) {
      case 'bullish': return <TrendingUp className="text-green-400" size={16} />;
      case 'bearish': return <TrendingDown className="text-red-400" size={16} />;
      default: return <Activity className="text-gray-400" size={16} />;
    }
  };

  const getDirectionColor = (direction) => {
    switch (direction?.toLowerCase()) {
      case 'bullish': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'bearish': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getTradeTypeColor = (tradeType) => {
    const colors = {
      'stock_long': 'bg-green-500/20 text-green-400 border-green-500/30',
      'stock_short': 'bg-red-500/20 text-red-400 border-red-500/30',
      'call_buy': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'put_buy': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'straddle': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[tradeType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatTradeType = (tradeType) => {
    const formats = {
      'stock_long': 'Stock Long',
      'stock_short': 'Stock Short', 
      'call_buy': 'Buy Calls',
      'put_buy': 'Buy Puts',
      'straddle': 'Straddle'
    };
    return formats[tradeType] || tradeType;
  };

  const getRatingColor = (rating) => {
    if (['A+', 'A'].includes(rating)) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (['B+', 'B'].includes(rating)) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    if (['C+', 'C'].includes(rating)) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-blue-400';
    if (confidence >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="text-pink-400" size={32} />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500">
            AI Trading Engine
          </span>
        </h2>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <Clock size={14} />
              Updated {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={fetchAIRecommendations}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Zap size={16} />
            {loading ? 'Analyzing...' : 'Refresh AI'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Enter Any Ticker</label>
            <input
              type="text"
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
              placeholder="Enter ticker (e.g., AAPL, TSLA, SPY...)"
              maxLength={10}
            />
            <p className="text-xs text-gray-400 mt-1">Enter any stock ticker for AI analysis</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Risk Level</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
              <option value="speculation">Speculation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Account Size ($)</label>
            <input
              type="number"
              value={accountSize}
              onChange={(e) => setAccountSize(parseInt(e.target.value) || 100000)}
              className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
              min="1000"
              max="10000000"
              step="1000"
            />
          </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">&nbsp;</label>
            <button
              onClick={fetchAIRecommendations}
              disabled={loading || !selectedTicker.trim()}
              className={`w-full px-4 py-2 rounded-lg font-bold transition-all ${
                loading || !selectedTicker.trim()
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
              }`}
            >
              {loading ? 'Analyzing...' : '🔍 Analyze'}
            </button>
        </div>
      </div>

      {/* ML Analysis Overview */}
      {mlAnalysis.ml_analysis && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-blue-500/20">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
            <BarChart3 size={20} />
            ML Market Analysis - {selectedTicker}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Price Prediction */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-300">Price Direction</h4>
                {getDirectionIcon(mlAnalysis.ml_analysis.price_prediction?.direction)}
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getDirectionColor(mlAnalysis.ml_analysis.price_prediction?.direction)}`}>
                {mlAnalysis.ml_analysis.price_prediction?.direction || 'NEUTRAL'}
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-400">
                <div>Probability: {formatPercent((mlAnalysis.ml_analysis.price_prediction?.probability || 0) * 100)}%</div>
                <div className={`${getConfidenceColor(mlAnalysis.ml_analysis.price_prediction?.confidence || 0)}`}>
                  Confidence: {formatPercent((mlAnalysis.ml_analysis.price_prediction?.confidence || 0) * 100)}%
                </div>
              </div>
            </div>

            {/* Volatility Forecast */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-300">Volatility</h4>
                <Activity className="text-orange-400" size={16} />
              </div>
              <div className="text-orange-400 font-bold">
                {mlAnalysis.ml_analysis.volatility_forecast?.prediction || 'STABLE'}
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-400">
                <div>IV Rank: {formatNumber(mlAnalysis.ml_analysis.volatility_forecast?.current_iv_rank || 0)}%</div>
                <div>Expected Change: {formatPercent((mlAnalysis.ml_analysis.volatility_forecast?.expected_vol_change || 0) * 100)}%</div>
              </div>
            </div>

            {/* Composite Score */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-300">Overall Rating</h4>
                <Star className="text-yellow-400" size={16} />
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getRatingColor(mlAnalysis.ml_analysis.composite_score?.rating)}`}>
                {mlAnalysis.ml_analysis.composite_score?.rating || 'C'}
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-400">
                <div className={`${getConfidenceColor(mlAnalysis.ml_analysis.composite_score?.confidence_score || 0)}`}>
                  Score: {formatPercent((mlAnalysis.ml_analysis.composite_score?.confidence_score || 0) * 100)}%
                </div>
                <div>Risk Level: {mlAnalysis.ml_analysis.composite_score?.opportunity_level || 'MEDIUM'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400">
          <Target size={20} />
          AI Trade Recommendations ({recommendations.length})
        </h3>

        {loading ? (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-8 border border-gray-700/50">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-6 w-6 text-purple-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-gray-300">Analyzing market data and generating AI recommendations...</span>
              </div>
            </div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-8 border border-gray-700/50 text-center">
            <AlertTriangle className="mx-auto mb-4 text-yellow-400" size={48} />
            <p className="text-gray-400 text-lg">No high-confidence recommendations available at this time.</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting the risk level or select a different ticker.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={rec.id || index} className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getTradeTypeColor(rec.trade_type)}`}>
                      {formatTradeType(rec.trade_type)}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold border ${getDirectionColor(rec.direction)}`}>
                      {rec.direction}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold border ${getRatingColor(rec.ml_rating)}`}>
                      {rec.ml_rating}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getConfidenceColor(rec.confidence_score)}`}>
                      {formatPercent((rec.confidence_score || 0) * 100)}%
                    </div>
                    <div className="text-xs text-gray-400">Confidence</div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-bold text-lg mb-2">{rec.strategy_description}</h4>
                  <div className="text-gray-400 space-y-1">
                    {rec.reasons?.map((reason, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                        <span className="text-sm">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Entry Price</div>
                    <div className="font-bold text-green-400">${formatPrice(rec.entry_price)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Target</div>
                    <div className="font-bold text-green-400">${formatPrice(rec.target_price)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Stop Loss</div>
                    <div className="font-bold text-red-400">${formatPrice(rec.stop_loss)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Position Size</div>
                    <div className="font-bold text-white">
                      {rec.trade_type?.includes('stock') ? `${rec.position_size} shares` : `${rec.position_size} contracts`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="text-red-400" size={14} />
                    <span className="text-gray-400">Max Risk:</span>
                    <span className="font-bold text-red-400">${formatNumber(rec.max_risk)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-green-400" size={14} />
                    <span className="text-gray-400">Max Reward:</span>
                    <span className="font-bold text-green-400">${formatNumber(rec.max_reward)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-blue-400" size={14} />
                    <span className="text-gray-400">R:R Ratio:</span>
                    <span className="font-bold text-blue-400">{formatNumber(rec.risk_reward_ratio, 1)}:1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="text-purple-400" size={14} />
                    <span className="text-gray-400">Win Prob:</span>
                    <span className="font-bold text-purple-400">{formatNumber((rec.probability_of_profit || 0) * 100)}%</span>
                  </div>
                </div>

                {rec.time_horizon && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                    <Clock size={14} />
                    <span>Time Horizon: {rec.time_horizon}</span>
                    {rec.expiry_date && (
                      <span className="ml-2">• Expiry: {rec.expiry_date}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;