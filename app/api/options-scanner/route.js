import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || '75rlu6cWGNnIqqR_x8M384YUjBgGk6kT';
const BASE_URL = 'https://api.polygon.io';

// Helper function to make Polygon API calls
async function polygonRequest(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  
  // Add API key and parameters
  url.searchParams.append('apikey', POLYGON_API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Get options contracts for a ticker
async function getOptionsContracts(ticker, expiration = null) {
  const params = {
    'underlying_ticker': ticker,
    'contract_type': 'option',
    'limit': 1000
  };
  
  if (expiration) {
    params.expiration_date = expiration;
  }

  return await polygonRequest('/v3/reference/options/contracts', params);
}

// Get options snapshots for real-time Greeks and prices
async function getOptionsSnapshots(optionsTickers) {
  if (!optionsTickers || optionsTickers.length === 0) return { results: [] };
  
  const tickerParam = optionsTickers.slice(0, 100).join(','); // Limit to 100 per request
  return await polygonRequest('/v3/snapshot/options/' + tickerParam);
}

// Get unusual options activity
async function getUnusualOptionsActivity(tickers) {
  const results = [];
  
  for (const ticker of tickers.slice(0, 10)) { // Limit to prevent rate limiting
    try {
      // Get current stock price
      const stockSnapshot = await polygonRequest(`/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`);
      
      // Get options contracts
      const optionsData = await getOptionsContracts(ticker);
      
      if (optionsData.results && optionsData.results.length > 0) {
        // Get snapshots for options
        const optionTickers = optionsData.results.slice(0, 20).map(opt => opt.ticker);
        const snapshots = await getOptionsSnapshots(optionTickers);
        
        // Analyze for unusual activity
        const analysis = analyzeUnusualActivity(ticker, stockSnapshot, optionsData.results, snapshots.results || []);
        if (analysis.score > 50) {
          results.push(analysis);
        }
      }
    } catch (error) {
      console.error(`Error processing ${ticker}:`, error.message);
    }
  }
  
  return results.sort((a, b) => b.score - a.score);
}

// Analyze unusual options activity
function analyzeUnusualActivity(ticker, stockData, contracts, snapshots) {
  const stock = stockData?.ticker || {};
  const stockPrice = stock.lastQuote?.price || stock.prevDay?.c || 0;
  
  let totalVolume = 0;
  let totalOpenInterest = 0;
  let callVolume = 0;
  let putVolume = 0;
  let nearMoneyOptions = 0;
  let highIVOptions = 0;
  
  snapshots.forEach(snap => {
    const contract = contracts.find(c => c.ticker === snap.ticker);
    if (!contract) return;
    
    const volume = snap.day?.volume || 0;
    const openInterest = snap.open_interest || 0;
    const iv = snap.implied_volatility || 0;
    
    totalVolume += volume;
    totalOpenInterest += openInterest;
    
    if (contract.contract_type === 'call') {
      callVolume += volume;
    } else {
      putVolume += volume;
    }
    
    // Check if near the money (within 10% of stock price)
    const strike = contract.strike_price;
    if (Math.abs(strike - stockPrice) / stockPrice <= 0.1) {
      nearMoneyOptions += volume;
    }
    
    // Check for high IV
    if (iv > 0.4) { // 40% IV threshold
      highIVOptions += volume;
    }
  });
  
  // Calculate unusual activity score
  let score = 0;
  
  // High volume score
  if (totalVolume > 1000) score += 20;
  if (totalVolume > 5000) score += 30;
  if (totalVolume > 10000) score += 50;
  
  // Put/call ratio analysis
  const putCallRatio = callVolume > 0 ? putVolume / callVolume : 0;
  if (putCallRatio > 2 || putCallRatio < 0.5) score += 25;
  
  // Near money activity
  if (nearMoneyOptions / totalVolume > 0.6) score += 20;
  
  // High IV activity
  if (highIVOptions / totalVolume > 0.5) score += 15;
  
  return {
    ticker,
    stockPrice,
    totalVolume,
    callVolume,
    putVolume,
    putCallRatio: putCallRatio.toFixed(2),
    openInterest: totalOpenInterest,
    nearMoneyVolume: nearMoneyOptions,
    highIVVolume: highIVOptions,
    score: Math.round(score),
    timestamp: Date.now(),
    analysis: generateAnalysisText(score, putCallRatio, totalVolume)
  };
}

function generateAnalysisText(score, putCallRatio, volume) {
  const signals = [];
  
  if (score > 80) signals.push("🔥 EXTREME unusual activity");
  else if (score > 60) signals.push("📈 HIGH unusual activity");
  else if (score > 40) signals.push("⚡ MODERATE unusual activity");
  
  if (putCallRatio > 2) signals.push("🐻 Heavy PUT buying");
  else if (putCallRatio < 0.5) signals.push("🐂 Heavy CALL buying");
  
  if (volume > 10000) signals.push("🚀 MASSIVE volume");
  else if (volume > 5000) signals.push("📊 High volume");
  
  return signals.join(" • ");
}

// Get options flow (large trades)
async function getOptionsFlow(tickers, minSize = 100) {
  const flows = [];
  
  for (const ticker of tickers.slice(0, 5)) {
    try {
      // Get recent options trades
      const tradesData = await polygonRequest(`/v3/trades/${ticker}O`, {
        'timestamp.gte': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'limit': 100
      });
      
      if (tradesData.results) {
        const largeTrades = tradesData.results
          .filter(trade => trade.size >= minSize)
          .map(trade => ({
            ticker,
            optionTicker: trade.ticker,
            price: trade.price,
            size: trade.size,
            timestamp: trade.participant_timestamp,
            value: trade.price * trade.size * 100,
            exchange: trade.exchange
          }));
        
        flows.push(...largeTrades);
      }
    } catch (error) {
      console.error(`Error getting options flow for ${ticker}:`, error.message);
    }
  }
  
  return flows.sort((a, b) => b.value - a.value);
}

// Get real Greeks for options
async function getOptionsGreeks(ticker) {
  try {
    const contracts = await getOptionsContracts(ticker);
    if (!contracts.results) return [];
    
    // Get snapshots with Greeks
    const optionTickers = contracts.results.slice(0, 50).map(c => c.ticker);
    const snapshots = await getOptionsSnapshots(optionTickers);
    
    return (snapshots.results || []).map(snap => {
      const contract = contracts.results.find(c => c.ticker === snap.ticker);
      return {
        ticker: snap.ticker,
        underlying: ticker,
        strike: contract?.strike_price || 0,
        expiry: contract?.expiration_date || '',
        type: contract?.contract_type || '',
        price: snap.day?.close || snap.lastQuote?.price || 0,
        delta: snap.greeks?.delta || 0,
        gamma: snap.greeks?.gamma || 0,
        theta: snap.greeks?.theta || 0,
        vega: snap.greeks?.vega || 0,
        iv: snap.implied_volatility || 0,
        volume: snap.day?.volume || 0,
        openInterest: snap.open_interest || 0
      };
    });
  } catch (error) {
    console.error(`Error getting Greeks for ${ticker}:`, error.message);
    return [];
  }
}

export async function POST(request) {
  try {
    const { action, tickers = [], params = {} } = await request.json();
    
    let results;
    
    switch (action) {
      case 'unusual_activity':
        results = await getUnusualOptionsActivity(tickers);
        break;
        
      case 'options_flow':
        results = await getOptionsFlow(tickers, params.minSize || 100);
        break;
        
      case 'greeks':
        if (tickers.length > 0) {
          results = await getOptionsGreeks(tickers[0]);
        } else {
          results = [];
        }
        break;
        
      case 'options_chain':
        if (tickers.length > 0) {
          const contracts = await getOptionsContracts(tickers[0], params.expiration);
          const optionTickers = (contracts.results || []).slice(0, 100).map(c => c.ticker);
          const snapshots = await getOptionsSnapshots(optionTickers);
          
          results = {
            contracts: contracts.results || [],
            snapshots: snapshots.results || []
          };
        } else {
          results = { contracts: [], snapshots: [] };
        }
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      action,
      results,
      timestamp: new Date().toISOString(),
      count: Array.isArray(results) ? results.length : Object.keys(results).length
    });
    
  } catch (error) {
    console.error('Options scanner error:', error);
    return NextResponse.json({ 
      error: 'Options scanning failed', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    
    if (action === 'status') {
      return NextResponse.json({
        success: true,
        status: 'Options Scanner API ready',
        endpoints: [
          'unusual_activity',
          'options_flow', 
          'greeks',
          'options_chain'
        ],
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Options scanner GET error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}