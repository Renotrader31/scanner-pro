'use client';

import { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, Activity, Zap, Eye, BarChart3, DollarSign, Clock, AlertTriangle, Filter, RefreshCw, Flame } from 'lucide-react';

const OptionsScanner = () => {
  const [activeTab, setActiveTab] = useState('unusual_activity');
  const [unusualActivity, setUnusualActivity] = useState([]);
  const [optionsFlow, setOptionsFlow] = useState([]);
  const [greeksData, setGreeksData] = useState([]);
  const [optionsChain, setOptionsChain] = useState({ contracts: [], snapshots: [] });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [flowMinSize, setFlowMinSize] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Popular tickers for scanning
  const popularTickers = ['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'AMZN', 'MSFT', 'META', 'GOOGL', 'AMD'];

  useEffect(() => {
    fetchUnusualActivity();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchUnusualActivity();
      }, 60000); // Refresh every minute
      setRefreshInterval(interval);
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const fetchUnusualActivity = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/options-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unusual_activity',
          tickers: popularTickers
        })
      });

      const data = await response.json();
      if (data.success) {
        setUnusualActivity(data.results || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching unusual activity:', error);
    }
    setLoading(false);
  };

  const fetchOptionsFlow = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/options-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'options_flow',
          tickers: popularTickers,
          params: { minSize: flowMinSize }
        })
      });

      const data = await response.json();
      if (data.success) {
        setOptionsFlow(data.results || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching options flow:', error);
    }
    setLoading(false);
  };

  const fetchGreeks = async () => {
    if (!selectedTicker) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/options-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'greeks',
          tickers: [selectedTicker]
        })
      });

      const data = await response.json();
      if (data.success) {
        setGreeksData(data.results || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching Greeks:', error);
    }
    setLoading(false);
  };

  const fetchOptionsChain = async () => {
    if (!selectedTicker) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/options-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'options_chain',
          tickers: [selectedTicker]
        })
      });

      const data = await response.json();
      if (data.success) {
        setOptionsChain(data.results || { contracts: [], snapshots: [] });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching options chain:', error);
    }
    setLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'unusual_activity':
        fetchUnusualActivity();
        break;
      case 'options_flow':
        fetchOptionsFlow();
        break;
      case 'greeks':
        fetchGreeks();
        break;
      case 'options_chain':
        fetchOptionsChain();
        break;
    }
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '$0.00';
    return `$${Number(price).toFixed(2)}`;
  };

  const formatNumber = (num) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Number(num).toFixed(0);
  };

  const formatPercent = (percent) => {
    if (!percent || isNaN(percent)) return '0.0%';
    return `${(Number(percent) * 100).toFixed(1)}%`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (score >= 60) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-green-400 bg-green-500/20 border-green-500/30';
  };

  const getTypeColor = (type) => {
    return type === 'call' ? 'text-green-400 bg-green-500/20' : 'text-red-400 bg-red-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Target className="text-purple-400" size={32} />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Professional Options Scanner
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
            onClick={() => handleTabChange(activeTab)}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Scanning...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-1 border border-gray-700/50">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'unusual_activity', label: 'Unusual Activity', icon: Flame },
            { id: 'options_flow', label: 'Options Flow', icon: TrendingUp },
            { id: 'greeks', label: 'Greeks Dashboard', icon: BarChart3 },
            { id: 'options_chain', label: 'Options Chain', icon: Eye }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      {(activeTab === 'greeks' || activeTab === 'options_chain') && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Ticker</label>
              <input
                type="text"
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
                className="px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
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
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {ticker}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'options_flow' && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Contract Size</label>
              <select
                value={flowMinSize}
                onChange={(e) => setFlowMinSize(parseInt(e.target.value))}
                className="px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
              >
                <option value={50}>50+ contracts</option>
                <option value={100}>100+ contracts</option>
                <option value={250}>250+ contracts</option>
                <option value={500}>500+ contracts</option>
                <option value={1000}>1000+ contracts</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-8 w-8 text-purple-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xl text-gray-300">Scanning options market...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Unusual Activity Tab */}
            {activeTab === 'unusual_activity' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-orange-400">
                  <Flame size={20} />
                  Unusual Options Activity ({unusualActivity.length})
                </h3>
                
                {unusualActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <AlertTriangle className="mx-auto mb-4" size={48} />
                    <p>No unusual activity detected at this time.</p>
                    <p className="text-sm mt-2">Try refreshing or check back later.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unusualActivity.map((activity, index) => (
                      <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-white">{activity.ticker}</span>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(activity.score)}`}>
                              Score: {activity.score}
                            </div>
                            <span className="text-gray-300">${formatPrice(activity.stockPrice)}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-400">
                              {formatNumber(activity.totalVolume)} contracts
                            </div>
                            <div className="text-xs text-gray-400">Total Volume</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Call Volume</div>
                            <div className="font-bold text-green-400">{formatNumber(activity.callVolume)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Put Volume</div>
                            <div className="font-bold text-red-400">{formatNumber(activity.putVolume)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">P/C Ratio</div>
                            <div className="font-bold text-white">{activity.putCallRatio}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Open Interest</div>
                            <div className="font-bold text-blue-400">{formatNumber(activity.openInterest)}</div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-300 bg-gray-800/50 rounded p-2">
                          {activity.analysis}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Options Flow Tab */}
            {activeTab === 'options_flow' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-green-400">
                  <TrendingUp size={20} />
                  Large Options Trades ({optionsFlow.length})
                </h3>
                
                {optionsFlow.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <BarChart3 className="mx-auto mb-4" size={48} />
                    <p>No large options trades detected.</p>
                    <p className="text-sm mt-2">Lower the minimum size or try different tickers.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-4 text-gray-400">Ticker</th>
                          <th className="text-left py-2 px-4 text-gray-400">Option</th>
                          <th className="text-right py-2 px-4 text-gray-400">Size</th>
                          <th className="text-right py-2 px-4 text-gray-400">Price</th>
                          <th className="text-right py-2 px-4 text-gray-400">Value</th>
                          <th className="text-left py-2 px-4 text-gray-400">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optionsFlow.map((flow, index) => (
                          <tr key={index} className="border-b border-gray-800/50">
                            <td className="py-3 px-4 font-bold text-white">{flow.ticker}</td>
                            <td className="py-3 px-4 text-purple-400 font-mono text-sm">{flow.optionTicker}</td>
                            <td className="py-3 px-4 text-right font-bold">{formatNumber(flow.size)}</td>
                            <td className="py-3 px-4 text-right">{formatPrice(flow.price)}</td>
                            <td className="py-3 px-4 text-right font-bold text-green-400">{formatPrice(flow.value)}</td>
                            <td className="py-3 px-4 text-sm text-gray-400">
                              {new Date(flow.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Greeks Dashboard Tab */}
            {activeTab === 'greeks' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                  <BarChart3 size={20} />
                  Greeks Dashboard - {selectedTicker} ({greeksData.length} contracts)
                </h3>
                
                {greeksData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Activity className="mx-auto mb-4" size={48} />
                    <p>No options data available for {selectedTicker}.</p>
                    <p className="text-sm mt-2">Try a different ticker or check if options are available.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-3 text-gray-400">Contract</th>
                          <th className="text-left py-2 px-3 text-gray-400">Type</th>
                          <th className="text-right py-2 px-3 text-gray-400">Strike</th>
                          <th className="text-right py-2 px-3 text-gray-400">Price</th>
                          <th className="text-right py-2 px-3 text-gray-400">Delta</th>
                          <th className="text-right py-2 px-3 text-gray-400">Gamma</th>
                          <th className="text-right py-2 px-3 text-gray-400">Theta</th>
                          <th className="text-right py-2 px-3 text-gray-400">Vega</th>
                          <th className="text-right py-2 px-3 text-gray-400">IV</th>
                          <th className="text-right py-2 px-3 text-gray-400">Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {greeksData.slice(0, 20).map((option, index) => (
                          <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-700/20">
                            <td className="py-2 px-3 font-mono text-xs text-purple-400">{option.ticker}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeColor(option.type)}`}>
                                {option.type?.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold">${option.strike}</td>
                            <td className="py-2 px-3 text-right">{formatPrice(option.price)}</td>
                            <td className="py-2 px-3 text-right text-green-400">{option.delta.toFixed(3)}</td>
                            <td className="py-2 px-3 text-right text-blue-400">{option.gamma.toFixed(4)}</td>
                            <td className="py-2 px-3 text-right text-red-400">{option.theta.toFixed(3)}</td>
                            <td className="py-2 px-3 text-right text-yellow-400">{option.vega.toFixed(3)}</td>
                            <td className="py-2 px-3 text-right">{formatPercent(option.iv)}</td>
                            <td className="py-2 px-3 text-right">{formatNumber(option.volume)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Options Chain Tab */}
            {activeTab === 'options_chain' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                  <Eye size={20} />
                  Options Chain - {selectedTicker} ({optionsChain.contracts?.length || 0} contracts)
                </h3>
                
                {!optionsChain.contracts || optionsChain.contracts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="mx-auto mb-4" size={48} />
                    <p>No options chain data available for {selectedTicker}.</p>
                    <p className="text-sm mt-2">Try a different ticker or check if options trading is available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <div className="text-gray-400 mb-1">Total Contracts</div>
                        <div className="text-xl font-bold text-white">{optionsChain.contracts.length}</div>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <div className="text-gray-400 mb-1">Calls</div>
                        <div className="text-xl font-bold text-green-400">
                          {optionsChain.contracts.filter(c => c.contract_type === 'call').length}
                        </div>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <div className="text-gray-400 mb-1">Puts</div>
                        <div className="text-xl font-bold text-red-400">
                          {optionsChain.contracts.filter(c => c.contract_type === 'put').length}
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 px-3 text-gray-400">Contract</th>
                            <th className="text-left py-2 px-3 text-gray-400">Type</th>
                            <th className="text-right py-2 px-3 text-gray-400">Strike</th>
                            <th className="text-left py-2 px-3 text-gray-400">Expiry</th>
                            <th className="text-right py-2 px-3 text-gray-400">Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          {optionsChain.contracts.slice(0, 25).map((contract, index) => (
                            <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-700/20">
                              <td className="py-2 px-3 font-mono text-xs text-purple-400">{contract.ticker}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeColor(contract.contract_type)}`}>
                                  {contract.contract_type?.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-bold">${contract.strike_price}</td>
                              <td className="py-2 px-3 text-gray-300">{contract.expiration_date}</td>
                              <td className="py-2 px-3 text-right">
                                {optionsChain.snapshots?.find(s => s.ticker === contract.ticker)?.day?.volume || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OptionsScanner;