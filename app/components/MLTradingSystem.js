'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, TrendingDown, Target, Award, BarChart3, Clock, 
  DollarSign, Activity, CheckCircle, AlertCircle, Plus, X, Edit3,
  Percent, Shield, Zap, Settings, RotateCcw, ChevronUp, ChevronDown,
  TrendingDown as Loss, TrendingUp as Profit, Info
} from 'lucide-react';

const MLTradingSystem = () => {
  // Core state
  const [mlMetrics, setMLMetrics] = useState({});
  const [activeTrades, setActiveTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('positions');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  
  // Enhanced trade form with all features from TradingManager
  const [newTrade, setNewTrade] = useState({
    ticker: '',
    trade_type: 'stock_long',
    strategy_name: '',
    direction: 'BULLISH',
    position_size: '',
    entry_price: '',
    target_price: '',
    stop_loss: '',
    max_risk: '',
    max_reward: '',
    confidence_score: 0.7,
    profit_targets: [
      { percentage: 25, price: '', hit: false },
      { percentage: 50, price: '', hit: false },
      { percentage: 75, price: '', hit: false }
    ],
    stop_type: 'fixed',
    trailing_amount: '',
    time_stop_days: '',
    notes: '',
    ml_predictions: {},
    // Options specific fields
    strike_price: '',
    expiration_date: '',
    option_type: 'call',
    premium_paid: '',
    contracts: '',
    // Multi-leg support
    legs: []
  });

  // Trade types with descriptions
  const tradeTypes = {
    'stock_long': { name: 'Stock Long', description: 'Buy shares expecting price increase', legs: 1 },
    'stock_short': { name: 'Stock Short', description: 'Short sell expecting price decrease', legs: 1 },
    'call_buy': { name: 'Buy Calls', description: 'Long call options for bullish outlook', legs: 1 },
    'put_buy': { name: 'Buy Puts', description: 'Long put options for bearish outlook', legs: 1 },
    'covered_call': { name: 'Covered Call', description: 'Stock + short call for income', legs: 2 },
    'protective_put': { name: 'Protective Put', description: 'Stock + long put for protection', legs: 2 },
    'bull_call_spread': { name: 'Bull Call Spread', description: 'Buy call + sell higher call', legs: 2 },
    'bear_put_spread': { name: 'Bear Put Spread', description: 'Buy put + sell lower put', legs: 2 },
    'iron_condor': { name: 'Iron Condor', description: 'Neutral strategy with 4 legs', legs: 4 },
    'long_straddle': { name: 'Long Straddle', description: 'Buy call + put at same strike', legs: 2 },
    'short_strangle': { name: 'Short Strangle', description: 'Sell OTM call + put', legs: 2 }
  };

  // Stop loss types
  const stopTypes = {
    'fixed': 'Fixed Stop Loss',
    'trailing': 'Trailing Stop',
    'time_based': 'Time-Based Stop'
  };

  useEffect(() => {
    fetchMLMetrics();
    fetchAllTrades();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMLMetrics();
      fetchAllTrades();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMLMetrics = async () => {
    try {
      const response = await fetch('/api/trade-feedback?type=ml_metrics');
      const data = await response.json();
      if (data.success) {
        setMLMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching ML metrics:', error);
    }
  };

  const fetchAllTrades = async () => {
    try {
      const response = await fetch('/api/trade-feedback?type=all_trades');
      const data = await response.json();
      if (data.success) {
        setActiveTrades(data.trades.filter(t => t.status === 'ACTIVE' || t.status === 'OPEN'));
        setClosedTrades(data.trades.filter(t => t.status === 'CLOSED'));
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
    setLoading(false);
  };

  const calculateProfitTargets = () => {
    if (!newTrade.entry_price || !newTrade.target_price) return;
    
    const entry = parseFloat(newTrade.entry_price);
    const target = parseFloat(newTrade.target_price);
    const diff = target - entry;
    
    setNewTrade(prev => ({
      ...prev,
      profit_targets: [
        { percentage: 25, price: (entry + diff * 0.25).toFixed(2), hit: false },
        { percentage: 50, price: (entry + diff * 0.50).toFixed(2), hit: false },
        { percentage: 75, price: (entry + diff * 0.75).toFixed(2), hit: false }
      ]
    }));
  };

  const submitTrade = async () => {
    console.log('Submitting trade to ML system:', newTrade);
    
    // Validate required fields
    if (!newTrade.ticker || !newTrade.entry_price || !newTrade.position_size) {
      alert('Please fill in required fields: Ticker, Entry Price, and Position Size');
      return;
    }
    
    try {
      const tradeData = {
        action: 'ml_enhanced_trade',
        ...newTrade,
        entry_price: parseFloat(newTrade.entry_price) || 0,
        position_size: parseInt(newTrade.position_size) || 0,
        target_price: parseFloat(newTrade.target_price) || 0,
        stop_loss: parseFloat(newTrade.stop_loss) || 0,
        max_risk: parseFloat(newTrade.max_risk) || 0,
        max_reward: parseFloat(newTrade.max_reward) || 0,
        timestamp: Date.now(),
        ml_metadata: {
          model_version: '2.0',
          confidence_score: newTrade.confidence_score,
          predicted_outcome: newTrade.confidence_score > 0.7 ? 'WIN' : 'NEUTRAL',
          risk_score: calculateRiskScore()
        }
      };

      const response = await fetch('/api/trade-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
      });

      const data = await response.json();
      console.log('ML Trade response:', data);
      
      if (data.success) {
        alert('Trade logged successfully! ML system is learning from this trade.');
        setShowTradeModal(false);
        resetTradeForm();
        fetchAllTrades();
        fetchMLMetrics();
      } else {
        alert(`Failed to log trade: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting trade:', error);
      alert('Error submitting trade. Please try again.');
    }
  };

  const updateTradePrice = async (tradeId, currentPrice) => {
    try {
      const response = await fetch('/api/trade-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_price',
          trade_id: tradeId,
          current_price: parseFloat(currentPrice),
          timestamp: Date.now()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchAllTrades();
      }
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const closeTrade = async (tradeId, exitPrice) => {
    try {
      const response = await fetch('/api/trade-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close_trade',
          trade_id: tradeId,
          exit_price: parseFloat(exitPrice),
          status: 'CLOSED',
          timestamp: Date.now()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Trade closed! ML system learning from outcome.');
        fetchAllTrades();
        fetchMLMetrics();
      }
    } catch (error) {
      console.error('Error closing trade:', error);
    }
  };

  const calculateRiskScore = () => {
    const riskFactors = [];
    
    if (newTrade.stop_loss && newTrade.entry_price) {
      const stopDistance = Math.abs(parseFloat(newTrade.entry_price) - parseFloat(newTrade.stop_loss));
      const riskPercent = (stopDistance / parseFloat(newTrade.entry_price)) * 100;
      if (riskPercent > 5) riskFactors.push(0.3);
      if (riskPercent > 10) riskFactors.push(0.5);
    }
    
    if (newTrade.trade_type.includes('short')) riskFactors.push(0.2);
    if (newTrade.trade_type.includes('naked')) riskFactors.push(0.4);
    
    return Math.min(1, riskFactors.reduce((a, b) => a + b, 0));
  };

  const resetTradeForm = () => {
    setNewTrade({
      ticker: '', trade_type: 'stock_long', strategy_name: '', direction: 'BULLISH',
      position_size: '', entry_price: '', target_price: '', stop_loss: '',
      max_risk: '', max_reward: '', confidence_score: 0.7,
      profit_targets: [
        { percentage: 25, price: '', hit: false },
        { percentage: 50, price: '', hit: false },
        { percentage: 75, price: '', hit: false }
      ],
      stop_type: 'fixed', trailing_amount: '', time_stop_days: '', notes: '',
      ml_predictions: {}, strike_price: '', expiration_date: '', option_type: 'call',
      premium_paid: '', contracts: '', legs: []
    });
  };

  const calculatePnL = (trade) => {
    if (!trade.current_price || !trade.entry_price) return 0;
    const pnl = (trade.current_price - trade.entry_price) * trade.position_size;
    return trade.direction === 'BEARISH' ? -pnl : pnl;
  };

  const calculatePnLPercent = (trade) => {
    if (!trade.current_price || !trade.entry_price) return 0;
    const percent = ((trade.current_price - trade.entry_price) / trade.entry_price) * 100;
    return trade.direction === 'BEARISH' ? -percent : percent;
  };

  const formatNumber = (num, decimals = 2) => {
    return typeof num === 'number' ? num.toFixed(decimals) : '0.00';
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(num || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header with ML Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="text-purple-400 animate-pulse" size={32} />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              ML Trading System
            </span>
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-lg border border-green-500/50">
            <Activity size={16} className="text-green-400" />
            <span className="text-sm text-green-400">Learning Active</span>
          </div>
        </div>
        <button
          onClick={() => {
            console.log('Opening trade modal');
            setShowTradeModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all flex items-center gap-2 font-bold cursor-pointer"
          type="button"
        >
          <Plus size={20} />
          Enter Trade
        </button>
      </div>

      {/* ML Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Win Rate</span>
            <TrendingUp size={16} className="text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(mlMetrics.summary?.winRate || 0, 1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ML Confidence: {formatNumber((mlMetrics.summary?.avgConfidenceAccuracy || 50), 0)}%
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Trades</span>
            <Activity size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {activeTrades.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total Value: {formatCurrency(activeTrades.reduce((sum, t) => sum + (t.position_size * t.entry_price), 0))}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total P&L</span>
            <DollarSign size={16} className="text-yellow-400" />
          </div>
          <div className={`text-2xl font-bold ${
            activeTrades.reduce((sum, t) => sum + calculatePnL(t), 0) >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(activeTrades.reduce((sum, t) => sum + calculatePnL(t), 0))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg Trade: {formatCurrency(activeTrades.length > 0 ? 
              activeTrades.reduce((sum, t) => sum + calculatePnL(t), 0) / activeTrades.length : 0)}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">ML Accuracy</span>
            <Brain size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(mlMetrics.modelPerformance?.accuracy || 0, 1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {mlMetrics.summary?.totalTrades || 0} trades analyzed
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        {['positions', 'history', 'analytics', 'learning'].map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 font-medium transition-colors ${
              selectedTab === tab
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Active Positions Tab */}
      {selectedTab === 'positions' && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50">
          <div className="p-4 border-b border-gray-700/50">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity size={20} />
              Active Positions
            </h3>
          </div>
          
          {activeTrades.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Target size={48} className="mx-auto mb-4 opacity-50" />
              <p>No active trades. Click "Enter Trade" to start!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left p-4 text-gray-400">Position</th>
                    <th className="text-left p-4 text-gray-400">Entry</th>
                    <th className="text-left p-4 text-gray-400">Current</th>
                    <th className="text-left p-4 text-gray-400">P&L</th>
                    <th className="text-left p-4 text-gray-400">Target/Stop</th>
                    <th className="text-left p-4 text-gray-400">ML Score</th>
                    <th className="text-left p-4 text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrades.map(trade => (
                    <tr key={trade.trade_id} className="border-t border-gray-700/50 hover:bg-gray-700/20">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-bold text-white">{trade.ticker}</div>
                            <div className="text-xs text-gray-400">
                              {trade.position_size} shares • {trade.trade_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-white">{formatCurrency(trade.entry_price)}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(trade.entry_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Update price"
                          className="w-24 px-2 py-1 bg-gray-900/50 rounded border border-gray-600 text-white text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateTradePrice(trade.trade_id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <div className={`font-bold ${calculatePnL(trade) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(calculatePnL(trade))}
                        </div>
                        <div className={`text-xs ${calculatePnLPercent(trade) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {calculatePnLPercent(trade) >= 0 ? '+' : ''}{formatNumber(calculatePnLPercent(trade))}%
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs">
                          <div className="text-green-400">T: {formatCurrency(trade.target_price)}</div>
                          <div className="text-red-400">S: {formatCurrency(trade.stop_loss)}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{ width: `${(trade.confidence_score || 0.5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatNumber((trade.confidence_score || 0.5) * 100, 0)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const exitPrice = prompt('Enter exit price:');
                              if (exitPrice) {
                                closeTrade(trade.trade_id, exitPrice);
                              }
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                          >
                            Close
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTrade(trade);
                              setShowEditModal(true);
                            }}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Trade History Tab */}
      {selectedTab === 'history' && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-bold mb-4 text-white">Trade History</h3>
          <div className="space-y-2">
            {closedTrades.map(trade => (
              <div key={trade.trade_id} className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    trade.pnl >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {trade.pnl >= 0 ? <Profit size={20} className="text-green-400" /> : <Loss size={20} className="text-red-400" />}
                  </div>
                  <div>
                    <div className="font-medium text-white">{trade.ticker}</div>
                    <div className="text-xs text-gray-400">
                      {trade.trade_type} • {new Date(trade.exit_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(trade.pnl)}
                  </div>
                  <div className="text-xs text-gray-400">
                    ML Score: {formatNumber((trade.confidence_score || 0.5) * 100, 0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ML Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
              <BarChart3 size={20} />
              Top Performing Strategies
            </h3>
            <div className="space-y-3">
              {(mlMetrics.topStrategies || []).map((strategy, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-300">{strategy.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">{formatNumber(strategy.winRate)}%</span>
                    <span className="text-xs text-gray-500">({strategy.count} trades)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
              <Target size={20} />
              Most Traded Tickers
            </h3>
            <div className="space-y-3">
              {(mlMetrics.topTickers || []).map((ticker, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">{ticker.symbol}</span>
                  <div className="flex items-center gap-2">
                    <span className={ticker.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {ticker.avgReturn >= 0 ? '+' : ''}{formatNumber(ticker.avgReturn)}%
                    </span>
                    <span className="text-xs text-gray-500">({ticker.count} trades)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ML Learning Insights Tab */}
      {selectedTab === 'learning' && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
            <Brain size={20} className="text-purple-400" />
            ML Learning Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium mb-3 text-gray-300">Pattern Recognition</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-gray-400">Best performance on momentum trades</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-yellow-400" />
                  <span className="text-gray-400">Improving on reversal patterns</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-blue-400" />
                  <span className="text-gray-400">Learning from {mlMetrics.summary?.totalTrades || 0} trades</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-3 text-gray-300">Recommendations</h4>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-gray-400">Consider tighter stops on volatile stocks</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-gray-400">Scale into positions showing strong momentum</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Trade Entry Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-2xl border border-gray-600 w-full max-w-4xl flex flex-col my-8" style={{ maxHeight: '90vh' }}>
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Brain size={24} className="text-purple-400" />
                  Enter Trade - ML Learning Active
                </h3>
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {/* Basic Trade Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ticker *</label>
                  <input
                    type="text"
                    value={newTrade.ticker}
                    onChange={(e) => setNewTrade({...newTrade, ticker: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    placeholder="AAPL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Strategy Type</label>
                  <select
                    value={newTrade.trade_type}
                    onChange={(e) => setNewTrade({...newTrade, trade_type: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                  >
                    {Object.entries(tradeTypes).map(([key, type]) => (
                      <option key={key} value={key}>{type.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">{tradeTypes[newTrade.trade_type]?.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Direction</label>
                  <select
                    value={newTrade.direction}
                    onChange={(e) => setNewTrade({...newTrade, direction: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                  >
                    <option value="BULLISH">Bullish</option>
                    <option value="BEARISH">Bearish</option>
                    <option value="NEUTRAL">Neutral</option>
                  </select>
                </div>
              </div>

              {/* Position Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Position Size *</label>
                  <input
                    type="number"
                    value={newTrade.position_size}
                    onChange={(e) => setNewTrade({...newTrade, position_size: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Entry Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.entry_price}
                    onChange={(e) => setNewTrade({...newTrade, entry_price: e.target.value})}
                    onBlur={calculateProfitTargets}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    placeholder="150.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.target_price}
                    onChange={(e) => setNewTrade({...newTrade, target_price: e.target.value})}
                    onBlur={calculateProfitTargets}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    placeholder="160.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.stop_loss}
                    onChange={(e) => setNewTrade({...newTrade, stop_loss: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    placeholder="145.00"
                  />
                </div>
              </div>

              {/* Profit Targets */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Profit Targets</label>
                <div className="grid grid-cols-3 gap-4">
                  {newTrade.profit_targets.map((target, idx) => (
                    <div key={idx} className="bg-gray-900/30 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">{target.percentage}% Target</div>
                      <input
                        type="number"
                        step="0.01"
                        value={target.price}
                        onChange={(e) => {
                          const updated = [...newTrade.profit_targets];
                          updated[idx].price = e.target.value;
                          setNewTrade({...newTrade, profit_targets: updated});
                        }}
                        className="w-full px-2 py-1 bg-gray-800/50 rounded border border-gray-600 text-white text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ML Confidence Score */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ML Confidence Score: {formatNumber(newTrade.confidence_score * 100, 0)}%
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={newTrade.confidence_score}
                    onChange={(e) => setNewTrade({...newTrade, confidence_score: parseFloat(e.target.value)})}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Brain size={20} className="text-purple-400" />
                    <span className="text-sm text-gray-400">ML will learn from this trade</span>
                  </div>
                </div>
              </div>

              {/* Trade Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trade Notes</label>
                <textarea
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                  rows="3"
                  placeholder="Add any notes about this trade for ML learning..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 flex gap-3 bg-gray-800 rounded-b-2xl flex-shrink-0">
              <button
                onClick={() => setShowTradeModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors font-medium"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Enter Trade clicked in ML system');
                  submitTrade();
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg transition-all font-bold cursor-pointer flex items-center justify-center gap-2"
                type="button"
              >
                <Brain size={20} />
                Enter Trade & Train ML
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLTradingSystem;