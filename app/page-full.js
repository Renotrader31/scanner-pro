'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Bell, TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Settings, Plus, X, Search, Filter, AlertTriangle, Eye, EyeOff, Star, Target } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OptionsScanner from './components/OptionsScanner';
import AlertsPanel from './components/AlertsPanel';
import MarketHeatmap from './components/MarketHeatmap';
import AIRecommendations from './components/AIRecommendations';
import MassScanner from './components/MassScanner';
import MLTradingSystemEnhanced from './components/MLTradingSystemEnhanced';
import TechnicalDashboard from './components/TechnicalDashboard';
import InstitutionalFlow from './components/InstitutionalFlow';

export default function Home() {
  const [activeTab, setActiveTab] = useState('mass');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [tickers, setTickers] = useState('SPY,QQQ,AAPL,TSLA,NVDA');
  const [shortTickers, setShortTickers] = useState('AMC,GME,BBBY,ATER,MULN');
  const [topMovers, setTopMovers] = useState({ gainers: [], losers: [] });
  const [marketStatus, setMarketStatus] = useState('');
  const [watchlist, setWatchlist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showWatchlist, setShowWatchlist] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState('SPY');
  const [filters, setFilters] = useState({ minPrice: 0, maxPrice: 1000, minVolume: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize with default data first
    updateMarketStatus();
    initializeWatchlist();
    
    // Then try to fetch live data (don't block UI if it fails)
    const loadData = async () => {
      try {
        await fetchTopMovers();
        await fetchChartData(selectedTicker);
      } catch (error) {
        console.log('Initial data fetch failed, using defaults:', error);
      }
    };
    
    loadData();
    
    const interval = setInterval(() => {
      updateMarketStatus();
      refreshLiveData();
    }, 60000); // Reduced from 30s to 60s to prevent API overload
    return () => clearInterval(interval);
  }, []);

  const initializeWatchlist = () => {
    const defaultWatchlist = [
      { ticker: 'SPY', name: 'SPDR S&P 500 ETF' },
      { ticker: 'QQQ', name: 'Invesco QQQ Trust' },
      { ticker: 'AAPL', name: 'Apple Inc.' },
      { ticker: 'TSLA', name: 'Tesla Inc.' },
      { ticker: 'NVDA', name: 'NVIDIA Corporation' }
    ];
    setWatchlist(defaultWatchlist);
  };

  const refreshLiveData = () => {
    if (showWatchlist) {
      fetchWatchlistData();
    }
    if (showCharts) {
      fetchChartData(selectedTicker);
    }
  };

  const fetchWatchlistData = async () => {
    const updatedWatchlist = [];
    for (const item of watchlist) {
      try {
        const res = await fetch(`/api/polygon?endpoint=/v2/aggs/ticker/${item.ticker}/prev`);
        if (res.ok) {
          const data = await res.json();
          if (data.results?.[0]) {
            const r = data.results[0];
            updatedWatchlist.push({
              ...item,
              price: r.c,
              change: ((r.c - r.o) / r.o * 100).toFixed(2),
              volume: r.v,
              high: r.h,
              low: r.l
            });
          }
        } else {
          // Silently skip failed API calls to avoid 500 error spam
          console.log(`API temporarily unavailable for ${item.ticker}`);
          updatedWatchlist.push(item); // Keep existing data
        }
      } catch (error) {
        console.log(`Network error for ${item.ticker}, keeping existing data`);
        updatedWatchlist.push(item); // Keep existing data
      }
    }
    setWatchlist(updatedWatchlist);
  };

  const fetchChartData = async (ticker) => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = getDateDaysAgo(30);
      const res = await fetch(`/api/polygon?endpoint=/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}`);
      
      if (!res.ok) {
        console.log(`Chart data temporarily unavailable for ${ticker}`);
        return;
      }
      
      const data = await res.json();
      
      if (data.results) {
        const formattedData = data.results.map((item, index) => ({
          name: `Day ${index + 1}`,
          price: item.c,
          volume: item.v,
          high: item.h,
          low: item.l,
          date: new Date(item.t).toLocaleDateString()
        }));
        setChartData(formattedData);
      }
    } catch (error) {
      console.log('Chart data network error, keeping existing data');
    }
  };

  const addToWatchlist = (ticker, name) => {
    if (!watchlist.find(item => item.ticker === ticker)) {
      setWatchlist([...watchlist, { ticker, name: name || ticker }]);
      toast.success(`Added ${ticker} to watchlist`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const removeFromWatchlist = (ticker) => {
    setWatchlist(watchlist.filter(item => item.ticker !== ticker));
    toast.info(`Removed ${ticker} from watchlist`);
  };

  const createAlert = (ticker, price, condition) => {
    const newAlert = {
      id: Date.now(),
      ticker,
      price,
      condition, // 'above' or 'below'
      type: 'price',
      created: new Date().toLocaleString(),
      active: true,
      triggered: false
    };
    setAlerts([...alerts, newAlert]);
    toast.success(`Alert created for ${ticker}`, {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const checkAlerts = (tickerData) => {
    const updatedAlerts = [...alerts];
    let alertTriggered = false;
    
    alerts.forEach((alert, index) => {
      if (alert.active && !alert.triggered && alert.ticker === tickerData.ticker) {
        const shouldTrigger = 
          (alert.condition === 'above' && tickerData.price >= alert.price) ||
          (alert.condition === 'below' && tickerData.price <= alert.price);
          
        if (shouldTrigger) {
          updatedAlerts[index] = { ...alert, triggered: true, active: false };
          triggerAlert(alert, tickerData);
          alertTriggered = true;
        }
      }
    });
    
    if (alertTriggered) {
      setAlerts(updatedAlerts);
    }
  };

  const triggerAlert = (alert, tickerData) => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
    toast.warning(`🚨 ALERT: ${alert.ticker} is ${alert.condition} $${alert.price} (Current: $${tickerData.price.toFixed(2)})`, {
      position: "top-center",
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const updateMarketStatus = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay();
    
    if (day === 0 || day === 6) {
      setMarketStatus('🔴 Weekend - Market Closed');
    } else if ((hour === 9 && minute >= 30) || (hour > 9 && hour < 16)) {
      setMarketStatus('🟢 Market Open');
    } else if ((hour === 4 && minute < 30) || (hour > 4 && hour < 9) || (hour === 9 && minute < 30)) {
      setMarketStatus('🟡 Pre-Market');
    } else if (hour >= 16 && hour < 20) {
      setMarketStatus('🟡 After-Hours');
    } else {
      setMarketStatus('🔴 Market Closed');
    }
  };

  const fetchTopMovers = async () => {
    try {
      const watchTickers = ['AAPL','MSFT','GOOGL','AMZN','NVDA','TSLA','META','AMD','NFLX','SPY'];
      const movers = [];
      
      for (const ticker of watchTickers) {
        try {
          const res = await fetch(`/api/polygon?endpoint=/v2/aggs/ticker/${ticker}/prev`);
          if (res.ok) {
            const data = await res.json();
            if (data.results?.[0]) {
              const r = data.results[0];
              const change = ((r.c - r.o) / r.o * 100);
              movers.push({ 
                ticker, 
                change: change.toFixed(2), 
                price: r.c,
                volume: r.v
              });
            }
          } else {
            // Silently skip failed API calls
            console.log(`API temporarily unavailable for ${ticker}`);
          }
        } catch (error) {
          console.log(`Network error for ${ticker}, skipping`);
        }
      }
    
      const sorted = movers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      setTopMovers({
        gainers: movers.filter(m => m.change > 0).slice(0, 3),
        losers: movers.filter(m => m.change < 0).slice(0, 3)
      });
    } catch (error) {
      console.log('Error fetching top movers:', error);
      // Set default empty movers on error
      setTopMovers({ gainers: [], losers: [] });
    }
  };

  // Helper functions
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const scanStocks = async () => {
    setLoading(true);
    setResults([]);
    
    if (activeTab === 'volume') {
      await scanVolumeSurge();
      return;
    }
    
    if (activeTab === 'momentum') {
      await scanMomentum();
      return;
    }
    
    const tickerList = (activeTab === 'shorts' ? shortTickers : tickers)
      .split(',').map(t => t.trim());
    const scanResults = [];
    
    for (const ticker of tickerList) {
      try {
        const res = await fetch(`/api/polygon?endpoint=/v2/aggs/ticker/${ticker}/prev`);
        const data = await res.json();
        
        if (data.results?.[0]) {
          const r = data.results[0];
          const result = {
            ticker,
            price: r.c,
            change: ((r.c - r.o) / r.o * 100).toFixed(2),
            volume: r.v,
            high: r.h,
            low: r.l
          };
          
          if (activeTab === 'shorts') {
            const ortexRes = await fetch(`/api/ortex?ticker=${ticker}`);
            const ortexData = await ortexRes.json();
            if (ortexData.data) {
              result.shortInterest = ortexData.data.shortInterestPercent;
              result.utilization = ortexData.data.utilizationRate;
              result.costToBorrow = ortexData.data.costToBorrow;
              result.daystocover = ortexData.data.daystocover;
              result.squeezeScore = calculateSqueezeScore(ortexData.data);
            }
          }
          
          scanResults.push(result);
        }
      } catch (error) {
        console.error(`Error fetching ${ticker}:`, error);
      }
    }
    
    // Apply filters to results
    const filteredResults = scanResults.filter(result => {
      const price = result.price || 0;
      const volume = (result.volume || 0) / 1000000; // Convert to millions
      return price >= filters.minPrice && 
             price <= filters.maxPrice && 
             volume >= filters.minVolume;
    });
    
    setResults(filteredResults);
    
    // Check alerts for each result
    filteredResults.forEach(result => {
      checkAlerts(result);
    });
    setLoading(false);
  };

  const scanVolumeSurge = async () => {
    const volumeTickers = ['SPY','QQQ','AAPL','TSLA','NVDA','AMD','MSFT','META','GOOGL','AMZN'];
    const scanResults = [];
    
    for (const ticker of volumeTickers) {
      try {
        const res = await fetch(`/api/polygon?endpoint=/v2/aggs/ticker/${ticker}/prev`);
        const data = await res.json();
        
        if (data.results?.[0]) {
          const r = data.results[0];
          const avgRes = await fetch(`/api/polygon?endpoint=/v2/aggs/ticker/${ticker}/range/1/day/${getDateDaysAgo(20)}/${getTodayDate()}`);
          const avgData = await avgRes.json();
          
          if (avgData.results && avgData.results.length > 0) {
            const avgVolume = avgData.results.reduce((sum, day) => sum + day.v, 0) / avgData.results.length;
            const volRatio = (r.v / avgVolume * 100).toFixed(0);
            
            if (parseInt(volRatio) > 120) {
              scanResults.push({
                ticker,
                price: r.c,
                change: ((r.c - r.o) / r.o * 100).toFixed(2),
                volume: r.v,
                avgVolume,
                volRatio,
                signal: parseInt(volRatio) > 300 ? 'EXTREME' : parseInt(volRatio) > 200 ? 'HIGH' : 'MODERATE'
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning ${ticker}:`, error);
      }
    }
    
    setResults(scanResults.sort((a, b) => parseInt(b.volRatio) - parseInt(a.volRatio)));
    setLoading(false);
  };

  const scanMomentum = async () => {
    const momentumTickers = ['AAPL','MSFT','GOOGL','AMZN','NVDA','TSLA','META','AMD','NFLX','CRM'];
    const scanResults = [];
    
    for (const ticker of momentumTickers) {
      try {
        const res = await fetch(`/api/polygon?endpoint=/v2/aggs/ticker/${ticker}/range/1/day/${getDateDaysAgo(5)}/${getTodayDate()}`);
        const data = await res.json();
        
        if (data.results && data.results.length >= 2) {
          const latest = data.results[data.results.length - 1];
          const start = data.results[0];
          const momentum = ((latest.c - start.c) / start.c * 100).toFixed(2);
          
          if (Math.abs(parseFloat(momentum)) > 3) {
            scanResults.push({
              ticker,
              price: latest.c,
              change: momentum,
              volume: latest.v,
              high: latest.h,
              low: latest.l,
              trend: parseFloat(momentum) > 0 ? 'BULLISH' : 'BEARISH'
            });
          }
        }
      } catch (error) {
        console.error(`Error scanning ${ticker}:`, error);
      }
    }
    
    setResults(scanResults.sort((a, b) => Math.abs(parseFloat(b.change)) - Math.abs(parseFloat(a.change))));
    setLoading(false);
  };

  const calculateSqueezeScore = (data) => {
    let score = 0;
    if (data.shortInterestPercent > 30) score += 30;
    else if (data.shortInterestPercent > 20) score += 20;
    else if (data.shortInterestPercent > 15) score += 10;
    
    if (data.utilizationRate > 95) score += 30;
    else if (data.utilizationRate > 90) score += 20;
    else if (data.utilizationRate > 85) score += 10;
    
    if (data.costToBorrow > 50) score += 30;
    else if (data.costToBorrow > 25) score += 20;
    else if (data.costToBorrow > 10) score += 10;
    
    return score;
  };

  const getSqueezeRating = (score) => {
    if (score >= 70) return { text: 'EXTREME', color: 'bg-red-500 text-white' };
    if (score >= 50) return { text: 'HIGH', color: 'bg-orange-500 text-white' };
    if (score >= 30) return { text: 'MODERATE', color: 'bg-yellow-500 text-black' };
    return { text: 'LOW', color: 'bg-green-500 text-white' };
  };

  const exportToCSV = () => {
    if (results.length === 0) return;
    const headers = Object.keys(results[0]).join(',');
    const csv = [headers, ...results.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <>
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+LyvmwhBTmZ2+/AciEELIHRob5cSAYRLBkaHhMqEQYSJhEJCwsIBg0EBAoJBwgVBAQJbgemlbK+mYkiHi4aGhocKhEGEyYRCQsLCAYNBAQKCQcIFQQECW4HppWyvpmJIh4uGhoaHCoRBhMmEQkLCwgGDQQECgkHCBUEBAlbBWTabjhZYw==" type="audio/wav" />
      </audio>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                  Ultimate Scanner Pro
                </span>
                <span className="ml-3">🚀</span>
              </h1>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowWatchlist(!showWatchlist)}
                  className={`p-2 rounded-lg transition-all ${showWatchlist ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  title="Toggle Watchlist"
                >
                  <Eye size={20} />
                </button>
                <button 
                  onClick={() => setShowCharts(!showCharts)}
                  className={`p-2 rounded-lg transition-all ${showCharts ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  title="Toggle Charts"
                >
                  <BarChart3 size={20} />
                </button>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-lg transition-all ${soundEnabled ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  title="Toggle Sound Alerts"
                >
                  <Bell size={20} />
                </button>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  title="Toggle Filters"
                >
                  <Filter size={20} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400 bg-gray-800/50 backdrop-blur px-4 py-2 rounded-full">
                {marketStatus}
              </div>
              <div className="text-sm text-gray-400 bg-gray-800/50 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2">
                <Activity size={16} />
                {alerts.filter(a => a.active).length} Active Alerts
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 mb-6 border border-gray-700/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Filter size={20} className="text-purple-400" />
                Advanced Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min Price ($)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Price ($)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: parseFloat(e.target.value) || 1000})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min Volume (M)</label>
                  <input
                    type="number"
                    value={filters.minVolume}
                    onChange={(e) => setFilters({...filters, minVolume: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-white"
                  />
                </div>
              </div>
            </div>
          )}

        {/* ===== MAIN SCANNER SECTION - MOVED TO TOP ===== */}
        {/* Tab Navigation - PRIORITY SCANNERS FIRST */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-2 mb-6 flex gap-2 flex-wrap">
          <button onClick={() => setActiveTab('mass')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'mass' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            🔍 Mass Scanner
          </button>
          <button onClick={() => setActiveTab('recs')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'recs' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            ⭐ AI Picks
          </button>
          <button onClick={() => setActiveTab('feedback')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'feedback' || activeTab === 'trading' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            🧠 ML Trading System
          </button>
          <button onClick={() => setActiveTab('options')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'options' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            <Target size={16} className="inline mr-1" /> Options Flow
          </button>
          <button onClick={() => setActiveTab('technicals')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'technicals' ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            <BarChart3 size={16} className="inline mr-1" /> Real Technicals
          </button>
          <button onClick={() => setActiveTab('institutional')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'institutional' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            🏛️ Institutional Flow
          </button>
          <button onClick={() => setActiveTab('squeeze')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'squeeze' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            🎯 Squeeze Scanner
          </button>
          <button onClick={() => setActiveTab('shorts')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'shorts' ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            🔥 Short Squeeze
          </button>
          <button onClick={() => setActiveTab('momentum')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'momentum' ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            🚀 Momentum
          </button>
          <button onClick={() => setActiveTab('volume')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'volume' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            📊 Volume Surge
          </button>
        </div>

        {/* PRIORITY SCANNER CONTENT - FIRST PRIORITY */}
        
        {/* Mass Scanner Section - FIRST PRIORITY */}
        {activeTab === 'mass' && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-gray-700/50">
            <MassScanner />
          </div>
        )}

        {/* AI Recommendations Section - SECOND PRIORITY */}
        {activeTab === 'recs' && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-gray-700/50">
            <AIRecommendations />
          </div>
        )}

        {/* ML TRADING SYSTEM - Enhanced with Quantum Trade AI Features */}
        {(activeTab === 'feedback' || activeTab === 'trading') && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-gray-700/50">
            <MLTradingSystemEnhanced />
          </div>
        )}


        {/* OPTIONS SCANNER - FOURTH PRIORITY */}
        {activeTab === 'options' && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-gray-700/50">
            <OptionsScanner />
          </div>
        )}

        {/* TECHNICAL DASHBOARD - FIFTH PRIORITY */}
        {activeTab === 'technicals' && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-gray-700/50">
            <TechnicalDashboard />
          </div>
        )}

        {/* INSTITUTIONAL FLOW - SIXTH PRIORITY */}
        {activeTab === 'institutional' && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-gray-700/50">
            <InstitutionalFlow />
          </div>
        )}

        {/* TRADITIONAL SCANNER CONTROLS - LOWER PRIORITY */}
        {activeTab !== 'recs' && activeTab !== 'options' && activeTab !== 'mass' && activeTab !== 'feedback' && activeTab !== 'trading' && activeTab !== 'technicals' && activeTab !== 'institutional' && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-gray-700/50">
            {(activeTab === 'squeeze' || activeTab === 'shorts') && (
              <input
                type="text"
                value={activeTab === 'shorts' ? shortTickers : tickers}
                onChange={(e) => activeTab === 'shorts' ? setShortTickers(e.target.value) : setTickers(e.target.value)}
                className="w-full px-4 py-3 mb-4 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white placeholder-gray-500"
                placeholder="Enter tickers separated by commas..."
              />
            )}
            
            <button
              onClick={scanStocks}
              disabled={loading}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all transform ${
                loading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 hover:scale-[1.02] shadow-lg'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scanning Markets...
                </span>
              ) : (
                `SCAN NOW ${activeTab === 'shorts' ? '🔥' : '🎯'}`
              )}
            </button>
          </div>
        )}

        {/* Results Section - Only show for traditional scanners */}
        {results.length > 0 && activeTab !== 'options' && activeTab !== 'mass' && activeTab !== 'recs' && activeTab !== 'feedback' && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Results</h2>
              <button onClick={exportToCSV} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-all flex items-center gap-2">
                <span>📥</span> Export CSV
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left pb-3 text-gray-400">Ticker</th>
                    <th className="text-left pb-3 text-gray-400">Price</th>
                    <th className="text-left pb-3 text-gray-400">Change</th>
                    <th className="text-left pb-3 text-gray-400">Volume</th>
                    {activeTab === 'shorts' && (
                      <>
                        <th className="text-left pb-3 text-gray-400">SI %</th>
                        <th className="text-left pb-3 text-gray-400">CTB %</th>
                        <th className="text-left pb-3 text-gray-400">Util %</th>
                        <th className="text-left pb-3 text-gray-400">Score</th>
                      </>
                    )}
                    {activeTab === 'volume' && (
                      <>
                        <th className="text-left pb-3 text-gray-400">Avg Volume</th>
                        <th className="text-left pb-3 text-gray-400">Vol Ratio</th>
                        <th className="text-left pb-3 text-gray-400">Signal</th>
                      </>
                    )}
                    {activeTab === 'momentum' && (
                      <th className="text-left pb-3 text-gray-400">Trend</th>
                    )}
                    {activeTab === 'squeeze' && (
                      <>
                        <th className="text-left pb-3 text-gray-400">High</th>
                        <th className="text-left pb-3 text-gray-400">Low</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all group">
                      <td className="py-3 font-bold text-blue-400 relative">
                        <div className="flex items-center gap-2">
                          {r.ticker}
                          <button 
                            onClick={() => addToWatchlist(r.ticker, `Scanner Result ${r.ticker}`)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-blue-400 hover:bg-blue-400/20 rounded transition-all"
                            title="Add to Watchlist"
                          >
                            <Plus size={14} />
                          </button>
                          <button 
                            onClick={() => createAlert(r.ticker, r.price, 'above')}
                            className="opacity-0 group-hover:opacity-100 p-1 text-yellow-400 hover:bg-yellow-400/20 rounded transition-all"
                            title="Create Alert"
                          >
                            <Bell size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3">${r.price?.toFixed(2)}</td>
                      <td className={`py-3 font-medium ${parseFloat(r.change) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(r.change) > 0 ? '+' : ''}{r.change}%
                      </td>
                      <td className="py-3">{(r.volume / 1000000).toFixed(1)}M</td>
                      {activeTab === 'shorts' && (
                        <>
                          <td className="py-3">{r.shortInterest?.toFixed(1)}%</td>
                          <td className="py-3">{r.costToBorrow?.toFixed(1)}%</td>
                          <td className="py-3">{r.utilization?.toFixed(1)}%</td>
                          <td className="py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSqueezeRating(r.squeezeScore || 0).color}`}>
                              {getSqueezeRating(r.squeezeScore || 0).text}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'volume' && (
                        <>
                          <td className="py-3">{(r.avgVolume / 1000000).toFixed(1)}M</td>
                          <td className="py-3">{r.volRatio}%</td>
                          <td className="py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              r.signal === 'EXTREME' ? 'bg-red-500' : 
                              r.signal === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'
                            } text-white`}>
                              {r.signal}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'momentum' && (
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            r.trend === 'BULLISH' ? 'bg-green-500' : 'bg-red-500'
                          } text-white`}>
                            {r.trend}
                          </span>
                        </td>
                      )}
                      {activeTab === 'squeeze' && (
                        <>
                          <td className="py-3">${r.high?.toFixed(2)}</td>
                          <td className="py-3">${r.low?.toFixed(2)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ===== END MAIN SCANNER SECTION ===== */}

          {/* Dashboard Grid - MOVED BELOW SCANNERS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Watchlist Panel */}
            {showWatchlist && (
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-blue-500/20 h-fit">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-blue-400 font-bold flex items-center gap-2">
                      <Star className="text-yellow-400" size={20} />
                      Watchlist
                    </h3>
                    <button 
                      onClick={() => fetchWatchlistData()}
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Refresh Watchlist"
                    >
                      <Activity size={16} />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {watchlist.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-all group">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{item.ticker}</span>
                          <span className="text-xs text-gray-400 truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            {item.price && (
                              <>
                                <div className="text-gray-300">${item.price.toFixed(2)}</div>
                                <div className={`text-xs ${parseFloat(item.change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {parseFloat(item.change) >= 0 ? '+' : ''}{item.change}%
                                </div>
                              </>
                            )}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button 
                              onClick={() => setSelectedTicker(item.ticker)}
                              className="p-1 text-green-400 hover:bg-green-400/20 rounded"
                              title="View Chart"
                            >
                              <BarChart3 size={14} />
                            </button>
                            <button 
                              onClick={() => removeFromWatchlist(item.ticker)}
                              className="p-1 text-red-400 hover:bg-red-400/20 rounded"
                              title="Remove"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Alerts Panel */}
                <AlertsPanel 
                  alerts={alerts}
                  setAlerts={setAlerts}
                  onCreateAlert={(alert) => {
                    setAlerts([...alerts, alert]);
                    toast.success(`Alert created for ${alert.ticker}`, {
                      position: "top-right",
                      autoClose: 3000,
                    });
                  }}
                  soundEnabled={soundEnabled}
                  setSoundEnabled={setSoundEnabled}
                />
              </div>
            )}
            
            {/* Charts Panel */}
            {showCharts && (
              <div className={showWatchlist ? "lg:col-span-8" : "lg:col-span-12"}>
                <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-green-500/20">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-green-400 font-bold flex items-center gap-2">
                      <TrendingUp size={20} />
                      Price Chart - {selectedTicker}
                    </h3>
                    <select 
                      value={selectedTicker} 
                      onChange={(e) => { setSelectedTicker(e.target.value); fetchChartData(e.target.value); }}
                      className="bg-gray-900/50 text-white rounded-lg px-3 py-1 border border-gray-600 focus:border-green-500 focus:outline-none"
                    >
                      <option value="SPY">SPY</option>
                      <option value="QQQ">QQQ</option>
                      <option value="AAPL">AAPL</option>
                      <option value="TSLA">TSLA</option>
                      <option value="NVDA">NVDA</option>
                      {watchlist.map(item => (
                        <option key={item.ticker} value={item.ticker}>{item.ticker}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '100%', height: 300 }}>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#9CA3AF"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            fontSize={12}
                            domain={['dataMin - 5', 'dataMax + 5']}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F3F4F6'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#10B981" 
                            fill="url(#colorPrice)" 
                            strokeWidth={2}
                          />
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        Loading chart data...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Movers Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-green-500/20">
              <h3 className="text-green-400 font-bold mb-3 flex items-center">
                <span className="text-2xl mr-2">📈</span> Top Gainers
              </h3>
              <div className="space-y-2">
                {topMovers.gainers.map((mover, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-all group">
                    <span className="font-bold text-white">{mover.ticker}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">${mover.price.toFixed(2)}</span>
                      <span className="text-green-400 font-bold bg-green-500/20 px-2 py-1 rounded">
                        +{mover.change}%
                      </span>
                      <button 
                        onClick={() => addToWatchlist(mover.ticker, `Gainer ${mover.ticker}`)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-blue-400 hover:bg-blue-400/20 rounded transition-all"
                        title="Add to Watchlist"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-red-500/20">
              <h3 className="text-red-400 font-bold mb-3 flex items-center">
                <span className="text-2xl mr-2">📉</span> Top Losers
              </h3>
              <div className="space-y-2">
                {topMovers.losers.map((mover, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-all group">
                    <span className="font-bold text-white">{mover.ticker}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">${mover.price.toFixed(2)}</span>
                      <span className="text-red-400 font-bold bg-red-500/20 px-2 py-1 rounded">
                        {mover.change}%
                      </span>
                      <button 
                        onClick={() => addToWatchlist(mover.ticker, `Loser ${mover.ticker}`)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-blue-400 hover:bg-blue-400/20 rounded transition-all"
                        title="Add to Watchlist"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market Heatmap Section */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-cyan-500/20">
            <MarketHeatmap />
          </div>
        </div>


      </div>
    </main>
    </>
  );
}
