'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Target, Award, BarChart3, Clock, DollarSign, Activity, CheckCircle, AlertCircle } from 'lucide-react';

const TradeFeedback = () => {
  const [mlMetrics, setMLMetrics] = useState({});
  const [activeTrades, setActiveTrades] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [newTrade, setNewTrade] = useState({
    ticker: '',
    trade_type: 'stock_long',
    direction: 'BULLISH',
    entry_price: '',
    position_size: '',
    target_price: '',
    stop_loss: '',
    confidence_score: 0.7,
    ml_predictions: {}
  });

  useEffect(() => {
    fetchMLMetrics();
    fetchTrades();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMLMetrics();
      fetchTrades();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMLMetrics = async () => {
    try {
      const response = await fetch('/api/trade-feedback?type=summary');
      const data = await response.json();
      if (data.success) {
        setMLMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching ML metrics:', error);
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/trade-feedback?type=trades&limit=20');
      const data = await response.json();
      if (data.success) {
        setActiveTrades(data.trades.filter(t => t.status === 'ACTIVE'));
        setRecentTrades(data.trades.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
    setLoading(false);
  };

  const submitTrade = async () => {
    try {
      const response = await fetch('/api/trade-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submit_trade',
          ...newTrade,
          entry_price: parseFloat(newTrade.entry_price),
          position_size: parseInt(newTrade.position_size),
          target_price: parseFloat(newTrade.target_price),
          stop_loss: parseFloat(newTrade.stop_loss)
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowTradeModal(false);
        setNewTrade({
          ticker: '', trade_type: 'stock_long', direction: 'BULLISH',
          entry_price: '', position_size: '', target_price: '', stop_loss: '',
          confidence_score: 0.7, ml_predictions: {}
        });
        fetchTrades();
        fetchMLMetrics();
      }
    } catch (error) {
      console.error('Error submitting trade:', error);
    }
  };

  const updateTrade = async (tradeId, updates) => {
    try {
      const response = await fetch('/api/trade-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_trade',
          trade_id: tradeId,
          ...updates
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchTrades();
        fetchMLMetrics();
      }
    } catch (error) {
      console.error('Error updating trade:', error);
    }
  };

  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case 'BIG_WIN': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'WIN': return 'text-green-300 bg-green-500/15 border-green-500/25';
      case 'BREAKEVEN': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'LOSS': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'BIG_LOSS': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getWinRateColor = (rate) => {
    if (rate >= 70) return 'text-green-400';
    if (rate >= 50) return 'text-blue-400';
    if (rate >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatPercent = (num) => `${num?.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="text-purple-400" size={32} />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            ML Performance Tracker
          </span>
        </h2>
        <button
          onClick={() => setShowTradeModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all flex items-center gap-2"
        >
          <Target size={16} />
          Log Trade
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-gray-800/50 backdrop-blur-md rounded-lg p-2">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'performance', label: 'Performance', icon: BarChart3 },
          { id: 'trades', label: 'Active Trades', icon: Clock },
          { id: 'history', label: 'Trade History', icon: Award }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              selectedTab === tab.id 
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Overall Win Rate</span>
                <Award className="text-green-400" size={20} />
              </div>
              <div className={`text-3xl font-bold ${getWinRateColor(mlMetrics.summary?.winRate || 0)}`}>
                {formatPercent(mlMetrics.summary?.winRate || 0)}
              </div>
              <div className="text-sm text-gray-500">
                {mlMetrics.summary?.totalTrades || 0} total trades
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">ML Accuracy</span>
                <Brain className="text-blue-400" size={20} />
              </div>
              <div className={`text-3xl font-bold text-blue-400`}>
                {formatPercent(mlMetrics.summary?.avgConfidenceAccuracy || 50)}
              </div>
              <div className="text-sm text-gray-500">Confidence vs Reality</div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Active Trades</span>
                <Activity className="text-purple-400" size={20} />
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {activeTrades.length}
              </div>
              <div className="text-sm text-gray-500">Currently monitoring</div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Last Trade</span>
                <Clock className="text-yellow-400" size={20} />
              </div>
              <div className="text-lg font-bold text-yellow-400">
                {mlMetrics.summary?.lastTradeDate ? 
                  new Date(mlMetrics.summary.lastTradeDate).toLocaleDateString() : 'None'
                }
              </div>
              <div className="text-sm text-gray-500">Most recent entry</div>
            </div>
          </div>

          {/* Model Performance */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
              <BarChart3 size={20} />
              Model Performance Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(mlMetrics.modelPerformance || {}).map(([model, perf]) => (
                <div key={model} className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-300 capitalize">
                      {model.replace('_', ' ')}
                    </h4>
                    <Activity className="text-cyan-400" size={16} />
                  </div>
                  <div className={`text-2xl font-bold ${getWinRateColor(perf.accuracy * 100)}`}>
                    {formatPercent(perf.accuracy * 100)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {perf.totalPredictions} predictions
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Strategies */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
              <Target size={20} />
              Top Performing Strategies
            </h3>
            <div className="space-y-3">
              {mlMetrics.topStrategies?.slice(0, 5).map((strategy, index) => (
                <div key={strategy.strategy} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 
                      index === 1 ? 'bg-gray-500/20 text-gray-400' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-600/20 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white capitalize">
                        {strategy.strategy.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-400">
                        {strategy.totalTrades} trades
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getWinRateColor(strategy.winRate)}`}>
                      {formatPercent(strategy.winRate)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Avg: {strategy.avgReturn?.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Trades Tab */}
      {selectedTab === 'trades' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-purple-400">
            Active Trades ({activeTrades.length})
          </h3>
          
          {activeTrades.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-8 border border-gray-700/50 text-center">
              <Clock className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-400">No active trades to monitor</p>
              <button
                onClick={() => setShowTradeModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Log Your First Trade
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTrades.map(trade => (
                <div key={trade.trade_id} className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">{trade.ticker}</h4>
                      <p className="text-gray-400 capitalize">{trade.trade_type.replace('_', ' ')}</p>
                      <p className={`text-sm ${trade.direction === 'BULLISH' ? 'text-green-400' : trade.direction === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {trade.direction}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Entry Date</div>
                      <div className="text-white">{new Date(trade.entry_date).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-400">Entry Price</div>
                      <div className="font-bold text-white">${trade.entry_price?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Target</div>
                      <div className="font-bold text-green-400">${trade.target_price?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Stop Loss</div>
                      <div className="font-bold text-red-400">${trade.stop_loss?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Position</div>
                      <div className="font-bold text-white">{trade.position_size}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Current Price"
                      className="flex-1 px-3 py-2 bg-gray-900/50 rounded border border-gray-600 text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updateTrade(trade.trade_id, { 
                            current_price: parseFloat(e.target.value)
                          });
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const price = prompt('Enter exit price:');
                        if (price) {
                          updateTrade(trade.trade_id, { 
                            exit_price: parseFloat(price), 
                            status: 'CLOSED' 
                          });
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                    >
                      Close Trade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trade Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-white">Log New Trade</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Ticker</label>
                <input
                  type="text"
                  value={newTrade.ticker}
                  onChange={(e) => setNewTrade({...newTrade, ticker: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 bg-gray-900/50 rounded border border-gray-600 text-white"
                  placeholder="AAPL"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Trade Type</label>
                <select
                  value={newTrade.trade_type}
                  onChange={(e) => setNewTrade({...newTrade, trade_type: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-900/50 rounded border border-gray-600 text-white"
                >
                  <option value="stock_long">Stock Long</option>
                  <option value="stock_short">Stock Short</option>
                  <option value="call_buy">Buy Calls</option>
                  <option value="put_buy">Buy Puts</option>
                  <option value="covered_call">Covered Call</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.entry_price}
                    onChange={(e) => setNewTrade({...newTrade, entry_price: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded border border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Position Size</label>
                  <input
                    type="number"
                    value={newTrade.position_size}
                    onChange={(e) => setNewTrade({...newTrade, position_size: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded border border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Target Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.target_price}
                    onChange={(e) => setNewTrade({...newTrade, target_price: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded border border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Stop Loss</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.stop_loss}
                    onChange={(e) => setNewTrade({...newTrade, stop_loss: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded border border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  ML Confidence: {(newTrade.confidence_score * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={newTrade.confidence_score}
                  onChange={(e) => setNewTrade({...newTrade, confidence_score: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTradeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitTrade}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Log Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeFeedback;