'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Brain, TrendingUp, TrendingDown, Target, Award, BarChart3, Clock, 
  DollarSign, Activity, CheckCircle, AlertCircle, Plus, X, Edit3,
  Percent, Shield, Zap, Settings, RotateCcw, ChevronUp, ChevronDown,
  TrendingDown as Loss, TrendingUp as Profit, Info
} from 'lucide-react';

const MLTradingSystemV2 = () => {
  // Core state
  const [mlMetrics, setMLMetrics] = useState({
    summary: { totalTrades: 0, winRate: 0, avgConfidenceAccuracy: 50, activeTrades: 0 },
    modelPerformance: { accuracy: 0 },
    topStrategies: [],
    topTickers: []
  });
  const [activeTrades, setActiveTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('positions');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Enhanced trade form
  const [newTrade, setNewTrade] = useState({
    ticker: '',
    trade_type: 'stock_long',
    direction: 'BULLISH',
    position_size: '',
    entry_price: '',
    target_price: '',
    stop_loss: '',
    confidence_score: 0.7,
    notes: ''
  });

  // Trade types
  const tradeTypes = {
    'stock_long': { name: 'Stock Long', description: 'Buy shares expecting price increase' },
    'stock_short': { name: 'Stock Short', description: 'Short sell expecting price decrease' },
    'call_buy': { name: 'Buy Calls', description: 'Long call options (enter # contracts, premium/share)' },
    'put_buy': { name: 'Buy Puts', description: 'Long put options (enter # contracts, premium/share)' },
    'call_sell': { name: 'Sell Calls', description: 'Short call options' },
    'put_sell': { name: 'Sell Puts', description: 'Short put options' }
  };

  // Fetch data functions
  const fetchMLMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/trade-feedback?type=ml_metrics');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMLMetrics(data);
        }
      }
    } catch (error) {
      console.log('Metrics fetch skipped:', error.message);
    }
  }, []);

  const fetchAllTrades = useCallback(async () => {
    try {
      const response = await fetch('/api/trade-feedback?type=all_trades');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.trades) {
          setActiveTrades(data.trades.filter(t => t.status === 'ACTIVE' || t.status === 'OPEN'));
          setClosedTrades(data.trades.filter(t => t.status === 'CLOSED'));
        }
      }
    } catch (error) {
      console.log('Trades fetch skipped:', error.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMLMetrics();
    fetchAllTrades();
    
    const interval = setInterval(() => {
      fetchMLMetrics();
      fetchAllTrades();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchMLMetrics, fetchAllTrades]);

  // SIMPLIFIED SUBMIT FUNCTION - No external interference
  const submitTrade = async () => {
    // Validation
    if (!newTrade.ticker || !newTrade.entry_price || !newTrade.position_size) {
      alert('Please fill in required fields: Ticker, Entry Price, and Position Size');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Build clean trade data
      const tradeData = {
        action: 'ml_enhanced_trade',
        ticker: newTrade.ticker.toUpperCase(),
        trade_type: newTrade.trade_type,
        direction: newTrade.direction,
        position_size: parseInt(newTrade.position_size) || 0,
        entry_price: parseFloat(newTrade.entry_price) || 0,
        target_price: parseFloat(newTrade.target_price) || 0,
        stop_loss: parseFloat(newTrade.stop_loss) || 0,
        confidence_score: newTrade.confidence_score,
        notes: newTrade.notes,
        timestamp: Date.now()
      };

      console.log('Submitting trade:', tradeData);

      // Make API call using native fetch - no interference possible
      const response = await fetch('/api/trade-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(tradeData),
        credentials: 'same-origin'
      });

      const result = await response.json();
      console.log('Trade response:', result);
      
      if (result.success) {
        alert('Trade logged successfully! ML system is learning.');
        
        // Reset form
        setNewTrade({
          ticker: '',
          trade_type: 'stock_long',
          direction: 'BULLISH',
          position_size: '',
          entry_price: '',
          target_price: '',
          stop_loss: '',
          confidence_score: 0.7,
          notes: ''
        });
        
        setShowTradeModal(false);
        
        // Refresh data
        setTimeout(() => {
          fetchAllTrades();
          fetchMLMetrics();
        }, 500);
        
      } else {
        alert(`Error: ${result.message || result.error || 'Failed to submit trade'}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit trade. Please check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculatePnL = (trade) => {
    if (!trade.current_price || !trade.entry_price) return 0;
    const pnl = (trade.current_price - trade.entry_price) * trade.position_size;
    return trade.direction === 'BEARISH' ? -pnl : pnl;
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(num || 0);
  };

  const formatNumber = (num, decimals = 2) => {
    return typeof num === 'number' ? num.toFixed(decimals) : '0.00';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          onClick={() => setShowTradeModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all flex items-center gap-2 font-bold"
        >
          <Plus size={20} />
          Enter Trade
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Win Rate</span>
            <TrendingUp size={16} className="text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(mlMetrics.summary?.winRate || 0, 1)}%
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
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">ML Accuracy</span>
            <Brain size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(mlMetrics.modelPerformance?.accuracy || 0, 1)}%
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab Content */}
      {selectedTab === 'positions' && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Active Positions</h3>
          {activeTrades.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Target size={48} className="mx-auto mb-4 opacity-50" />
              <p>No active trades. Click "Enter Trade" to start!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTrades.map(trade => (
                <div key={trade.trade_id} className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{trade.ticker}</span>
                      <span className="ml-2 text-sm text-gray-400">{trade.trade_type}</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${calculatePnL(trade) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(calculatePnL(trade))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trade Modal - SIMPLIFIED */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Brain size={24} className="text-purple-400" />
                  Enter Trade
                </h3>
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Trade Type Help */}
              {(newTrade.trade_type.includes('call') || newTrade.trade_type.includes('put')) && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400">
                    <Info size={16} className="inline mr-2" />
                    For options: Position Size = # of contracts, Entry Price = premium per share
                  </p>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ticker *</label>
                  <input
                    type="text"
                    value={newTrade.ticker}
                    onChange={(e) => setNewTrade({...newTrade, ticker: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                    placeholder="AAPL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trade Type</label>
                  <select
                    value={newTrade.trade_type}
                    onChange={(e) => setNewTrade({...newTrade, trade_type: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                  >
                    {Object.entries(tradeTypes).map(([key, type]) => (
                      <option key={key} value={key}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Direction</label>
                  <select
                    value={newTrade.direction}
                    onChange={(e) => setNewTrade({...newTrade, direction: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                  >
                    <option value="BULLISH">Bullish</option>
                    <option value="BEARISH">Bearish</option>
                    <option value="NEUTRAL">Neutral</option>
                  </select>
                </div>
              </div>

              {/* Position Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Position Size * {newTrade.trade_type.includes('call') || newTrade.trade_type.includes('put') ? '(contracts)' : '(shares)'}
                  </label>
                  <input
                    type="number"
                    value={newTrade.position_size}
                    onChange={(e) => setNewTrade({...newTrade, position_size: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                    placeholder={newTrade.trade_type.includes('call') || newTrade.trade_type.includes('put') ? "2" : "100"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Entry Price * {newTrade.trade_type.includes('call') || newTrade.trade_type.includes('put') ? '(premium/share)' : '(price/share)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.entry_price}
                    onChange={(e) => setNewTrade({...newTrade, entry_price: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                    placeholder={newTrade.trade_type.includes('call') || newTrade.trade_type.includes('put') ? "2.50" : "150.00"}
                  />
                </div>
              </div>

              {/* Targets */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.target_price}
                    onChange={(e) => setNewTrade({...newTrade, target_price: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
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
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                    placeholder="145.00"
                  />
                </div>
              </div>

              {/* ML Confidence */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ML Confidence: {Math.round(newTrade.confidence_score * 100)}%
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

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                  rows="3"
                  placeholder="Add any notes..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 sticky bottom-0 bg-gray-800">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={submitTrade}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Brain size={20} />
                  {submitting ? 'Submitting...' : 'Enter Trade & Train ML'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLTradingSystemV2;