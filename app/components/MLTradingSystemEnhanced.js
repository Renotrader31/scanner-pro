'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Brain, TrendingUp, TrendingDown, Target, Award, BarChart3, Clock, 
  DollarSign, Activity, CheckCircle, AlertCircle, Plus, X, Edit3,
  Percent, Shield, Zap, Settings, RotateCcw, ChevronUp, ChevronDown,
  TrendingDown as Loss, TrendingUp as Profit, Info, Calculator,
  Trophy, AlertTriangle, BookOpen, Hash
} from 'lucide-react';

const MLTradingSystemEnhanced = () => {
  // Core state
  const [mlMetrics, setMLMetrics] = useState({
    summary: { totalTrades: 0, winRate: 0, avgConfidenceAccuracy: 50, activeTrades: 0 },
    modelPerformance: { accuracy: 0 },
    topStrategies: [],
    topTickers: []
  });
  const [activeTrades, setActiveTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('record');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quickEntry, setQuickEntry] = useState(false);
  
  // Enhanced trade form with Quantum Trade AI features
  const [newTrade, setNewTrade] = useState({
    // Basic Info
    symbol: '',
    side: 'BUY',
    instrumentType: 'STOCK',
    
    // Trade Details
    quantity: '',
    price: '',
    total: 0,
    
    // Options specific
    strike: '',
    expiry: '',
    optionType: 'CALL',
    contracts: '',
    premium: '',
    
    // Outcome & P/L
    outcome: 'PENDING',
    exitPrice: '',
    pnl: 0,
    pnlPercent: 0,
    
    // Risk Management
    stopLoss: '',
    target: '',
    riskReward: 0,
    
    // Meta
    date: new Date().toISOString().slice(0, 16),
    tradeType: 'MARKET',
    confidence: 0.7,
    notes: '',
    tags: [],
    
    // ML Features
    mlPrediction: '',
    mlScore: 0,
    strategy: 'MOMENTUM'
  });

  // Popular symbols for quick access (from Quantum)
  const popularSymbols = [
    'AAPL', 'TSLA', 'NVDA', 'AMD', 'SPY', 'QQQ', 'META', 'AMZN', 
    'GOOGL', 'MSFT', 'NFLX', 'PLTR', 'SOFI', 'RIVN', 'NIO'
  ];

  // Trade strategies
  const strategies = {
    'MOMENTUM': { name: 'Momentum', color: 'blue' },
    'SCALP': { name: 'Scalping', color: 'yellow' },
    'SWING': { name: 'Swing Trade', color: 'purple' },
    'DAYTRADE': { name: 'Day Trade', color: 'green' },
    'POSITION': { name: 'Position', color: 'indigo' },
    'OPTIONS': { name: 'Options Play', color: 'pink' }
  };

  // Calculate total in real-time
  useEffect(() => {
    if (newTrade.instrumentType === 'STOCK') {
      const qty = parseFloat(newTrade.quantity) || 0;
      const price = parseFloat(newTrade.price) || 0;
      setNewTrade(prev => ({
        ...prev,
        total: qty * price
      }));
    } else if (newTrade.instrumentType === 'OPTION') {
      const contracts = parseFloat(newTrade.contracts) || 0;
      const premium = parseFloat(newTrade.premium) || 0;
      setNewTrade(prev => ({
        ...prev,
        total: contracts * premium * 100
      }));
    }
  }, [newTrade.quantity, newTrade.price, newTrade.contracts, newTrade.premium, newTrade.instrumentType]);

  // Calculate P/L when exit price entered
  useEffect(() => {
    if (newTrade.exitPrice && newTrade.price) {
      const entryPrice = parseFloat(newTrade.price);
      const exitPrice = parseFloat(newTrade.exitPrice);
      const qty = parseFloat(newTrade.quantity) || 0;
      
      let pnl = 0;
      if (newTrade.side === 'BUY') {
        pnl = (exitPrice - entryPrice) * qty;
      } else {
        pnl = (entryPrice - exitPrice) * qty;
      }
      
      const pnlPercent = entryPrice > 0 ? (pnl / (entryPrice * qty)) * 100 : 0;
      
      setNewTrade(prev => ({
        ...prev,
        pnl: pnl,
        pnlPercent: pnlPercent,
        outcome: pnl > 0 ? 'WIN' : 'LOSS'
      }));
    }
  }, [newTrade.exitPrice, newTrade.price, newTrade.quantity, newTrade.side]);

  // Calculate risk/reward ratio
  useEffect(() => {
    if (newTrade.stopLoss && newTrade.target && newTrade.price) {
      const entry = parseFloat(newTrade.price);
      const stop = parseFloat(newTrade.stopLoss);
      const target = parseFloat(newTrade.target);
      
      const risk = Math.abs(entry - stop);
      const reward = Math.abs(target - entry);
      
      const ratio = risk > 0 ? reward / risk : 0;
      
      setNewTrade(prev => ({
        ...prev,
        riskReward: ratio
      }));
    }
  }, [newTrade.stopLoss, newTrade.target, newTrade.price]);

  // Fetch functions
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
          const trades = data.trades || [];
          setActiveTrades(trades.filter(t => t.status === 'ACTIVE' || t.status === 'OPEN'));
          setClosedTrades(trades.filter(t => t.status === 'CLOSED'));
          setPendingOrders(trades.filter(t => t.outcome === 'PENDING'));
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

  // Submit trade with enhanced data
  const submitTrade = async () => {
    // Debug logging
    console.log('Submitting trade with data:', {
      instrumentType: newTrade.instrumentType,
      symbol: newTrade.symbol,
      strike: newTrade.strike,
      expiry: newTrade.expiry,
      contracts: newTrade.contracts,
      premium: newTrade.premium
    });
    
    // Validation based on instrument type
    if (newTrade.instrumentType === 'STOCK') {
      if (!newTrade.symbol || !newTrade.price || !newTrade.quantity) {
        alert('Please fill in: Symbol, Price, and Quantity');
        return;
      }
    } else if (newTrade.instrumentType === 'OPTION') {
      // Check each field individually for better debugging
      const missingFields = [];
      if (!newTrade.symbol || newTrade.symbol.trim() === '') missingFields.push('Symbol');
      if (!newTrade.strike || newTrade.strike.toString().trim() === '') missingFields.push('Strike');
      if (!newTrade.expiry || newTrade.expiry.trim() === '') missingFields.push('Expiry');
      if (!newTrade.contracts || newTrade.contracts.toString().trim() === '') missingFields.push('Contracts');
      if (!newTrade.premium || newTrade.premium.toString().trim() === '') missingFields.push('Premium');
      
      if (missingFields.length > 0) {
        alert(`Please fill in: ${missingFields.join(', ')}`);
        console.log('Missing fields:', missingFields);
        console.log('Current values:', {
          symbol: newTrade.symbol,
          strike: newTrade.strike,
          expiry: newTrade.expiry,
          contracts: newTrade.contracts,
          premium: newTrade.premium
        });
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      // Build comprehensive trade data
      const tradeData = {
        action: 'ml_enhanced_trade',
        
        // Core fields
        symbol: newTrade.symbol.toUpperCase(),
        side: newTrade.side,
        instrumentType: newTrade.instrumentType,
        
        // Quantities & Prices
        quantity: newTrade.instrumentType === 'STOCK' ? parseInt(newTrade.quantity) : parseInt(newTrade.contracts) || 0,
        price: newTrade.instrumentType === 'STOCK' ? parseFloat(newTrade.price) || 0 : parseFloat(newTrade.premium) || 0,
        total: newTrade.total,
        
        // Options data
        optionDetails: newTrade.instrumentType === 'OPTION' ? {
          strike: parseFloat(newTrade.strike) || 0,
          expiry: newTrade.expiry,
          optionType: newTrade.optionType,
          contracts: parseInt(newTrade.contracts) || 0,
          premium: parseFloat(newTrade.premium) || 0
        } : null,
        
        // Outcome & P/L
        outcome: newTrade.outcome,
        exitPrice: parseFloat(newTrade.exitPrice) || null,
        pnl: newTrade.pnl,
        pnlPercent: newTrade.pnlPercent,
        
        // Risk Management
        stopLoss: parseFloat(newTrade.stopLoss) || null,
        target: parseFloat(newTrade.target) || null,
        riskReward: newTrade.riskReward,
        
        // Meta
        date: newTrade.date,
        tradeType: newTrade.tradeType,
        confidence: newTrade.confidence,
        notes: newTrade.notes,
        tags: newTrade.tags,
        strategy: newTrade.strategy,
        
        // ML
        mlScore: newTrade.confidence,
        mlPrediction: newTrade.mlPrediction,
        
        timestamp: Date.now()
      };

      console.log('Submitting enhanced trade:', tradeData);

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
        alert(`Trade recorded! ${newTrade.outcome === 'WIN' ? '✅ WIN' : newTrade.outcome === 'LOSS' ? '❌ LOSS' : '⏳ PENDING'} - ML is learning from this trade.`);
        
        // Add the trade to local state immediately
        const newTradeRecord = {
          ...tradeData,
          trade_id: result.trade_id || `trade_${Date.now()}`,
          entry_date: new Date().toISOString(),
          status: newTrade.outcome === 'PENDING' ? 'ACTIVE' : 'CLOSED'
        };
        
        // Update the appropriate list based on outcome
        if (newTrade.outcome === 'PENDING') {
          setActiveTrades(prev => [newTradeRecord, ...prev]);
          setPendingOrders(prev => [newTradeRecord, ...prev]);
        } else {
          setClosedTrades(prev => [newTradeRecord, ...prev]);
        }
        
        // Update metrics
        setMLMetrics(prev => ({
          ...prev,
          summary: {
            ...prev.summary,
            totalTrades: prev.summary.totalTrades + 1,
            activeTrades: newTrade.outcome === 'PENDING' ? prev.summary.activeTrades + 1 : prev.summary.activeTrades
          }
        }));
        
        // Reset form
        resetForm();
        setShowTradeModal(false);
        
        // Still try to refresh from server (but don't rely on it)
        setTimeout(() => {
          fetchAllTrades();
          fetchMLMetrics();
        }, 1000);
        
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

  // Close an active trade
  const closeTrade = (trade) => {
    const exitPrice = prompt(`Enter exit price for ${trade.symbol}:`, trade.instrumentType === 'OPTION' ? trade.premium : trade.price);
    if (!exitPrice) return;
    
    const outcome = prompt('Trade outcome - WIN or LOSS?', 'WIN').toUpperCase();
    if (outcome !== 'WIN' && outcome !== 'LOSS') {
      alert('Please enter WIN or LOSS');
      return;
    }
    
    // Calculate P/L
    let pnl = 0;
    let pnlPercent = 0;
    
    if (trade.instrumentType === 'OPTION') {
      const entryTotal = (trade.optionDetails?.contracts || trade.contracts) * (trade.optionDetails?.premium || trade.premium) * 100;
      const exitTotal = (trade.optionDetails?.contracts || trade.contracts) * parseFloat(exitPrice) * 100;
      pnl = trade.side === 'BUY' ? (exitTotal - entryTotal) : (entryTotal - exitTotal);
      pnlPercent = (pnl / entryTotal) * 100;
    } else {
      const entryTotal = trade.quantity * trade.price;
      const exitTotal = trade.quantity * parseFloat(exitPrice);
      pnl = trade.side === 'BUY' ? (exitTotal - entryTotal) : (entryTotal - exitTotal);
      pnlPercent = (pnl / entryTotal) * 100;
    }
    
    // Update the trade
    const updatedTrade = {
      ...trade,
      outcome,
      exitPrice: parseFloat(exitPrice),
      pnl,
      pnlPercent,
      status: 'CLOSED',
      closeDate: new Date().toISOString()
    };
    
    // Remove from active trades
    setActiveTrades(prev => prev.filter(t => t.trade_id !== trade.trade_id));
    setPendingOrders(prev => prev.filter(t => t.trade_id !== trade.trade_id));
    
    // Add to closed trades
    setClosedTrades(prev => [updatedTrade, ...prev]);
    
    // Update metrics
    setMLMetrics(prev => {
      const wins = closedTrades.filter(t => t.outcome === 'WIN').length + (outcome === 'WIN' ? 1 : 0);
      const total = closedTrades.length + 1;
      return {
        ...prev,
        summary: {
          ...prev.summary,
          activeTrades: prev.summary.activeTrades - 1,
          winRate: Math.round((wins / total) * 100)
        }
      };
    });
    
    alert(`Trade closed! ${outcome === 'WIN' ? '✅' : '❌'} ${trade.symbol} - P/L: ${formatCurrency(pnl)} (${formatNumber(pnlPercent)}%)`);
    
    // Try to update backend (but don't rely on it)
    fetch('/api/trade-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_trade',
        trade_id: trade.trade_id,
        ...updatedTrade
      })
    }).catch(console.error);
  };
  
  const resetForm = () => {
    setNewTrade({
      symbol: '',
      side: 'BUY',
      instrumentType: 'STOCK',
      quantity: '',
      price: '',
      total: 0,
      strike: '',
      expiry: '',
      optionType: 'CALL',
      contracts: '',
      premium: '',
      outcome: 'PENDING',
      exitPrice: '',
      pnl: 0,
      pnlPercent: 0,
      stopLoss: '',
      target: '',
      riskReward: 0,
      date: new Date().toISOString().slice(0, 16),
      tradeType: 'MARKET',
      confidence: 0.7,
      notes: '',
      tags: [],
      mlPrediction: '',
      mlScore: 0,
      strategy: 'MOMENTUM'
    });
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

  // Calculate total P/L across all closed trades
  const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winCount = closedTrades.filter(t => t.outcome === 'WIN').length;
  const lossCount = closedTrades.filter(t => t.outcome === 'LOSS').length;
  const winRate = closedTrades.length > 0 ? (winCount / closedTrades.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="text-purple-400 animate-pulse" size={32} />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              ML Trading System + Quantum AI
            </span>
          </h2>
        </div>
        <button
          onClick={() => setShowTradeModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all flex items-center gap-2 font-bold shadow-lg"
        >
          <Plus size={20} />
          Record Trade
        </button>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total P&L</span>
            <DollarSign size={16} className={totalPnL >= 0 ? 'text-green-400' : 'text-red-400'} />
          </div>
          <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(totalPnL)}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Win Rate</span>
            <Trophy size={16} className="text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(winRate, 1)}%
          </div>
          <div className="text-xs text-gray-500">
            {winCount}W / {lossCount}L
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active</span>
            <Activity size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {activeTrades.length}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Pending</span>
            <Clock size={16} className="text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {pendingOrders.length}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">ML Score</span>
            <Brain size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(mlMetrics.modelPerformance?.accuracy || 0, 1)}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {['record', 'active', 'history', 'pending', 'analytics'].map(tab => (
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
      {selectedTab === 'record' && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen size={20} />
            Quick Trade Entry
          </h3>
          
          {/* Quick Symbol Buttons */}
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Popular Symbols:</p>
            <div className="flex flex-wrap gap-2">
              {popularSymbols.map(symbol => (
                <button
                  key={symbol}
                  onClick={() => setNewTrade({...newTrade, symbol})}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Entry Form */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input
              placeholder="Symbol"
              value={newTrade.symbol}
              onChange={(e) => setNewTrade({...newTrade, symbol: e.target.value.toUpperCase()})}
              className="px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
            />
            <select
              value={newTrade.side}
              onChange={(e) => setNewTrade({...newTrade, side: e.target.value})}
              className="px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={newTrade.quantity}
              onChange={(e) => setNewTrade({...newTrade, quantity: e.target.value})}
              className="px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={newTrade.price}
              onChange={(e) => setNewTrade({...newTrade, price: e.target.value})}
              className="px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
            />
          </div>
          
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => setShowTradeModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Advanced Entry
            </button>
            <button
              onClick={submitTrade}
              disabled={!newTrade.symbol || !newTrade.price || !newTrade.quantity}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Quick Save
            </button>
          </div>
        </div>
      )}

      {selectedTab === 'active' && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Active Trades</h3>
          <div className="space-y-2">
            {activeTrades.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No active trades</p>
            ) : (
              activeTrades.map(trade => (
                <div key={trade.trade_id || trade.id} className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
                        ACTIVE
                      </div>
                      <div>
                        <span className="font-bold text-white">{trade.symbol}</span>
                        <span className="ml-2 text-sm text-gray-400">{trade.side}</span>
                        {trade.instrumentType === 'OPTION' ? (
                          <span className="ml-2 text-sm text-gray-500">
                            {trade.optionDetails?.contracts || trade.contracts} contracts @ ${trade.optionDetails?.premium || trade.premium}
                            (Strike: ${trade.optionDetails?.strike || trade.strike})
                          </span>
                        ) : (
                          <span className="ml-2 text-sm text-gray-500">{trade.quantity} @ ${trade.price}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Entry: {new Date(trade.entry_date || trade.timestamp).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">Target: ${trade.target || 'N/A'}</div>
                      </div>
                      <button
                        onClick={() => closeTrade(trade)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Close Trade
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedTab === 'pending' && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Pending Orders</h3>
          <div className="space-y-2">
            {pendingOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No pending orders</p>
            ) : (
              pendingOrders.map(trade => (
                <div key={trade.trade_id || trade.id} className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="px-2 py-1 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400">
                        PENDING
                      </div>
                      <div>
                        <span className="font-bold text-white">{trade.symbol}</span>
                        <span className="ml-2 text-sm text-gray-400">{trade.side}</span>
                        {trade.instrumentType === 'OPTION' ? (
                          <span className="ml-2 text-sm text-gray-500">
                            {trade.optionDetails?.contracts || trade.contracts} contracts @ ${trade.optionDetails?.premium || trade.premium}
                          </span>
                        ) : (
                          <span className="ml-2 text-sm text-gray-500">{trade.quantity} @ ${trade.price}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-400">R/R: {trade.riskReward || 'N/A'}</div>
                      </div>
                      <button
                        onClick={() => closeTrade(trade)}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Execute & Close
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedTab === 'history' && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Trade History</h3>
          <div className="space-y-2">
            {closedTrades.map(trade => (
              <div key={trade.trade_id || trade.id} className="p-4 bg-gray-900/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    trade.outcome === 'WIN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {trade.outcome}
                  </div>
                  <div>
                    <span className="font-bold text-white">{trade.symbol || trade.ticker}</span>
                    <span className="ml-2 text-sm text-gray-400">{trade.side}</span>
                    <span className="ml-2 text-sm text-gray-500">{trade.quantity || trade.position_size} @ ${trade.price || trade.entry_price}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(trade.pnl || 0)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {trade.pnlPercent ? `${formatNumber(trade.pnlPercent)}%` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'analytics' && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Analytics & ML Performance</h3>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Trades</div>
              <div className="text-2xl font-bold text-white">{mlMetrics.summary.totalTrades}</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Win Rate</div>
              <div className="text-2xl font-bold text-green-400">{mlMetrics.summary.winRate}%</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Active Trades</div>
              <div className="text-2xl font-bold text-blue-400">{activeTrades.length}</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">ML Accuracy</div>
              <div className="text-2xl font-bold text-purple-400">{mlMetrics.summary.avgConfidenceAccuracy}%</div>
            </div>
          </div>

          {/* Recent Trades Summary */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-lg font-bold text-white mb-3">Recent Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Wins</span>
                <span className="text-green-400 font-bold">{closedTrades.filter(t => t.outcome === 'WIN').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Losses</span>
                <span className="text-red-400 font-bold">{closedTrades.filter(t => t.outcome === 'LOSS').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pending</span>
                <span className="text-yellow-400 font-bold">{pendingOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total P/L</span>
                <span className={`font-bold ${
                  closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Trade Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-2xl border border-gray-600 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Calculator size={24} className="text-purple-400" />
                  Record Trade - Quantum Enhanced
                </h3>
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              {/* Instrument Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTrade({...newTrade, instrumentType: 'STOCK'})}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    newTrade.instrumentType === 'STOCK' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Stock
                </button>
                <button
                  onClick={() => setNewTrade({...newTrade, instrumentType: 'OPTION'})}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    newTrade.instrumentType === 'OPTION' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Options
                </button>
              </div>

              {/* Basic Info */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Hash size={18} />
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Symbol *</label>
                    <input
                      value={newTrade.symbol}
                      onChange={(e) => setNewTrade({...newTrade, symbol: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                      placeholder="AAPL"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Side *</label>
                    <select
                      value={newTrade.side}
                      onChange={(e) => setNewTrade({...newTrade, side: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Strategy</label>
                    <select
                      value={newTrade.strategy}
                      onChange={(e) => setNewTrade({...newTrade, strategy: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                    >
                      {Object.entries(strategies).map(([key, strategy]) => (
                        <option key={key} value={key}>{strategy.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Trade Type</label>
                    <select
                      value={newTrade.tradeType}
                      onChange={(e) => setNewTrade({...newTrade, tradeType: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                    >
                      <option value="MARKET">Market</option>
                      <option value="LIMIT">Limit</option>
                      <option value="SWEEP">Sweep</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stock Details */}
              {newTrade.instrumentType === 'STOCK' && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Position Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Quantity *</label>
                      <input
                        type="number"
                        value={newTrade.quantity}
                        onChange={(e) => setNewTrade({...newTrade, quantity: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                        placeholder="100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Entry Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newTrade.price}
                        onChange={(e) => setNewTrade({...newTrade, price: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                        placeholder="150.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Exit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newTrade.exitPrice}
                        onChange={(e) => setNewTrade({...newTrade, exitPrice: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                        placeholder="155.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Total</label>
                      <div className="w-full px-3 py-2 bg-gray-900/30 rounded-lg border border-gray-700 text-green-400 font-bold">
                        {formatCurrency(newTrade.total)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Options Details */}
              {newTrade.instrumentType === 'OPTION' && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Options Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Option Type</label>
                      <select
                        value={newTrade.optionType}
                        onChange={(e) => setNewTrade({...newTrade, optionType: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                      >
                        <option value="CALL">Call</option>
                        <option value="PUT">Put</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Strike *</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newTrade.strike}
                        onChange={(e) => setNewTrade({...newTrade, strike: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                        placeholder="150"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Expiry *</label>
                      <input
                        type="date"
                        value={newTrade.expiry}
                        onChange={(e) => setNewTrade({...newTrade, expiry: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Contracts *</label>
                      <input
                        type="number"
                        value={newTrade.contracts}
                        onChange={(e) => setNewTrade({...newTrade, contracts: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                        placeholder="2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Premium/Share *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newTrade.premium}
                        onChange={(e) => setNewTrade({...newTrade, premium: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                        placeholder="2.50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Total Premium</label>
                      <div className="w-full px-3 py-2 bg-gray-900/30 rounded-lg border border-gray-700 text-green-400 font-bold">
                        {formatCurrency(newTrade.total)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Management */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Shield size={18} />
                  Risk Management
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Stop Loss</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTrade.stopLoss}
                      onChange={(e) => setNewTrade({...newTrade, stopLoss: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                      placeholder="145.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Target Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTrade.target}
                      onChange={(e) => setNewTrade({...newTrade, target: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                      placeholder="160.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Risk/Reward</label>
                    <div className={`w-full px-3 py-2 bg-gray-900/30 rounded-lg border border-gray-700 font-bold ${
                      newTrade.riskReward >= 2 ? 'text-green-400' : newTrade.riskReward >= 1 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      1:{formatNumber(newTrade.riskReward, 1)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Date/Time</label>
                    <input
                      type="datetime-local"
                      value={newTrade.date}
                      onChange={(e) => setNewTrade({...newTrade, date: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Outcome & P/L */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Trophy size={18} />
                  Outcome & P/L
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Outcome</label>
                    <select
                      value={newTrade.outcome}
                      onChange={(e) => setNewTrade({...newTrade, outcome: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="WIN">Win</option>
                      <option value="LOSS">Loss</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">P/L Amount</label>
                    <div className={`w-full px-3 py-2 bg-gray-900/30 rounded-lg border border-gray-700 font-bold ${
                      newTrade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(newTrade.pnl)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">P/L %</label>
                    <div className={`w-full px-3 py-2 bg-gray-900/30 rounded-lg border border-gray-700 font-bold ${
                      newTrade.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatNumber(newTrade.pnlPercent)}%
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">ML Confidence</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0.1"
                        max="0.95"
                        step="0.05"
                        value={newTrade.confidence}
                        onChange={(e) => setNewTrade({...newTrade, confidence: parseFloat(e.target.value)})}
                        className="flex-1"
                      />
                      <span className="text-white text-sm">{Math.round(newTrade.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 text-white"
                  rows="3"
                  placeholder="Trade notes, strategy reasoning, market conditions..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 bg-gray-800 flex gap-3">
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
                {submitting ? 'Recording...' : `Record Trade ${newTrade.outcome === 'WIN' ? '✅' : newTrade.outcome === 'LOSS' ? '❌' : '⏳'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLTradingSystemEnhanced;