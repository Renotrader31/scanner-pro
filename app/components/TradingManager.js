'use client';

import { useState, useEffect } from 'react';
import { 
  Target, Plus, TrendingUp, TrendingDown, DollarSign, Percent, Clock, 
  Settings, AlertTriangle, CheckCircle, X, Edit3, RotateCcw, Activity,
  BarChart3, Zap, Shield, Brain
} from 'lucide-react';

const TradingManager = () => {
  const [activeTrades, setActiveTrades] = useState([]);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [actionType, setActionType] = useState('');
  
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
    legs: [],
    profit_targets: [
      { percentage: 25, price: '', hit: false },
      { percentage: 50, price: '', hit: false },
      { percentage: 75, price: '', hit: false }
    ],
    stop_type: 'fixed', // fixed, trailing, time_based
    trailing_amount: '',
    time_stop_days: '',
    notes: ''
  });

  const [actionData, setActionData] = useState({
    close_percentage: 100,
    new_stop_price: '',
    roll_strike: '',
    roll_expiration: '',
    reason: ''
  });

  // Trade types with multi-leg support
  const tradeTypes = {
    // Single leg trades
    'stock_long': { name: 'Long Stock', legs: 1, description: 'Buy and hold stock' },
    'stock_short': { name: 'Short Stock', legs: 1, description: 'Short sell stock' },
    'call_long': { name: 'Long Call', legs: 1, description: 'Buy call option' },
    'put_long': { name: 'Long Put', legs: 1, description: 'Buy put option' },
    'call_short': { name: 'Short Call', legs: 1, description: 'Sell call option' },
    'put_short': { name: 'Short Put', legs: 1, description: 'Sell put option' },
    
    // Multi-leg strategies
    'iron_condor': { name: 'Iron Condor', legs: 4, description: 'Sell call & put spreads' },
    'iron_butterfly': { name: 'Iron Butterfly', legs: 4, description: 'Short straddle + protective spreads' },
    'straddle': { name: 'Straddle', legs: 2, description: 'Buy call + put same strike' },
    'strangle': { name: 'Strangle', legs: 2, description: 'Buy call + put different strikes' },
    'call_spread': { name: 'Call Spread', legs: 2, description: 'Buy/sell calls different strikes' },
    'put_spread': { name: 'Put Spread', legs: 2, description: 'Buy/sell puts different strikes' },
    'calendar_spread': { name: 'Calendar Spread', legs: 2, description: 'Same strike, different expirations' },
    'diagonal_spread': { name: 'Diagonal Spread', legs: 2, description: 'Different strikes & expirations' },
    'covered_call': { name: 'Covered Call', legs: 2, description: 'Long stock + short call' },
    'protective_put': { name: 'Protective Put', legs: 2, description: 'Long stock + long put' }
  };

  const stopTypes = {
    'fixed': 'Fixed Stop Loss',
    'trailing': 'Trailing Stop',
    'time_based': 'Time-Based Exit'
  };

  useEffect(() => {
    fetchActiveTrades();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActiveTrades, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveTrades = async () => {
    try {
      const response = await fetch('/api/trade-feedback?type=trades&status=active');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActiveTrades(data.trades || []);
        }
      }
    } catch (error) {
      console.error('Error fetching active trades:', error);
    }
  };

  const submitTrade = async () => {
    console.log('submitTrade called in TradingManager');
    console.log('Trade data:', newTrade);
    
    // Validate required fields
    if (!newTrade.ticker || !newTrade.entry_price || !newTrade.position_size) {
      alert('Please fill in all required fields: Ticker, Entry Price, and Position Size');
      return;
    }
    
    try {
      const tradeData = {
        action: 'submit_advanced_trade',
        ...newTrade,
        entry_price: parseFloat(newTrade.entry_price) || 0,
        position_size: parseInt(newTrade.position_size) || 0,
        target_price: parseFloat(newTrade.target_price) || 0,
        stop_loss: parseFloat(newTrade.stop_loss) || 0,
        max_risk: parseFloat(newTrade.max_risk) || 0,
        max_reward: parseFloat(newTrade.max_reward) || 0,
        profit_targets: newTrade.profit_targets.map(pt => ({
          ...pt,
          price: parseFloat(pt.price) || 0
        })),
        timestamp: Date.now()
      };

      const response = await fetch('/api/trade-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
      });

      const data = await response.json();
      console.log('Trade submission response:', data);
      
      if (data.success) {
        alert('Trade successfully entered!');
        setShowTradeModal(false);
        resetTradeForm();
        fetchActiveTrades();
      } else {
        alert(`Failed to enter trade: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting trade:', error);
    }
  };

  const executeTradeAction = async () => {
    try {
      const response = await fetch('/api/trade-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trade_action',
          trade_id: selectedTrade.id,
          action_type: actionType,
          ...actionData,
          timestamp: Date.now()
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowActionModal(false);
        resetActionForm();
        fetchActiveTrades();
      }
    } catch (error) {
      console.error('Error executing trade action:', error);
    }
  };

  const resetTradeForm = () => {
    setNewTrade({
      ticker: '', trade_type: 'stock_long', strategy_name: '', direction: 'BULLISH',
      position_size: '', entry_price: '', target_price: '', stop_loss: '',
      max_risk: '', max_reward: '', confidence_score: 0.7, legs: [],
      profit_targets: [{ percentage: 25, price: '', hit: false }, { percentage: 50, price: '', hit: false }, { percentage: 75, price: '', hit: false }],
      stop_type: 'fixed', trailing_amount: '', time_stop_days: '', notes: ''
    });
  };

  const resetActionForm = () => {
    setActionData({
      close_percentage: 100, new_stop_price: '', roll_strike: '', roll_expiration: '', reason: ''
    });
    setSelectedTrade(null);
    setActionType('');
  };

  const addLeg = () => {
    setNewTrade(prev => ({
      ...prev,
      legs: [...prev.legs, {
        type: 'call', // call, put, stock
        action: 'buy', // buy, sell
        strike: '',
        expiration: '',
        quantity: '',
        price: ''
      }]
    }));
  };

  const updateLeg = (index, field, value) => {
    setNewTrade(prev => ({
      ...prev,
      legs: prev.legs.map((leg, i) => 
        i === index ? { ...leg, [field]: value } : leg
      )
    }));
  };

  const removeLeg = (index) => {
    setNewTrade(prev => ({
      ...prev,
      legs: prev.legs.filter((_, i) => i !== index)
    }));
  };

  const calculateRiskReward = () => {
    const risk = parseFloat(newTrade.max_risk) || 0;
    const reward = parseFloat(newTrade.max_reward) || 0;
    return risk > 0 ? (reward / risk).toFixed(2) : '0.00';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatPercent = (value) => {
    if (!value || isNaN(value)) return '0.0%';
    return `${Number(value).toFixed(1)}%`;
  };

  const getTradeStatus = (trade) => {
    if (trade.status === 'ACTIVE') return { color: 'text-blue-400', bg: 'bg-blue-500/20', text: 'Active' };
    if (trade.status === 'CLOSED') return { color: 'text-green-400', bg: 'bg-green-500/20', text: 'Closed' };
    if (trade.status === 'STOPPED') return { color: 'text-red-400', bg: 'bg-red-500/20', text: 'Stopped' };
    return { color: 'text-gray-400', bg: 'bg-gray-500/20', text: 'Unknown' };
  };

  const getCurrentPnL = (trade) => {
    // Simulate current P&L calculation
    const currentPrice = trade.current_price || trade.entry_price;
    const pnl = (currentPrice - trade.entry_price) * trade.position_size * (trade.direction === 'BULLISH' ? 1 : -1);
    return pnl;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Target className="text-green-400" size={32} />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
            Advanced Trading Manager
          </span>
        </h2>
        <button
          onClick={() => setShowTradeModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all flex items-center gap-2 font-bold"
        >
          <Plus size={20} />
          Enter Trade
        </button>
      </div>

      {/* Active Trades */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="p-4 border-b border-gray-700/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity size={20} />
            Active Positions ({activeTrades.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Position</th>
                <th className="text-left p-4 text-gray-400 font-medium">Entry</th>
                <th className="text-left p-4 text-gray-400 font-medium">Current</th>
                <th className="text-left p-4 text-gray-400 font-medium">P&L</th>
                <th className="text-left p-4 text-gray-400 font-medium">Risk/Reward</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeTrades.map((trade, index) => {
                const status = getTradeStatus(trade);
                const pnl = getCurrentPnL(trade);
                const pnlColor = pnl >= 0 ? 'text-green-400' : 'text-red-400';
                
                return (
                  <tr key={trade.id || index} className="border-t border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-blue-400">{trade.ticker}</div>
                      <div className="text-sm text-gray-400">{trade.strategy_name || tradeTypes[trade.trade_type]?.name}</div>
                      <div className="text-xs text-gray-500">{trade.position_size} shares</div>
                    </td>
                    <td className="p-4 text-white">{formatCurrency(trade.entry_price)}</td>
                    <td className="p-4 text-white">{formatCurrency(trade.current_price || trade.entry_price)}</td>
                    <td className={`p-4 font-bold ${pnlColor}`}>{formatCurrency(pnl)}</td>
                    <td className="p-4 text-gray-300">
                      <div>Risk: {formatCurrency(trade.max_risk)}</div>
                      <div>Reward: {formatCurrency(trade.max_reward)}</div>
                      <div className="text-blue-400 font-bold">
                        {trade.max_risk ? (trade.max_reward / trade.max_risk).toFixed(2) : '0.00'}:1
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedTrade(trade);
                            setActionType('take_profit');
                            setShowActionModal(true);
                          }}
                          className="p-1 bg-green-600 hover:bg-green-700 rounded text-white"
                          title="Take Profit"
                        >
                          <TrendingUp size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTrade(trade);
                            setActionType('adjust_stop');
                            setShowActionModal(true);
                          }}
                          className="p-1 bg-red-600 hover:bg-red-700 rounded text-white"
                          title="Adjust Stop"
                        >
                          <Shield size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTrade(trade);
                            setActionType('close_partial');
                            setShowActionModal(true);
                          }}
                          className="p-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
                          title="Partial Close"
                        >
                          <Percent size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTrade(trade);
                            setActionType('roll_position');
                            setShowActionModal(true);
                          }}
                          className="p-1 bg-purple-600 hover:bg-purple-700 rounded text-white"
                          title="Roll Position"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {activeTrades.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Target size={48} className="mx-auto mb-4 opacity-50" />
            <p>No active positions. Enter your first trade to get started!</p>
          </div>
        )}
      </div>

      {/* Enhanced Trade Entry Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-600 w-full max-w-4xl flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Plus size={24} />
                  Enter New Trade
                </h3>
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Basic Trade Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ticker</label>
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

              {/* Position Sizing & Risk */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Position Size</label>
                  <input
                    type="number"
                    value={newTrade.position_size}
                    onChange={(e) => setNewTrade({...newTrade, position_size: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.entry_price}
                    onChange={(e) => setNewTrade({...newTrade, entry_price: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    placeholder="150.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Risk ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.max_risk}
                    onChange={(e) => setNewTrade({...newTrade, max_risk: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Reward ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.max_reward}
                    onChange={(e) => setNewTrade({...newTrade, max_reward: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    placeholder="1500"
                  />
                </div>
              </div>

              {/* Risk/Reward Display */}
              {newTrade.max_risk && newTrade.max_reward && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-bold">Risk/Reward Ratio:</span>
                    <span className="text-2xl font-bold text-green-400">{calculateRiskReward()}:1</span>
                  </div>
                </div>
              )}

              {/* Profit Targets */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Profit Targets</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {newTrade.profit_targets.map((target, index) => (
                    <div key={index} className="bg-gray-900/30 rounded-lg p-3">
                      <label className="block text-xs text-gray-400 mb-1">{target.percentage}% Target</label>
                      <input
                        type="number"
                        step="0.01"
                        value={target.price}
                        onChange={(e) => {
                          const newTargets = [...newTrade.profit_targets];
                          newTargets[index].price = e.target.value;
                          setNewTrade({...newTrade, profit_targets: newTargets});
                        }}
                        className="w-full px-2 py-1 bg-gray-800 rounded border border-gray-600 focus:border-blue-500 text-white text-sm"
                        placeholder="Target price"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Stop Loss Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stop Type</label>
                  <select
                    value={newTrade.stop_type}
                    onChange={(e) => setNewTrade({...newTrade, stop_type: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                  >
                    {Object.entries(stopTypes).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.stop_loss}
                    onChange={(e) => setNewTrade({...newTrade, stop_loss: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    placeholder="140.00"
                  />
                </div>

                {newTrade.stop_type === 'trailing' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Trailing Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTrade.trailing_amount}
                      onChange={(e) => setNewTrade({...newTrade, trailing_amount: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                      placeholder="5.00"
                    />
                  </div>
                )}

                {newTrade.stop_type === 'time_based' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Exit After (Days)</label>
                    <input
                      type="number"
                      value={newTrade.time_stop_days}
                      onChange={(e) => setNewTrade({...newTrade, time_stop_days: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                      placeholder="30"
                    />
                  </div>
                )}
              </div>

              {/* Multi-Leg Configuration */}
              {tradeTypes[newTrade.trade_type]?.legs > 1 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-300">Trade Legs</label>
                    <button
                      onClick={addLeg}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Leg
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newTrade.legs.map((leg, index) => (
                      <div key={index} className="bg-gray-900/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-white">Leg {index + 1}</h4>
                          <button
                            onClick={() => removeLeg(index)}
                            className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          <select
                            value={leg.action}
                            onChange={(e) => updateLeg(index, 'action', e.target.value)}
                            className="px-2 py-1 bg-gray-800 rounded border border-gray-600 text-white text-sm"
                          >
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                          </select>
                          
                          <select
                            value={leg.type}
                            onChange={(e) => updateLeg(index, 'type', e.target.value)}
                            className="px-2 py-1 bg-gray-800 rounded border border-gray-600 text-white text-sm"
                          >
                            <option value="call">Call</option>
                            <option value="put">Put</option>
                            <option value="stock">Stock</option>
                          </select>
                          
                          <input
                            type="number"
                            value={leg.strike}
                            onChange={(e) => updateLeg(index, 'strike', e.target.value)}
                            className="px-2 py-1 bg-gray-800 rounded border border-gray-600 text-white text-sm"
                            placeholder="Strike"
                          />
                          
                          <input
                            type="date"
                            value={leg.expiration}
                            onChange={(e) => updateLeg(index, 'expiration', e.target.value)}
                            className="px-2 py-1 bg-gray-800 rounded border border-gray-600 text-white text-sm"
                          />
                          
                          <input
                            type="number"
                            value={leg.quantity}
                            onChange={(e) => updateLeg(index, 'quantity', e.target.value)}
                            className="px-2 py-1 bg-gray-800 rounded border border-gray-600 text-white text-sm"
                            placeholder="Qty"
                          />
                          
                          <input
                            type="number"
                            step="0.01"
                            value={leg.price}
                            onChange={(e) => updateLeg(index, 'price', e.target.value)}
                            className="px-2 py-1 bg-gray-800 rounded border border-gray-600 text-white text-sm"
                            placeholder="Price"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trade Notes</label>
                <textarea
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                  rows={3}
                  placeholder="Add any additional notes about this trade..."
                />
              </div>

              {/* ML Confidence */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ML Confidence: {(newTrade.confidence_score * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={newTrade.confidence_score}
                  onChange={(e) => setNewTrade({...newTrade, confidence_score: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Low Confidence</span>
                  <span>High Confidence</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 flex gap-3 bg-gray-800 rounded-b-2xl sticky bottom-0">
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
                  console.log('Enter Trade clicked');
                  submitTrade();
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 rounded-lg transition-all font-bold cursor-pointer"
                type="button"
              >
                Enter Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trade Action Modal */}
      {showActionModal && selectedTrade && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-600 w-full max-w-md">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {actionType === 'take_profit' && 'Take Profit'}
                  {actionType === 'adjust_stop' && 'Adjust Stop Loss'}
                  {actionType === 'close_partial' && 'Partial Close'}
                  {actionType === 'roll_position' && 'Roll Position'}
                </h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {selectedTrade.ticker} - {selectedTrade.strategy_name || tradeTypes[selectedTrade.trade_type]?.name}
              </p>
            </div>

            <div className="p-4 space-y-4">
              {actionType === 'close_partial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Close Percentage</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={actionData.close_percentage}
                    onChange={(e) => setActionData({...actionData, close_percentage: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>10%</span>
                    <span className="font-bold text-white">{actionData.close_percentage}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}

              {actionType === 'adjust_stop' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Stop Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={actionData.new_stop_price}
                    onChange={(e) => setActionData({...actionData, new_stop_price: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    placeholder="New stop loss price"
                  />
                </div>
              )}

              {actionType === 'roll_position' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Strike</label>
                    <input
                      type="number"
                      step="0.01"
                      value={actionData.roll_strike}
                      onChange={(e) => setActionData({...actionData, roll_strike: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                      placeholder="New strike price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Expiration</label>
                    <input
                      type="date"
                      value={actionData.roll_expiration}
                      onChange={(e) => setActionData({...actionData, roll_expiration: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason for Action</label>
                <textarea
                  value={actionData.reason}
                  onChange={(e) => setActionData({...actionData, reason: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                  rows={2}
                  placeholder="Why are you taking this action?"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeTradeAction}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors font-bold"
              >
                Execute Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingManager;