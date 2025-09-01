'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('squeeze');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [tickers, setTickers] = useState('SPY,QQQ,AAPL,TSLA,NVDA');
  const [shortTickers, setShortTickers] = useState('AMC,GME,BBBY,ATER,MULN');

  const scanStocks = async () => {
    setLoading(true);
    setResults([]);
    
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
              result.daysTocover = ortexData.data.daystocover;
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

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-2 mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('squeeze')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'squeeze' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            🎯 Squeeze Scanner
          </button>
          <button
            onClick={() => setActiveTab('shorts')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'shorts' 
                ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            🔥 Short Squeeze
          </button>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6">
          <input
            type="text"
            value={activeTab === 'shorts' ? shortTickers : tickers}
            onChange={(e) => activeTab === 'shorts' ? setShortTickers(e.target.value) : setTickers(e.target.value)}
            className="w-full px-4 py-3 mb-4 bg-gray-700/50 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white"
            placeholder="Enter tickers..."
          />
          
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

        {results.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6">
            <h2 className="text-2xl mb-4 font-bold">Results</h2>
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
                    {activeTab !== 'shorts' && (
                      <>
                        <th className="text-left pb-3">High</th>
                        <th className="text-left pb-3">Low</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 font-bold text-blue-400">{r.ticker}</td>
                      <td className="py-3">${r.price?.toFixed(2)}</td>
                      <td className={`py-3 ${r.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
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
                      {activeTab !== 'shorts' && (
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
