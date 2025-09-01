'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Activity, BarChart3, Target, Zap, Settings, Download, RefreshCw } from 'lucide-react';

const MassScanner = () => {
  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanCriteria, setScanCriteria] = useState([]);
  const [selectedScan, setSelectedScan] = useState('MOMENTUM_BREAKOUT');
  const [filters, setFilters] = useState({
    minPrice: 1,
    maxPrice: 10000,
    minVolume: 100000,
    minMarketCap: 0,
    sectors: []
  });
  const [sortConfig, setSortConfig] = useState({ sortBy: 'change', sortOrder: 'desc' });
  const [summary, setSummary] = useState({});
  const [availableSectors, setAvailableSectors] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [totalScanned, setTotalScanned] = useState(0);

  useEffect(() => {
    fetchScanCriteria();
    fetchSectors();
    performScan(); // Initial scan
  }, []);

  const fetchScanCriteria = async () => {
    try {
      const response = await fetch('/api/mass-scanner?action=criteria');
      const data = await response.json();
      if (data.success) {
        setScanCriteria(data.criteria);
      }
    } catch (error) {
      console.error('Error fetching scan criteria:', error);
    }
  };

  const fetchSectors = async () => {
    try {
      const response = await fetch('/api/mass-scanner?action=sectors');
      const data = await response.json();
      if (data.success) {
        setAvailableSectors(data.sectors);
      }
    } catch (error) {
      console.error('Error fetching sectors:', error);
    }
  };

  const performScan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mass-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanType: selectedScan,
          filters,
          sortBy: sortConfig.sortBy,
          sortOrder: sortConfig.sortOrder,
          limit: 100,
          ...filters
        })
      });

      const data = await response.json();
      if (data.success) {
        setScanResults(data.results);
        setSummary(data.summary);
        setTotalScanned(data.summary.totalScanned);
      } else {
        console.error('Scan failed:', data.error);
      }
    } catch (error) {
      console.error('Error performing scan:', error);
    }
    setLoading(false);
  };

  const exportResults = () => {
    if (scanResults.length === 0) return;
    
    const headers = Object.keys(scanResults[0]).join(',');
    const csv = [headers, ...scanResults.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    )].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mass-scan-${selectedScan}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleSort = (field) => {
    const newOrder = sortConfig.sortBy === field && sortConfig.sortOrder === 'desc' ? 'asc' : 'desc';
    setSortConfig({ sortBy: field, sortOrder: newOrder });
  };

  const getSortIcon = (field) => {
    if (sortConfig.sortBy !== field) return null;
    return sortConfig.sortOrder === 'desc' ? '↓' : '↑';
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const formatNumber = (num) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const selectedCriteria = scanCriteria.find(c => c.id === selectedScan);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Search className="text-blue-400" size={32} />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500">
            Mass Scanner Pro
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400 bg-gray-800/50 px-3 py-2 rounded-lg">
            Scanning: {formatNumber(totalScanned)} stocks
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Scan Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Scan Type</label>
            <select
              value={selectedScan}
              onChange={(e) => setSelectedScan(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white"
            >
              {scanCriteria.map(criteria => (
                <option key={criteria.id} value={criteria.id}>{criteria.name}</option>
              ))}
            </select>
            {selectedCriteria && (
              <p className="text-xs text-gray-400 mt-1">{selectedCriteria.description}</p>
            )}
          </div>

          {/* Sort Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
            <select
              value={sortConfig.sortBy}
              onChange={(e) => setSortConfig({...sortConfig, sortBy: e.target.value})}
              className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white"
            >
              <option value="change">% Change</option>
              <option value="volume">Volume</option>
              <option value="price">Price</option>
              <option value="marketCap">Market Cap</option>
              <option value="momentumScore">Momentum Score</option>
              <option value="technicalScore">Technical Score</option>
              <option value="shortSqueezeScore">Squeeze Score</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <button
              onClick={performScan}
              disabled={loading}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                loading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin" size={16} />
                  Scanning...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Zap size={16} />
                  SCAN NOW
                </span>
              )}
            </button>
            <button
              onClick={exportResults}
              disabled={scanResults.length === 0}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 rounded-lg transition-all"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t border-gray-700 pt-4 space-y-4">
            <h4 className="font-bold text-gray-300 flex items-center gap-2">
              <Filter size={16} />
              Advanced Filters
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Price ($)</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-gray-900/50 rounded border border-gray-600 focus:border-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Price ($)</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: parseFloat(e.target.value) || 10000})}
                  className="w-full px-3 py-2 bg-gray-900/50 rounded border border-gray-600 focus:border-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Volume</label>
                <input
                  type="number"
                  value={filters.minVolume}
                  onChange={(e) => setFilters({...filters, minVolume: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-gray-900/50 rounded border border-gray-600 focus:border-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Market Cap</label>
                <select
                  value={filters.minMarketCap}
                  onChange={(e) => setFilters({...filters, minMarketCap: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-900/50 rounded border border-gray-600 focus:border-blue-500 text-white"
                >
                  <option value={0}>Any Size</option>
                  <option value={300000000}>Small Cap ($300M+)</option>
                  <option value={2000000000}>Mid Cap ($2B+)</option>
                  <option value={10000000000}>Large Cap ($10B+)</option>
                </select>
              </div>
            </div>

            {/* Sector Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sectors (select multiple)</label>
              <div className="flex flex-wrap gap-2">
                {availableSectors.map(sector => (
                  <button
                    key={sector}
                    onClick={() => {
                      const newSectors = filters.sectors.includes(sector)
                        ? filters.sectors.filter(s => s !== sector)
                        : [...filters.sectors, sector];
                      setFilters({...filters, sectors: newSectors});
                    }}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      filters.sectors.includes(sector)
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-blue-500'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {summary.totalReturned > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Found</span>
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <div className="text-2xl font-bold text-green-400">{summary.totalReturned}</div>
            <div className="text-sm text-gray-500">from {formatNumber(summary.totalScanned)} scanned</div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg Change</span>
              <Activity className="text-blue-400" size={20} />
            </div>
            <div className={`text-2xl font-bold ${getChangeColor(summary.avgChange || 0)}`}>
              {summary.avgChange ? `${summary.avgChange.toFixed(2)}%` : '0%'}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg Volume</span>
              <BarChart3 className="text-purple-400" size={20} />
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {formatNumber(summary.avgVolume || 0)}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-4 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Top Sector</span>
              <Target className="text-yellow-400" size={20} />
            </div>
            <div className="text-lg font-bold text-yellow-400">
              {summary.topSectors?.[0]?.sector || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">
              {summary.topSectors?.[0]?.count || 0} stocks
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('ticker')}>
                  Ticker {getSortIcon('ticker')}
                </th>
                <th className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('price')}>
                  Price {getSortIcon('price')}
                </th>
                <th className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('change')}>
                  Change {getSortIcon('change')}
                </th>
                <th className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('volume')}>
                  Volume {getSortIcon('volume')}
                </th>
                <th className="text-left p-4 text-gray-400 font-medium">Sector</th>
                <th className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('marketCap')}>
                  Market Cap {getSortIcon('marketCap')}
                </th>
                <th className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('momentumScore')}>
                  Momentum {getSortIcon('momentumScore')}
                </th>
                <th className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('technicalScore')}>
                  Technical {getSortIcon('technicalScore')}
                </th>
              </tr>
            </thead>
            <tbody>
              {scanResults.map((stock, index) => (
                <tr key={stock.ticker} className="border-t border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-blue-400">{stock.ticker}</div>
                  </td>
                  <td className="p-4 text-white font-medium">
                    ${stock.price?.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`font-bold ${getChangeColor(stock.change)}`}>
                      {stock.change > 0 ? '+' : ''}{stock.change?.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">
                    {formatNumber(stock.volume)}
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {stock.sector}
                  </td>
                  <td className="p-4 text-gray-300">
                    {formatNumber(stock.marketCap)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getScoreColor(stock.momentumScore || 0)}`}>
                      {(stock.momentumScore || 0).toFixed(0)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getScoreColor(stock.technicalScore || 0)}`}>
                      {(stock.technicalScore || 0).toFixed(0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {scanResults.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-400">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>No results found. Try adjusting your scan criteria or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MassScanner;