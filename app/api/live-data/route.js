import { NextResponse } from 'next/server';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { STOCK_UNIVERSE, generateMarketData } from '../lib/market-data.js';
import { getRealMarketData } from '../lib/real-market-data.js';

export const dynamic = 'force-dynamic';

// Global WebSocket server instance
let wss = null;
let server = null;
let isServerStarted = false;

// Live market data simulation with realistic patterns
const generateLiveMarketData = () => {
  const marketData = new Map();
  
  STOCK_UNIVERSE.forEach(ticker => {
    const basePrice = getBasePriceForTicker(ticker);
    const volatility = getVolatilityForTicker(ticker);
    const volume = getVolumeForTicker(ticker);
    
    // Generate realistic intraday movement
    const timeOfDay = new Date().getHours() + new Date().getMinutes() / 60;
    const marketOpenHours = timeOfDay >= 9.5 && timeOfDay <= 16; // 9:30 AM to 4:00 PM ET
    
    let priceChange = 0;
    if (marketOpenHours) {
      // Active market hours - more volatility
      priceChange = (Math.random() - 0.5) * volatility * 2;
    } else {
      // After hours - reduced volatility
      priceChange = (Math.random() - 0.5) * volatility * 0.3;
    }
    
    const currentPrice = basePrice * (1 + priceChange);
    const changePercent = priceChange * 100;
    const currentVolume = volume * (0.7 + Math.random() * 0.6); // ±30% volume variation
    
    marketData.set(ticker, {
      ticker,
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(currentVolume),
      high: parseFloat((currentPrice * (1 + Math.random() * 0.03)).toFixed(2)),
      low: parseFloat((currentPrice * (1 - Math.random() * 0.03)).toFixed(2)),
      bid: parseFloat((currentPrice - 0.01 - Math.random() * 0.05).toFixed(2)),
      ask: parseFloat((currentPrice + 0.01 + Math.random() * 0.05).toFixed(2)),
      timestamp: Date.now(),
      marketStatus: marketOpenHours ? 'OPEN' : 'CLOSED'
    });
  });
  
  return marketData;
};

const getBasePriceForTicker = (ticker) => {
  const priceMap = {
    // High price stocks
    'GOOGL': 2800, 'GOOG': 2750, 'AMZN': 3200, 'TSLA': 800, 'NVDA': 900,
    'META': 350, 'NFLX': 450, 'MSFT': 410, 'AAPL': 190, 'BRK.B': 350,
    
    // Medium price stocks  
    'JPM': 150, 'V': 240, 'MA': 380, 'UNH': 520, 'JNJ': 170,
    'PG': 150, 'HD': 320, 'COST': 520, 'WMT': 160, 'DIS': 95,
    
    // Lower price stocks
    'INTC': 35, 'AMD': 120, 'F': 12, 'GM': 40, 'T': 18,
    'VZ': 40, 'PFE': 45, 'KO': 60, 'PEP': 180, 'XOM': 110,
    
    // Meme stocks
    'GME': 25, 'AMC': 8, 'BBBY': 1.5, 'MULN': 0.25, 'ATER': 2.5,
    
    // ETFs
    'SPY': 440, 'QQQ': 380, 'IWM': 185, 'VIX': 18, 'UVXY': 12
  };
  
  return priceMap[ticker] || (20 + Math.random() * 200); // Default random price
};

const getVolatilityForTicker = (ticker) => {
  const volMap = {
    // High volatility
    'TSLA': 0.04, 'NVDA': 0.035, 'AMD': 0.03, 'GME': 0.08, 'AMC': 0.06,
    'MULN': 0.12, 'BBBY': 0.15, 'ATER': 0.10, 'RIVN': 0.06, 'LCID': 0.05,
    
    // Medium volatility
    'AAPL': 0.025, 'MSFT': 0.022, 'GOOGL': 0.025, 'AMZN': 0.028, 'META': 0.032,
    'NFLX': 0.035, 'CRM': 0.03, 'SNOW': 0.04, 'PLTR': 0.045,
    
    // Low volatility  
    'SPY': 0.015, 'QQQ': 0.018, 'JPM': 0.02, 'JNJ': 0.015, 'PG': 0.012,
    'KO': 0.012, 'WMT': 0.015, 'UNH': 0.018
  };
  
  return volMap[ticker] || 0.025; // Default 2.5% volatility
};

const getVolumeForTicker = (ticker) => {
  const volumeMap = {
    // High volume
    'SPY': 80000000, 'QQQ': 45000000, 'AAPL': 60000000, 'TSLA': 35000000,
    'NVDA': 40000000, 'AMD': 25000000, 'MSFT': 30000000, 'AMZN': 25000000,
    
    // Medium volume
    'META': 18000000, 'GOOGL': 15000000, 'NFLX': 8000000, 'JPM': 12000000,
    'V': 8000000, 'HD': 6000000, 'PG': 7000000, 'JNJ': 8000000,
    
    // Lower volume
    'BRK.B': 2000000, 'UNH': 3000000, 'COST': 2500000, 'DIS': 9000000,
    
    // Meme stock volume spikes
    'GME': 15000000, 'AMC': 25000000, 'BBBY': 8000000
  };
  
  return volumeMap[ticker] || (500000 + Math.random() * 5000000); // Default volume
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'snapshot';
    
    if (type === 'universe') {
      return NextResponse.json({
        success: true,
        stockUniverse: STOCK_UNIVERSE,
        totalStocks: STOCK_UNIVERSE.length,
        lastUpdated: new Date().toISOString()
      });
    }
    
    if (type === 'snapshot') {
      // Try to get real market data first
      let marketData;
      try {
        marketData = await getRealMarketData();
        console.log(`Using real market data: ${marketData.length} stocks`);
      } catch (error) {
        console.log('Fallback to generated data:', error.message);
        marketData = generateMarketData();
      }
      
      return NextResponse.json({
        success: true,
        data: marketData,
        totalStocks: marketData.length,
        timestamp: Date.now(),
        marketStatus: getMarketStatus(),
        dataSource: marketData.length > 0 && marketData[0].marketCap ? 'REAL' : 'SIMULATED'
      });
    }
    
    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    
  } catch (error) {
    console.error('Live data API error:', error);
    return NextResponse.json({ error: 'Failed to fetch live data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action, tickers } = await request.json();
    
    if (action === 'subscribe') {
      // Handle WebSocket subscription logic
      const marketData = generateLiveMarketData();
      const filteredData = tickers ? 
        Array.from(marketData.values()).filter(item => tickers.includes(item.ticker)) :
        Array.from(marketData.values());
      
      return NextResponse.json({
        success: true,
        data: filteredData,
        subscribed: tickers || STOCK_UNIVERSE,
        timestamp: Date.now()
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Live data subscription error:', error);
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }
}

const getMarketStatus = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay();
  
  if (day === 0 || day === 6) {
    return 'WEEKEND_CLOSED';
  } else if ((hour === 9 && minute >= 30) || (hour > 9 && hour < 16)) {
    return 'OPEN';
  } else if ((hour >= 4 && hour < 9) || (hour === 9 && minute < 30)) {
    return 'PRE_MARKET';
  } else if (hour >= 16 && hour < 20) {
    return 'AFTER_HOURS';
  } else {
    return 'CLOSED';
  }
};