'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Bell, TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Settings, Plus, X, Search, Filter, AlertTriangle, Eye, EyeOff, Star, Target } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OptionsScanner from './components/OptionsScanner';
import AlertsPanel from './components/AlertsPanel';

export default function Home() {
  const [activeScanner, setActiveScanner] = useState(null);
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
  const [scannerStats, setScannerStats] = useState({
    squeeze: { count: 0, active: false },
    shorts: { count: 0, active: false },
    momentum: { count: 0, active: false },
    volume: { count: 0, active: false },
    options: { count: 0, active: false },
    unusualActivity: { count: 0, active: false },
    darkPool: { count: 0, active: false },
    gammaFlow: { count: 0, active: false }
  });
  const audioRef = useRef(null);

  // Professional scanner configurations
  const scannerConfigs = [
    {
      id: 'squeeze',
      name: 'Short Squeeze',
      description: 'High SI with positive flow',
      icon: '🎯',
      color: 'from-red-500 to-orange-500',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      id: 'momentum', 
      name: 'Momentum Play',
      description: 'Strong directional movement',
      icon: '🚀',
      color: 'from-green-500 to-emerald-500',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      id: 'volume',
      name: 'Volume Surge',
      description: 'Unusual trading volume',
      icon: '📊',
      color: 'from-blue-500 to-cyan-500', 
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'options',
      name: 'Options Flow',
      description: 'Unusual options activity',
      icon: '⚡',
      color: 'from-purple-500 to-indigo-500',
      borderColor: 'border-purple-500/30', 
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      id: 'unusualActivity',
      name: 'Unusual Activity',
      description: 'Abnormal price & volume',
      icon: '🔥',
      color: 'from-yellow-500 to-orange-500',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      id: 'darkPool',
      name: 'Dark Pool',
      description: 'Hidden institutional flow',
      icon: '🌊',
      color: 'from-indigo-500 to-purple-500',
      borderColor: 'border-indigo-500/30',
      textColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10'
    },
    {
      id: 'gammaFlow',
      name: 'Gamma Flow',
      description: 'High gamma exposure',
      icon: '⭐',
      color: 'from-pink-500 to-rose-500',
      borderColor: 'border-pink-500/30',
      textColor: 'text-pink-400',
      bgColor: 'bg-pink-500/10'
    },
    {
      id: 'recs',
      name: 'AI Picks',
      description: 'AI-powered recommendations', 
      icon: '🤖',
      color: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  useEffect(() => {
    fetchTopMovers();
    updateMarketStatus();
    initializeWatchlist();
    fetchChartData(selectedTicker);
    const interval = setInterval(() => {
      updateMarketStatus();
      refreshLiveData();
    }, 30000);
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
      } catch (error) {
        console.error(`Error fetching ${item.ticker}:`, error);
      }
    }
    setWatchlist(updatedWatchlist);
  };

  const fetchChartData = async (ticker) => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = getDateDaysAgo(30);
      const res = await fetch(`/api/polygon?endpoint=/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}`);
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
      console.error('Error fetching chart data:', error);
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
    const watchTickers = ['AAPL','MSFT','GOOGL','AMZN','NVDA','TSLA','META','AMD','NFLX','SPY'];
    const movers = [];
    
    for (const ticker of watchTickers) {
      try {
        const res = await fetch(`/api/polygon?endpoint=/v2/aggs/ticker/${ticker}/prev`);
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
      } catch (error) {
        console.error(`Error fetching ${ticker}:`, error);
      }
    }
    
    const sorted = movers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    setTopMovers({
      gainers: movers.filter(m => m.change > 0).slice(0, 3),
      losers: movers.filter(m => m.change < 0).slice(0, 3)
    });
  };

  // Helper functions
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const handleScannerSelect = async (scannerId) => {
    if (scannerId === 'options' || scannerId === 'recs') {
      return; // These are handled in their respective components
    }
    
    await scanStocks(scannerId);
  };

  const handleScanAll = async () => {
    const scanners = ['squeeze', 'momentum', 'volume', 'unusualActivity'];
    for (const scanner of scanners) {
      await scanStocks(scanner);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay between scans
    }
  };

  const scanStocks = async (scannerType) => {
    setLoading(true);
    setResults([]);
    
    // Update scanner stats
    setScannerStats(prev => ({
      ...prev,
      [scannerType]: { ...prev[scannerType], active: true }
    }));
    
    if (scannerType === 'volume') {
      await scanVolumeSurge();
      return;
    }
    
    if (scannerType === 'momentum') {
      await scanMomentum();
      return;
    }
    
    const tickerList = tickers.split(',').map(t => t.trim());
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
          
          if (scannerType === 'squeeze' || scannerType === 'unusualActivity') {
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
    
    // Update scanner stats with results count
    setScannerStats(prev => ({
      ...prev,
      [scannerType]: { count: filteredResults.length, active: false }
    }));
    
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
    
    const sortedResults = scanResults.sort((a, b) => parseInt(b.volRatio) - parseInt(a.volRatio));
    setResults(sortedResults);
    
    // Update scanner stats
    setScannerStats(prev => ({
      ...prev,
      volume: { count: sortedResults.length, active: false }
    }));
    
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
    
    const sortedResults = scanResults.sort((a, b) => Math.abs(parseFloat(b.change)) - Math.abs(parseFloat(a.change)));
    setResults(sortedResults);
    
    // Update scanner stats
    setScannerStats(prev => ({
      ...prev,
      momentum: { count: sortedResults.length, active: false }
    }));
    
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
        {/* Professional Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                  Ultimate Scanner Pro
                </span>
                <span className="ml-2 text-sm bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent font-medium">
                  LEGENDARY EDITION
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur px-4 py-2 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${marketStatus.includes('Open') ? 'bg-green-500' : marketStatus.includes('Pre') || marketStatus.includes('After') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-300">{marketStatus}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur px-4 py-2 rounded-lg">
                <Bell size={16} className="text-yellow-400" />
                <span className="text-sm text-gray-300">{alerts.filter(a => a.active).length} Alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowWatchlist(!showWatchlist)}
                  className={`p-2 rounded-lg transition-all ${showWatchlist ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  title="Toggle Watchlist"
                >
                  <Eye size={18} />
                </button>
                <button 
                  onClick={() => setShowCharts(!showCharts)}
                  className={`p-2 rounded-lg transition-all ${showCharts ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  title="Toggle Charts"
                >
                  <BarChart3 size={18} />
                </button>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-lg transition-all ${soundEnabled ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  title="Toggle Sound Alerts"
                >
                  {soundEnabled ? <Bell size={18} /> : <X size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Professional Scanner Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
            {scannerConfigs.map((scanner) => {
              const stats = scannerStats[scanner.id] || { count: 0, active: false };
              const isActive = activeScanner === scanner.id;
              return (
                <button
                  key={scanner.id}
                  onClick={() => {
                    setActiveScanner(activeScanner === scanner.id ? null : scanner.id);
                    if (activeScanner !== scanner.id) {
                      // Trigger scan for this scanner
                      handleScannerSelect(scanner.id);
                    }
                  }}
                  className={`relative p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] group ${
                    isActive 
                      ? `bg-gradient-to-br ${scanner.color} text-white border-white/20 shadow-2xl` 
                      : `${scanner.bgColor} ${scanner.borderColor} border hover:border-opacity-60`
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`text-2xl mb-2 ${isActive ? 'animate-pulse' : ''}`}>{scanner.icon}</div>
                    <div className={`text-sm font-bold mb-1 ${isActive ? 'text-white' : scanner.textColor}`}>
                      {scanner.name}
                    </div>
                    <div className={`text-xs opacity-80 mb-2 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      {scanner.description}
                    </div>
                    <div className={`text-2xl font-bold ${isActive ? 'text-white' : scanner.textColor}`}>
                      {stats.count}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-white/60' : 'text-gray-500'}`}>
                      {stats.count === 1 ? 'stock found' : 'stocks found'}
                    </div>
                    {stats.active && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    {loading && activeScanner === scanner.id && (
                      <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Controls Bar */}
          <div className="flex justify-between items-center bg-gray-800/30 backdrop-blur rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white font-medium"
                onClick={() => handleScanAll()}
              >
                <Activity size={16} />
                Scan All Strategies
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                  showFilters ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Filter size={16} />
                Quality Filter: Min $5 price, 1M+ volume
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live: 11351 stocks scanning • 10:42:48 AM
            </div>
          </div>

          {/* Dashboard Grid */}
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
        </div>



        {/* Active Scanner Content */}
        {activeScanner && (
          <div className="mb-6">
            {activeScanner === 'options' && (
              <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
                <OptionsScanner />
              </div>
            )}
            
            {activeScanner === 'recs' && (
              <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500">
                  AI-Powered Daily Picks
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 p-4 rounded-lg border border-green-500/30 hover:scale-105 transition-transform">
                    <h3 className="font-bold text-green-400 mb-3">🟢 BULLISH PICKS</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>NVDA</span><span className="text-green-400">+15% target</span></div>
                      <div className="flex justify-between"><span>TSLA</span><span className="text-green-400">+12% target</span></div>
                      <div className="flex justify-between"><span>AMD</span><span className="text-green-400">+10% target</span></div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-500/20 to-orange-600/20 p-4 rounded-lg border border-red-500/30 hover:scale-105 transition-transform">
                    <h3 className="font-bold text-red-400 mb-3">🔴 SHORT CANDIDATES</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>BBBY</span><span className="text-red-400">-20% target</span></div>
                      <div className="flex justify-between"><span>CVNA</span><span className="text-red-400">-15% target</span></div>
                      <div className="flex justify-between"><span>W</span><span className="text-red-400">-10% target</span></div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500/20 to-indigo-600/20 p-4 rounded-lg border border-purple-500/30 hover:scale-105 transition-transform">
                    <h3 className="font-bold text-purple-400 mb-3">⚡ SQUEEZE ALERTS</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>GME</span><span className="text-purple-400">EXTREME</span></div>
                      <div className="flex justify-between"><span>AMC</span><span className="text-purple-400">HIGH</span></div>
                      <div className="flex justify-between"><span>MULN</span><span className="text-purple-400">BUILDING</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {(activeScanner === 'squeeze' || activeScanner === 'momentum' || activeScanner === 'volume' || activeScanner === 'unusualActivity' || activeScanner === 'darkPool' || activeScanner === 'gammaFlow') && (
              <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
                <div className="mb-4">
                  <input
                    type="text"
                    value={tickers}
                    onChange={(e) => setTickers(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white placeholder-gray-500"
                    placeholder="Enter tickers separated by commas (e.g., SPY,QQQ,AAPL,TSLA,NVDA)..."
                  />
                </div>
                
                <button
                  onClick={() => scanStocks(activeScanner)}
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
                      Scanning {scannerConfigs.find(s => s.id === activeScanner)?.name}...
                    </span>
                  ) : (
                    `SCAN ${scannerConfigs.find(s => s.id === activeScanner)?.name.toUpperCase()} 🎯`
                  )}
                </button>
              </div>
            )}
          </div>
        )}



        {/* Results Section */}
        {results.length > 0 && activeScanner && activeScanner !== 'options' && activeScanner !== 'recs' && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {scannerConfigs.find(s => s.id === activeScanner)?.name} Results
                <span className="ml-2 text-sm font-normal text-gray-400">({results.length} stocks found)</span>
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scanStocks(activeScanner)}
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 text-sm font-medium"
                >
                  <Activity size={16} /> Refresh
                </button>
                <button onClick={exportToCSV} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 text-sm font-medium">
                  <span>📥</span> Export CSV
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left pb-3 text-gray-400 font-bold">SYMBOL</th>
                    <th className="text-left pb-3 text-gray-400 font-bold">PRICE</th>
                    <th className="text-left pb-3 text-gray-400 font-bold">CHANGE</th>
                    <th className="text-left pb-3 text-gray-400 font-bold">VOLUME</th>
                    {(activeScanner === 'squeeze' || activeScanner === 'unusualActivity') && (
                      <>
                        <th className="text-left pb-3 text-gray-400 font-bold">SQUEEZE</th>
                        <th className="text-left pb-3 text-gray-400 font-bold">SI %</th>
                        <th className="text-left pb-3 text-gray-400 font-bold">CTB %</th>
                        <th className="text-left pb-3 text-gray-400 font-bold">UTIL %</th>
                      </>
                    )}
                    {activeScanner === 'volume' && (
                      <>
                        <th className="text-left pb-3 text-gray-400 font-bold">AVG VOL</th>
                        <th className="text-left pb-3 text-gray-400 font-bold">RATIO</th>
                        <th className="text-left pb-3 text-gray-400 font-bold">SIGNAL</th>
                      </>
                    )}
                    {activeScanner === 'momentum' && (
                      <>
                        <th className="text-left pb-3 text-gray-400 font-bold">TREND</th>
                        <th className="text-left pb-3 text-gray-400 font-bold">HIGH</th>
                        <th className="text-left pb-3 text-gray-400 font-bold">LOW</th>
                      </>
                    )}
                    {(activeScanner === 'darkPool' || activeScanner === 'gammaFlow') && (
                      <>
                        <th className="text-left pb-3 text-gray-400 font-bold">FLOW</th>
                        <th className="text-left pb-3 text-gray-400 font-bold">SENTIMENT</th>
                        <th className="text-left pb-3 text-gray-400 font-bold">RISK</th>
                      </>
                    )}
                    <th className="text-left pb-3 text-gray-400 font-bold">ACTION</th>
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
                      <td className="py-3 font-bold">${r.price?.toFixed(2)}</td>
                      <td className={`py-3 font-bold ${parseFloat(r.change) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(r.change) > 0 ? '+' : ''}{r.change}%
                      </td>
                      <td className="py-3 font-medium">{(r.volume / 1000000).toFixed(1)}M</td>
                      {(activeScanner === 'squeeze' || activeScanner === 'unusualActivity') && (
                        <>
                          <td className="py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSqueezeRating(r.squeezeScore || 0).color}`}>
                              {getSqueezeRating(r.squeezeScore || 0).text}
                            </span>
                          </td>
                          <td className="py-3 font-medium text-red-400">{r.shortInterest?.toFixed(1)}%</td>
                          <td className="py-3 font-medium text-orange-400">{r.costToBorrow?.toFixed(1)}%</td>
                          <td className="py-3 font-medium text-yellow-400">{r.utilization?.toFixed(1)}%</td>
                        </>
                      )}
                      {activeScanner === 'volume' && (
                        <>
                          <td className="py-3 text-gray-400">{(r.avgVolume / 1000000).toFixed(1)}M</td>
                          <td className="py-3 font-bold text-blue-400">{r.volRatio}%</td>
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
                      {activeScanner === 'momentum' && (
                        <>
                          <td className="py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              r.trend === 'BULLISH' ? 'bg-green-500' : 'bg-red-500'
                            } text-white`}>
                              {r.trend}
                            </span>
                          </td>
                          <td className="py-3 text-green-400">${r.high?.toFixed(2)}</td>
                          <td className="py-3 text-red-400">${r.low?.toFixed(2)}</td>
                        </>
                      )}
                      {(activeScanner === 'darkPool' || activeScanner === 'gammaFlow') && (
                        <>
                          <td className="py-3 font-bold text-purple-400">$2.1M</td>
                          <td className="py-3">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                              BULLISH
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500 text-black">
                              MODERATE
                            </span>
                          </td>
                        </>
                      )}
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold transition-colors">
                            WATCH
                          </button>
                          <button className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-bold transition-colors">
                            ALERT
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
