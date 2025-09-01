'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('squeeze');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [tickers, setTickers] = useState('SPY,QQQ,AAPL,TSLA,NVDA');
  const [shortTickers, setShortTickers] = useState('AMC,GME,BBBY,ATER,MULN');

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
    
    setResults(scanResults);
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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10">
        <h1 className="text-5xl font-bold mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            Ultimate Scanner Pro
          </span>
          <span className="ml-3">🚀</span>
        </h1>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-2 mb-6 flex gap-2 flex-wrap">
          <button onClick={() => setActiveTab('squeeze')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'squeeze' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            🎯 Squeeze Scanner
          </button>
          <button onClick={() => setActiveTab('shorts')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'shorts' ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            🔥 Short Squeeze
          </button>
          <button onClick={() => setActiveTab('momentum')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'momentum' ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            🚀 Momentum
          </button>
          <button onClick={() => setActiveTab('volume')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'volume' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            📊 Volume Surge
          </button>
          <button onClick={() => setActiveTab('recs')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'recs' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
            ⭐ AI Picks
          </button>
        </div>

        {activeTab !== 'recs' && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6">
            {(activeTab === 'squeeze' || activeTab === 'shorts') && (
              <input
                type="text"
                value={activeTab === 'shorts' ? shortTickers : tickers}
                onChange={(e) => activeTab === 'shorts' ? setShortTickers(e.target.value) : setTickers(e.target.value)}
                className="w-full px-4 py-3 mb-4 bg-gray-700/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white"
                placeholder="Enter tickers..."
              />
            )}
            
            <button
              onClick={scanStocks}
              disabled={loading}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all transform ${
                loading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 hover:scale-105'
              }`}
            >
              {loading ? 'Scanning...' : `SCAN NOW ${activeTab === 'shorts' ? '🔥' : '🎯'}`}
            </button>
          </div>
        )}

        {activeTab === 'recs' && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500">
              AI-Powered Daily Picks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 p-4 rounded-lg border border-green-500/30">
                <h3 className="font-bold text-green-400 mb-2">🟢 BULLISH PICKS</h3>
                <div className="space-y-2">
                  <div className="flex justify-between"><span>NVDA</span><span className="text-green-400">+15% target</span></div>
                  <div className="flex justify-between"><span>TSLA</span><span className="text-green-400">+12% target</span></div>
                  <div className="flex justify-between"><span>AMD</span><span className="text-green-400">+10% target</span></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-500/20 to-orange-600/20 p-4 rounded-lg border border-red-500/30">
                <h3 className="font-bold text-red-400 mb-2">🔴 SHORT CANDIDATES</h3>
                <div className="space-y-2">
                  <div className="flex justify-between"><span>BBBY</span><span className="text-red-400">-20% target</span></div>
                  <div className="flex justify-between"><span>CVNA</span><span className="text-red-400">-15% target</span></div>
                  <div className="flex justify-between"><span>W</span><span className="text-red-400">-10% target</span></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/20 to-indigo-600/20 p-4 rounded-lg border border-purple-500/30">
                <h3 className="font-bold text-purple-400 mb-2">⚡ SQUEEZE ALERTS</h3>
                <div className="space-y-2">
                  <div className="flex justify-between"><span>GME</span><span className="text-purple-400">EXTREME</span></div>
                  <div className="flex justify-between"><span>AMC</span><span className="text-purple-400">HIGH</span></div>
                  <div className="flex justify-between"><span>MULN</span><span className="text-purple-400">BUILDING</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Results</h2>
              <button onClick={exportToCSV} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-all">
                📥 Export CSV
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left pb-3">Ticker</th>
                    <th className="text-left pb-3">Price</th>
                    <th className="text-left pb-3">Change</th>
                    <th className="text-left pb-3">Volume</th>
                    {activeTab === 'shorts' && (
                      <>
                        <th className="text-left pb-3">SI %</th>
                        <th className="text-left pb-3">CTB %</th>
                        <th className="text-left pb-3">Util %</th>
                        <th className="text-left pb-3">Score</th>
                      </>
                    )}
                    {activeTab === 'volume' && (
                      <>
                        <th className="text-left pb-3">Avg Volume</th>
                        <th className="text-left pb-3">Vol Ratio</th>
                        <th className="text-left pb-3">Signal</th>
                      </>
                    )}
                    {activeTab === 'momentum' && (
                      <th className="text-left pb-3">Trend</th>
                    )}
                    {activeTab === 'squeeze' && (
                      <>
                        <th className="text-left pb-3">High</th>
                        <th className="text-left pb-3">Low</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all">
                      <td className="py-3 font-bold text-blue-400">{r.ticker}</td>
                      <td className="py-3">${r.price?.toFixed(2)}</td>
                      <td className={`py-3 ${parseFloat(r.change) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {r.change}%
                      </td>
                      <td className="py-3">{(r.volume / 1000000).toFixed(1)}M</td>
                      {activeTab === 'shorts' && (
                        <>
                          <td className="py-3">{r.shortInterest?.toFixed(1)}%</td>
                          <td className="py-3">{r.costToBorrow?.toFixed(1)}%</td>
                          <td className="py-3">{r.utilization?.toFixed(1)}%</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getSqueezeRating(r.squeezeScore || 0).color}`}>
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
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
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
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
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
      </div>
    </main>
  );
}
