'use client';
import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [tickers, setTickers] = useState('SPY,QQQ,AAPL,TSLA,NVDA');

  const scanStocks = async () => {
    setLoading(true);
    setResults([]);
    
    const tickerList = tickers.split(',').map(t => t.trim());
    const scanResults = [];
    
    for (const ticker of tickerList) {
      try {
        const response = await fetch(`/api/polygon?endpoint=/v2/aggs/ticker/${ticker}/prev`);
        const data = await response.json();
        
        if (data.results && data.results[0]) {
          const r = data.results[0];
          scanResults.push({
            ticker,
            price: r.c,
            change: ((r.c - r.o) / r.o * 100).toFixed(2),
            volume: r.v,
            high: r.h,
            low: r.l
          });
        }
      } catch (error) {
        console.error(`Error fetching ${ticker}:`, error);
      }
    }
    
    setResults(scanResults);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
        Scanner Pro 🚀
      </h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-2xl mb-4">🎯 Stock Scanner</h2>
        
        <div className="mb-4">
          <label className="block text-sm mb-2">Tickers (comma separated)</label>
          <input
            type="text"
            value={tickers}
            onChange={(e) => setTickers(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="SPY,QQQ,AAPL"
          />
        </div>
        
        <button
          onClick={scanStocks}
          disabled={loading}
          className={`w-full py-3 rounded font-bold transition ${
            loading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700'
          }`}
        >
          {loading ? 'Scanning...' : 'SCAN NOW 🔍'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl mb-4">Results</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left pb-2">Ticker</th>
                  <th className="text-left pb-2">Price</th>
                  <th className="text-left pb-2">Change</th>
                  <th className="text-left pb-2">Volume</th>
                  <th className="text-left pb-2">High</th>
                  <th className="text-left pb-2">Low</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-gray-700">
                    <td className="py-2 font-bold text-blue-400">{r.ticker}</td>
                    <td className="py-2">${r.price?.toFixed(2)}</td>
                    <td className={`py-2 ${r.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {r.change}%
                    </td>
                    <td className="py-2">{(r.volume / 1000000).toFixed(1)}M</td>
                    <td className="py-2">${r.high?.toFixed(2)}</td>
                    <td className="py-2">${r.low?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
