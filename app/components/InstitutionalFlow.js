'use client';

import { useState, useEffect } from 'react';
import { Building2, Eye, TrendingUp, TrendingDown, Activity, Zap, Clock, AlertTriangle, RefreshCw, DollarSign, BarChart3, Target, Flame } from 'lucide-react';

const InstitutionalFlow = () => {
  const [activeTab, setActiveTab] = useState('smart_money');
  const [smartMoneyFlow, setSmartMoneyFlow] = useState([]);
  const [blockTrades, setBlockTrades] = useState([]);
  const [darkPoolAnalysis, setDarkPoolAnalysis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [minTradeSize, setMinTradeSize] = useState(25000);

  // Institutional focus tickers
  const institutionalTickers = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'AMD', 'JPM', 'BAC', 'GS', 'MS'];

  useEffect(() => {
    fetchInstitutionalData();
  }, [activeTab, minTradeSize]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchInstitutionalData, 45000); // Update every 45 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, activeTab, minTradeSize]);

  const fetchInstitutionalData = async () => {
    setLoading(true);
    try {
      let endpoint, payload;
      
      switch (activeTab) {
        case 'smart_money':
          endpoint = '/api/institutional-flow';
          payload = {
            action: 'smart_money_flow',
            tickers: institutionalTickers
          };
          break;
        case 'block_trades':
          endpoint = '/api/institutional-flow';
          payload = {
            action: 'block_trades',
            tickers: institutionalTickers,
            params: { minSize: minTradeSize }
          };
          break;
        case 'dark_pools':
          endpoint = '/api/institutional-flow';
          payload = {
            action: 'dark_pool_analysis',
            tickers: institutionalTickers
          };
          break;
        case 'comprehensive':
          endpoint = '/api/institutional-flow';
          payload = {
            action: 'comprehensive',
            tickers: institutionalTickers,
            params: { minSize: minTradeSize }
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        switch (activeTab) {
          case 'smart_money':
            setSmartMoneyFlow(data.results || []);
            break;
          case 'block_trades':
            setBlockTrades(data.results || []);
            break;
          case 'dark_pools':
            setDarkPoolAnalysis(data.results || []);
            break;
          case 'comprehensive':
            setSmartMoneyFlow(data.results?.smartMoneyFlow || []);
            setBlockTrades(data.results?.blockTrades || []);
            setDarkPoolAnalysis(data.results?.darkPoolAnalysis || []);
            break;
        }
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching institutional data:', error);
    }
    setLoading(false);
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '$0.00';
    return `$${Number(price).toFixed(2)}`;
  };

  const formatNumber = (num) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Number(num).toFixed(0);
  };

  const formatPercent = (percent, decimals = 1) => {
    if (!percent || isNaN(percent)) return '0.0%';
    return `${Number(percent).toFixed(decimals)}%`;
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-red-400 bg-red-500/30 border-red-500/50';
    if (score >= 70) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-green-400 bg-green-500/20 border-green-500/30';
  };

  const getFlowColor = (direction) => {
    switch (direction) {
      case 'BULLISH_FLOW':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'BEARISH_FLOW':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'MIXED_FLOW':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getFlowIcon = (direction) => {
    switch (direction) {
      case 'BULLISH_FLOW':
        return <TrendingUp size={16} />;
      case 'BEARISH_FLOW':
        return <TrendingDown size={16} />;
      case 'MIXED_FLOW':
        return <Activity size={16} />;
      default:
        return <BarChart3 size={16} />;
    }
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'STRONG_INSTITUTIONAL':
      case 'INSTITUTIONAL_BLOCK':
        return 'text-red-400 bg-red-500/30 border-red-500/50';
      case 'INSTITUTIONAL':
      case 'LIKELY_INSTITUTIONAL':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'POSSIBLE_INSTITUTIONAL':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="text-indigo-400" size={32} />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">
            Institutional Flow Detection
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
            onClick={fetchInstitutionalData}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
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
            { id: 'smart_money', label: 'Smart Money Flow', icon: Zap },
            { id: 'block_trades', label: 'Block Trades', icon: Building2 },
            { id: 'dark_pools', label: 'Dark Pool Activity', icon: Eye },
            { id: 'comprehensive', label: 'All Signals', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
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
      {(activeTab === 'block_trades' || activeTab === 'comprehensive') && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Block Size</label>
              <select
                value={minTradeSize}
                onChange={(e) => setMinTradeSize(parseInt(e.target.value))}
                className="px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-white"
              >
                <option value={10000}>10K+ shares (Retail/Small Inst)</option>
                <option value={25000}>25K+ shares (Institutional)</option>
                <option value={50000}>50K+ shares (Large Institutions)</option>
                <option value={100000}>100K+ shares (Major Institutions)</option>
                <option value={250000}>250K+ shares (Institutional Programs)</option>
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
              <svg className="animate-spin h-8 w-8 text-indigo-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xl text-gray-300">Detecting institutional flow patterns...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Smart Money Flow Tab */}
            {(activeTab === 'smart_money' || activeTab === 'comprehensive') && (
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2 text-green-400">
                  <Zap size={20} />
                  Smart Money Flow ({smartMoneyFlow.length})
                </h3>
                
                {smartMoneyFlow.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Zap className="mx-auto mb-4" size={48} />
                    <p>No significant smart money flow detected.</p>
                    <p className="text-sm mt-2">Institutional activity may be limited at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {smartMoneyFlow.map((flow, index) => (
                      <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-white">{flow.ticker}</span>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(flow.smartMoneyScore)}`}>
                              Score: {flow.smartMoneyScore}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold border flex items-center gap-1 ${getFlowColor(flow.direction)}`}>
                              {getFlowIcon(flow.direction)}
                              {flow.direction}
                            </div>
                            <span className="text-gray-300">{formatPrice(flow.currentPrice)}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-indigo-400">
                              {formatNumber(flow.totalValue)}
                            </div>
                            <div className="text-xs text-gray-400">Total Value</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Buy Pressure</div>
                            <div className="font-bold text-green-400">{formatPercent(flow.buyPressure)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Sell Pressure</div>
                            <div className="font-bold text-red-400">{formatPercent(flow.sellPressure)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Avg Trade Size</div>
                            <div className="font-bold text-white">{formatNumber(flow.avgTradeSize)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Trade Count</div>
                            <div className="font-bold text-blue-400">{flow.tradeCount}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Dark Pool %</div>
                            <div className="font-bold text-purple-400">{formatPercent(flow.darkPoolRatio)}</div>
                          </div>
                        </div>
                        
                        <div className={`text-sm px-3 py-2 rounded border ${getClassificationColor(flow.classification)}`}>
                          {flow.classification} • Institutional Confidence: {flow.avgInstitutionalScore}%
                        </div>

                        {flow.topTrades && flow.topTrades.length > 0 && (
                          <div className="mt-3">
                            <div className="text-sm text-gray-400 mb-2">Top Recent Trades:</div>
                            <div className="space-y-1">
                              {flow.topTrades.map((trade, i) => (
                                <div key={i} className="flex items-center justify-between text-sm bg-gray-800/50 px-3 py-1 rounded">
                                  <span>{formatNumber(trade.size)} @ {formatPrice(trade.price)}</span>
                                  <span className="text-gray-400">{formatNumber(trade.value)} • {trade.time}</span>
                                  {trade.darkPool && <span className="text-purple-400 text-xs">DP</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Block Trades Tab */}
            {(activeTab === 'block_trades' || activeTab === 'comprehensive') && (
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2 text-orange-400">
                  <Building2 size={20} />
                  Institutional Block Trades ({blockTrades.length})
                </h3>
                
                {blockTrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Building2 className="mx-auto mb-4" size={48} />
                    <p>No large block trades detected.</p>
                    <p className="text-sm mt-2">Lower the minimum size or try different time periods.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-3 text-gray-400">Ticker</th>
                          <th className="text-left py-2 px-3 text-gray-400">Time</th>
                          <th className="text-right py-2 px-3 text-gray-400">Size</th>
                          <th className="text-right py-2 px-3 text-gray-400">Price</th>
                          <th className="text-right py-2 px-3 text-gray-400">Value</th>
                          <th className="text-left py-2 px-3 text-gray-400">Exchange</th>
                          <th className="text-left py-2 px-3 text-gray-400">Classification</th>
                          <th className="text-right py-2 px-3 text-gray-400">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blockTrades.slice(0, 20).map((trade, index) => (
                          <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-700/20">
                            <td className="py-2 px-3 font-bold text-white">{trade.ticker}</td>
                            <td className="py-2 px-3 text-gray-400 text-xs">
                              {new Date(trade.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2 px-3 text-right font-bold">{formatNumber(trade.size)}</td>
                            <td className="py-2 px-3 text-right">{formatPrice(trade.price)}</td>
                            <td className="py-2 px-3 text-right font-bold text-green-400">
                              {formatNumber(trade.value)}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`text-xs px-2 py-1 rounded ${trade.darkPool ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {trade.exchange}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`text-xs px-2 py-1 rounded border ${getClassificationColor(trade.classification)}`}>
                                {trade.classification}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className={`font-bold px-2 py-1 rounded ${getScoreColor(trade.institutionalScore)}`}>
                                {trade.institutionalScore}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Dark Pool Analysis Tab */}
            {(activeTab === 'dark_pools' || activeTab === 'comprehensive') && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                  <Eye size={20} />
                  Dark Pool Activity Analysis ({darkPoolAnalysis.length})
                </h3>
                
                {darkPoolAnalysis.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Eye className="mx-auto mb-4" size={48} />
                    <p>No significant dark pool activity detected.</p>
                    <p className="text-sm mt-2">Dark pool analysis requires recent trading activity.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {darkPoolAnalysis.map((analysis, index) => (
                      <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-white">{analysis.ticker}</span>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(analysis.score)}`}>
                              Activity Score: {analysis.score}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold border ${analysis.classification === 'HIGH_ACTIVITY' ? 'text-red-400 bg-red-500/20 border-red-500/30' : analysis.classification === 'MODERATE_ACTIVITY' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' : 'text-green-400 bg-green-500/20 border-green-500/30'}`}>
                              {analysis.classification}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-400">
                              {formatPercent(analysis.darkPoolPercentage)}
                            </div>
                            <div className="text-xs text-gray-400">Dark Pool Volume</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Total Volume</div>
                            <div className="font-bold text-white">{formatNumber(analysis.totalVolume)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Lit Markets</div>
                            <div className="font-bold text-blue-400">{formatPercent(analysis.litPercentage)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Dark Pool VWAP</div>
                            <div className="font-bold text-purple-400">{formatPrice(analysis.darkPoolVWAP)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Lit VWAP</div>
                            <div className="font-bold text-blue-400">{formatPrice(analysis.litVWAP)}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">VWAP Spread</div>
                            <div className="font-bold text-yellow-400">{formatPrice(analysis.vwapSpread)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Dark Pool Trades</div>
                            <div className="font-bold text-purple-400">{formatNumber(analysis.tradeCount.darkPool)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Lit Trades</div>
                            <div className="font-bold text-blue-400">{formatNumber(analysis.tradeCount.lit)}</div>
                          </div>
                        </div>

                        {/* Unusual Activity Indicators */}
                        {analysis.unusualActivity && (
                          <div className="bg-gray-800/50 rounded p-3">
                            <div className="text-sm text-gray-400 mb-2">Unusual Activity Indicators:</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className={`flex items-center gap-2 ${analysis.unusualActivity.highDarkPoolRatio ? 'text-orange-400' : 'text-gray-500'}`}>
                                <div className={`w-2 h-2 rounded-full ${analysis.unusualActivity.highDarkPoolRatio ? 'bg-orange-400' : 'bg-gray-600'}`}></div>
                                High Dark Pool Ratio
                              </div>
                              <div className={`flex items-center gap-2 ${analysis.unusualActivity.largeVWAPSpread ? 'text-orange-400' : 'text-gray-500'}`}>
                                <div className={`w-2 h-2 rounded-full ${analysis.unusualActivity.largeVWAPSpread ? 'bg-orange-400' : 'bg-gray-600'}`}></div>
                                Large VWAP Spread
                              </div>
                              <div className={`flex items-center gap-2 ${analysis.unusualActivity.concentratedTiming ? 'text-orange-400' : 'text-gray-500'}`}>
                                <div className={`w-2 h-2 rounded-full ${analysis.unusualActivity.concentratedTiming ? 'bg-orange-400' : 'bg-gray-600'}`}></div>
                                Concentrated Timing
                              </div>
                              <div className={`flex items-center gap-2 ${analysis.unusualActivity.sizeDistribution === 'UNIFORM_PROGRAM' ? 'text-orange-400' : 'text-gray-500'}`}>
                                <div className={`w-2 h-2 rounded-full ${analysis.unusualActivity.sizeDistribution === 'UNIFORM_PROGRAM' ? 'bg-orange-400' : 'bg-gray-600'}`}></div>
                                Program Trading Pattern
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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

export default InstitutionalFlow;