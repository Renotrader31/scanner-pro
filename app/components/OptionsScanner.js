'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, DollarSign, Clock, Target } from 'lucide-react';

export default function OptionsScanner() {
  const [loading, setLoading] = useState(false);
  const [optionsData, setOptionsData] = useState([]);
  const [scanType, setScanType] = useState('unusual_activity');
  const [filters, setFilters] = useState({
    minVolume: 1000,
    minOI: 500,
    maxStrike: 1000,
    expiryDays: 30
  });

  const scanTypes = [
    { id: 'unusual_activity', name: 'Unusual Activity', icon: Activity, color: 'text-blue-400' },
    { id: 'high_gamma', name: 'High Gamma', icon: TrendingUp, color: 'text-green-400' },
    { id: 'high_iv', name: 'High IV', icon: AlertTriangle, color: 'text-yellow-400' },
    { id: 'flow', name: 'Options Flow', icon: DollarSign, color: 'text-purple-400' }
  ];

  const generateMockOptionsData = (type) => {
    const baseSymbols = ['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'MSFT', 'GOOGL', 'META', 'AMD', 'NFLX'];
    const data = [];
    
    for (let i = 0; i < 15; i++) {
      const symbol = baseSymbols[Math.floor(Math.random() * baseSymbols.length)];
      const isCall = Math.random() > 0.5;
      const basePrice = Math.random() * 500 + 50;
      const strike = Math.round((basePrice + (Math.random() - 0.5) * basePrice * 0.3) / 5) * 5;
      
      const daysToExpiry = Math.floor(Math.random() * filters.expiryDays) + 1;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysToExpiry);
      
      let volume, oi, iv, premium, gamma, delta, theta, vega;
      
      switch (type) {
        case 'unusual_activity':
          volume = Math.floor(Math.random() * 50000) + filters.minVolume;
          oi = Math.floor(Math.random() * 20000) + filters.minOI;
          break;
        case 'high_gamma':
          gamma = Math.random() * 0.05 + 0.01;
          volume = Math.floor(Math.random() * 10000) + 500;
          break;
        case 'high_iv':
          iv = Math.random() * 200 + 100;
          volume = Math.floor(Math.random() * 5000) + 200;
          break;
        case 'flow':
          volume = Math.floor(Math.random() * 100000) + 5000;
          break;
        default:
          volume = Math.floor(Math.random() * 10000) + 1000;
      }
      
      // Generate realistic options Greeks
      premium = Math.random() * 50 + 0.5;
      delta = isCall ? Math.random() * 0.8 + 0.1 : -(Math.random() * 0.8 + 0.1);
      gamma = gamma || Math.random() * 0.03 + 0.001;
      theta = -(Math.random() * 0.5 + 0.01);
      vega = Math.random() * 0.3 + 0.05;
      iv = iv || Math.random() * 100 + 30;
      oi = oi || Math.floor(Math.random() * 10000) + 500;
      
      const unusualScore = calculateUnusualScore(volume, oi, iv);
      
      data.push({
        id: i,
        symbol,
        type: isCall ? 'CALL' : 'PUT',
        strike,
        expiry: expiryDate.toLocaleDateString(),
        daysToExpiry,
        volume,
        openInterest: oi,
        premium: premium.toFixed(2),
        iv: iv.toFixed(1),
        delta: delta.toFixed(3),
        gamma: gamma.toFixed(4),
        theta: theta.toFixed(3),
        vega: vega.toFixed(3),
        unusualScore,
        sentiment: getSentiment(type, isCall, unusualScore),
        flow: volume * parseFloat(premium.toFixed(2)) * 100 // Contract value
      });
    }
    
    return data.sort((a, b) => {
      switch (type) {
        case 'unusual_activity':
          return b.unusualScore - a.unusualScore;
        case 'high_gamma':
          return parseFloat(b.gamma) - parseFloat(a.gamma);
        case 'high_iv':
          return parseFloat(b.iv) - parseFloat(a.iv);
        case 'flow':
          return b.flow - a.flow;
        default:
          return b.volume - a.volume;
      }
    });
  };

  const calculateUnusualScore = (volume, oi, iv) => {
    const volOiRatio = volume / (oi || 1);
    const ivWeight = iv / 100;
    return Math.min(100, (volOiRatio * 20 + ivWeight * 10));
  };

  const getSentiment = (type, isCall, score) => {
    if (type === 'flow') {
      return isCall ? 'BULLISH' : 'BEARISH';
    }
    if (score > 70) return 'EXTREME';
    if (score > 50) return 'HIGH';
    if (score > 30) return 'MODERATE';
    return 'LOW';
  };

  const handleScan = async () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const data = generateMockOptionsData(scanType);
      setOptionsData(data);
      setLoading(false);
    }, 1500);
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'EXTREME': return 'bg-red-500 text-white';
      case 'BULLISH': return 'bg-green-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MODERATE': return 'bg-yellow-500 text-black';
      case 'BEARISH': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatFlow = (flow) => {
    if (flow > 1000000) return `$${(flow / 1000000).toFixed(1)}M`;
    if (flow > 1000) return `$${(flow / 1000).toFixed(1)}K`;
    return `$${flow.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      {/* Scanner Types */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {scanTypes.map(type => {
          const IconComponent = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setScanType(type.id)}
              className={`p-4 rounded-lg border transition-all ${
                scanType === type.id 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-blue-500 text-white' 
                  : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <IconComponent size={24} className={`mx-auto mb-2 ${type.color}`} />
              <div className="text-sm font-medium">{type.name}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-lg font-bold mb-4 text-purple-400">Options Filters</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Min Volume</label>
            <input
              type="number"
              value={filters.minVolume}
              onChange={(e) => setFilters({...filters, minVolume: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Min Open Interest</label>
            <input
              type="number"
              value={filters.minOI}
              onChange={(e) => setFilters({...filters, minOI: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Strike ($)</label>
            <input
              type="number"
              value={filters.maxStrike}
              onChange={(e) => setFilters({...filters, maxStrike: parseInt(e.target.value) || 1000})}
              className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Days to Expiry</label>
            <input
              type="number"
              value={filters.expiryDays}
              onChange={(e) => setFilters({...filters, expiryDays: parseInt(e.target.value) || 30})}
              className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
            />
          </div>
        </div>
      </div>

      {/* Scan Button */}
      <button
        onClick={handleScan}
        disabled={loading}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all transform ${
          loading 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 hover:scale-[1.02] shadow-lg text-white'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scanning Options...
          </span>
        ) : (
          `SCAN ${scanTypes.find(t => t.id === scanType)?.name.toUpperCase()} 🎯`
        )}
      </button>

      {/* Results */}
      {optionsData.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-purple-400">
              {scanTypes.find(t => t.id === scanType)?.name} Results
            </h3>
            <div className="text-sm text-gray-400">
              {optionsData.length} contracts found
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left pb-3 text-gray-400">Symbol</th>
                  <th className="text-left pb-3 text-gray-400">Type</th>
                  <th className="text-left pb-3 text-gray-400">Strike</th>
                  <th className="text-left pb-3 text-gray-400">Expiry</th>
                  <th className="text-left pb-3 text-gray-400">Volume</th>
                  <th className="text-left pb-3 text-gray-400">OI</th>
                  <th className="text-left pb-3 text-gray-400">Premium</th>
                  <th className="text-left pb-3 text-gray-400">IV</th>
                  {scanType === 'high_gamma' && <th className="text-left pb-3 text-gray-400">Gamma</th>}
                  {scanType === 'flow' && <th className="text-left pb-3 text-gray-400">Flow Value</th>}
                  <th className="text-left pb-3 text-gray-400">Signal</th>
                </tr>
              </thead>
              <tbody>
                {optionsData.slice(0, 20).map((option, i) => (
                  <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all">
                    <td className="py-3 font-bold text-blue-400">{option.symbol}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        option.type === 'CALL' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {option.type}
                      </span>
                    </td>
                    <td className="py-3">${option.strike}</td>
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="text-sm">{option.expiry}</span>
                        <span className="text-xs text-gray-500">{option.daysToExpiry}d</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">
                        {option.volume.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">
                        {option.openInterest.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3">${option.premium}</td>
                    <td className="py-3">{option.iv}%</td>
                    {scanType === 'high_gamma' && (
                      <td className="py-3 text-green-400">{option.gamma}</td>
                    )}
                    {scanType === 'flow' && (
                      <td className="py-3 font-bold text-purple-400">{formatFlow(option.flow)}</td>
                    )}
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSentimentColor(option.sentiment)}`}>
                        {option.sentiment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}