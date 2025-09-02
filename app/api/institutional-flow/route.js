import { NextResponse } from 'next/server';
import { generateMockInstitutionalFlow } from '../lib/mock-institutional-data.js';

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

// Detect large block trades (institutional signatures)
async function detectBlockTrades(tickers, minSize = 10000) {
  const blockTrades = [];
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  for (const ticker of tickers.slice(0, 10)) { // Limit to prevent rate limiting
    try {
      // Get recent trades
      const tradesData = await polygonRequest(`/v3/trades/${ticker}`, {
        'timestamp.gte': yesterday.toISOString(),
        'timestamp.lt': today.toISOString(),
        'order': 'desc',
        'limit': 500
      });

      if (tradesData.results) {
        const largeTrades = tradesData.results
          .filter(trade => trade.size >= minSize)
          .map(trade => {
            const tradeValue = trade.price * trade.size;
            const institutionalScore = calculateInstitutionalScore(trade);
            
            return {
              ticker,
              timestamp: trade.participant_timestamp,
              price: trade.price,
              size: trade.size,
              value: tradeValue,
              exchange: getExchangeName(trade.exchange),
              conditions: trade.conditions || [],
              institutionalScore,
              classification: classifyTrade(trade, institutionalScore),
              darkPool: isDarkPoolTrade(trade),
              timeOfDay: new Date(trade.participant_timestamp).getHours(),
              volumeProfile: calculateVolumeProfile(trade.size, ticker)
            };
          })
          .filter(trade => trade.institutionalScore > 60); // Only high-confidence institutional trades

        blockTrades.push(...largeTrades);
      }
    } catch (error) {
      console.error(`Error fetching block trades for ${ticker}:`, error.message);
    }
  }

  return blockTrades.sort((a, b) => b.institutionalScore - a.institutionalScore);
}

// Calculate institutional probability score
function calculateInstitutionalScore(trade) {
  let score = 0;
  
  // Size-based scoring (larger = more institutional)
  if (trade.size >= 100000) score += 40;
  else if (trade.size >= 50000) score += 30;
  else if (trade.size >= 25000) score += 20;
  else if (trade.size >= 10000) score += 10;
  
  // Time-based scoring (institutional hours)
  const hour = new Date(trade.participant_timestamp).getHours();
  if (hour >= 9 && hour <= 11) score += 15; // Market open institutional activity
  else if (hour >= 14 && hour <= 16) score += 10; // Close institutional activity
  else if (hour < 9 || hour > 16) score += 5; // After/pre-hours
  
  // Exchange-based scoring
  const exchange = trade.exchange;
  if ([4, 11, 12, 13].includes(exchange)) score += 20; // Dark pools / institutional venues
  else if ([1, 2].includes(exchange)) score += 10; // NYSE/NASDAQ but could be institutional
  
  // Price level scoring (round numbers suggest institutional)
  const price = trade.price;
  if (price % 1 === 0) score += 5; // Whole dollar
  else if (price % 0.5 === 0) score += 3; // Half dollar
  else if (price % 0.25 === 0) score += 2; // Quarter
  
  // Conditions-based scoring
  if (trade.conditions) {
    const conditions = Array.isArray(trade.conditions) ? trade.conditions : [trade.conditions];
    
    // Dark pool indicators
    if (conditions.some(c => [12, 13, 37, 38, 52, 53].includes(c))) score += 25;
    
    // Block trade indicators  
    if (conditions.some(c => [7, 9, 15, 16, 43, 44].includes(c))) score += 15;
    
    // Institutional crossing indicators
    if (conditions.some(c => [19, 20, 21, 29, 30].includes(c))) score += 20;
  }
  
  return Math.min(100, score);
}

// Classify trade type based on characteristics
function classifyTrade(trade, institutionalScore) {
  if (institutionalScore >= 85) return 'INSTITUTIONAL_BLOCK';
  if (institutionalScore >= 70) return 'LIKELY_INSTITUTIONAL';
  if (institutionalScore >= 60) return 'POSSIBLE_INSTITUTIONAL';
  if (trade.size >= 50000) return 'LARGE_RETAIL';
  return 'UNKNOWN';
}

// Check if trade is likely dark pool
function isDarkPoolTrade(trade) {
  const darkPoolExchanges = [4, 11, 12, 13, 15, 16, 17]; // Known dark pool venue IDs
  if (darkPoolExchanges.includes(trade.exchange)) return true;
  
  if (trade.conditions) {
    const conditions = Array.isArray(trade.conditions) ? trade.conditions : [trade.conditions];
    const darkPoolConditions = [12, 13, 37, 38, 52, 53];
    return conditions.some(c => darkPoolConditions.includes(c));
  }
  
  return false;
}

// Calculate volume profile significance
function calculateVolumeProfile(size, ticker) {
  // Estimate average daily volume for ticker
  const avgDailyVolumes = {
    'SPY': 80000000, 'QQQ': 45000000, 'AAPL': 60000000, 'TSLA': 35000000,
    'NVDA': 40000000, 'AMD': 25000000, 'MSFT': 30000000, 'AMZN': 25000000
  };
  
  const avgVolume = avgDailyVolumes[ticker] || 10000000;
  const percentOfDailyVolume = (size / avgVolume) * 100;
  
  if (percentOfDailyVolume >= 1) return 'MASSIVE';
  if (percentOfDailyVolume >= 0.5) return 'LARGE';
  if (percentOfDailyVolume >= 0.1) return 'SIGNIFICANT';
  return 'NORMAL';
}

// Get human-readable exchange name
function getExchangeName(exchangeId) {
  const exchanges = {
    1: 'NYSE', 2: 'NASDAQ', 3: 'NYSE_MKT', 4: 'DARK_POOL', 
    5: 'BATS', 6: 'IEX', 7: 'EDGA', 8: 'EDGX',
    9: 'BYX', 10: 'BZX', 11: 'DARK_POOL_1', 12: 'DARK_POOL_2', 
    13: 'DARK_POOL_3', 14: 'ARCA', 15: 'INSTINET', 16: 'CROSSFINDER'
  };
  return exchanges[exchangeId] || `EXCHANGE_${exchangeId}`;
}

// Analyze dark pool activity patterns
async function analyzeDarkPoolActivity(tickers) {
  const darkPoolAnalysis = [];
  
  for (const ticker of tickers.slice(0, 8)) {
    try {
      // Get recent trades
      const tradesData = await polygonRequest(`/v3/trades/${ticker}`, {
        'timestamp.gte': new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // Last 4 hours
        'order': 'desc',
        'limit': 1000
      });

      if (tradesData.results && tradesData.results.length > 0) {
        const trades = tradesData.results;
        
        // Analyze dark pool vs lit market activity
        const darkPoolTrades = trades.filter(t => isDarkPoolTrade(t));
        const litTrades = trades.filter(t => !isDarkPoolTrade(t));
        
        const totalVolume = trades.reduce((sum, t) => sum + t.size, 0);
        const darkPoolVolume = darkPoolTrades.reduce((sum, t) => sum + t.size, 0);
        const litVolume = litTrades.reduce((sum, t) => sum + t.size, 0);
        
        const darkPoolPercentage = totalVolume > 0 ? (darkPoolVolume / totalVolume) * 100 : 0;
        
        // Calculate VWAP for both venues
        const darkPoolVWAP = calculateVWAP(darkPoolTrades);
        const litVWAP = calculateVWAP(litTrades);
        const vwapSpread = Math.abs(darkPoolVWAP - litVWAP);
        
        // Detect unusual dark pool activity
        const unusualActivity = {
          highDarkPoolRatio: darkPoolPercentage > 40,
          largeVWAPSpread: vwapSpread > 0.02,
          concentratedTiming: checkTimingConcentration(darkPoolTrades),
          sizeDistribution: analyzeSizeDistribution(darkPoolTrades)
        };
        
        const score = calculateDarkPoolScore(darkPoolPercentage, vwapSpread, unusualActivity);
        
        darkPoolAnalysis.push({
          ticker,
          darkPoolPercentage: parseFloat(darkPoolPercentage.toFixed(2)),
          litPercentage: parseFloat(((litVolume / totalVolume) * 100).toFixed(2)),
          totalVolume,
          darkPoolVolume,
          litVolume,
          darkPoolVWAP,
          litVWAP,
          vwapSpread,
          score,
          unusualActivity,
          classification: score > 70 ? 'HIGH_ACTIVITY' : score > 40 ? 'MODERATE_ACTIVITY' : 'NORMAL_ACTIVITY',
          tradeCount: {
            total: trades.length,
            darkPool: darkPoolTrades.length,
            lit: litTrades.length
          },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error(`Error analyzing dark pool for ${ticker}:`, error.message);
    }
  }
  
  return darkPoolAnalysis.sort((a, b) => b.score - a.score);
}

// Calculate Volume Weighted Average Price
function calculateVWAP(trades) {
  if (!trades.length) return 0;
  
  const totalValue = trades.reduce((sum, t) => sum + (t.price * t.size), 0);
  const totalVolume = trades.reduce((sum, t) => sum + t.size, 0);
  
  return totalVolume > 0 ? totalValue / totalVolume : 0;
}

// Check if trades are concentrated in time (institutional program trading)
function checkTimingConcentration(trades) {
  if (trades.length < 5) return false;
  
  const timeWindows = {};
  trades.forEach(trade => {
    const minute = Math.floor(new Date(trade.participant_timestamp).getTime() / 60000);
    timeWindows[minute] = (timeWindows[minute] || 0) + 1;
  });
  
  const maxTradesInWindow = Math.max(...Object.values(timeWindows));
  return maxTradesInWindow >= trades.length * 0.3; // 30% of trades in one minute
}

// Analyze size distribution for institutional patterns
function analyzeSizeDistribution(trades) {
  if (trades.length < 3) return 'INSUFFICIENT_DATA';
  
  const sizes = trades.map(t => t.size).sort((a, b) => b - a);
  const avgSize = sizes.reduce((sum, s) => sum + s, 0) / sizes.length;
  const medianSize = sizes[Math.floor(sizes.length / 2)];
  
  if (avgSize > medianSize * 2) return 'MIXED_SIZES';
  if (avgSize > 25000) return 'LARGE_UNIFORM';
  if (sizes.every(s => Math.abs(s - avgSize) < avgSize * 0.2)) return 'UNIFORM_PROGRAM';
  
  return 'RANDOM_RETAIL';
}

// Calculate dark pool activity score
function calculateDarkPoolScore(darkPoolPercentage, vwapSpread, unusualActivity) {
  let score = 0;
  
  // Dark pool percentage scoring
  if (darkPoolPercentage > 50) score += 40;
  else if (darkPoolPercentage > 35) score += 25;
  else if (darkPoolPercentage > 20) score += 10;
  
  // VWAP spread scoring (indicates price improvement seeking)
  if (vwapSpread > 0.05) score += 25;
  else if (vwapSpread > 0.02) score += 15;
  else if (vwapSpread > 0.01) score += 5;
  
  // Unusual activity bonuses
  if (unusualActivity.highDarkPoolRatio) score += 10;
  if (unusualActivity.concentratedTiming) score += 15;
  if (unusualActivity.sizeDistribution === 'LARGE_UNIFORM') score += 10;
  if (unusualActivity.sizeDistribution === 'UNIFORM_PROGRAM') score += 20;
  
  return Math.min(100, score);
}

// Detect smart money flow patterns
async function detectSmartMoneyFlow(tickers) {
  const smartMoneySignals = [];
  
  for (const ticker of tickers.slice(0, 6)) {
    try {
      // Get market snapshot
      const snapshot = await polygonRequest(`/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`);
      
      if (snapshot.ticker) {
        const stock = snapshot.ticker;
        const currentPrice = stock.lastQuote?.price || stock.prevDay?.c || 0;
        
        // Get recent large trades
        const blockTrades = await detectBlockTrades([ticker], 25000);
        const recentTrades = blockTrades.filter(t => 
          Date.now() - new Date(t.timestamp).getTime() < 2 * 60 * 60 * 1000 // Last 2 hours
        );
        
        if (recentTrades.length > 0) {
          // Analyze flow direction
          const buyVolume = recentTrades.filter(t => t.conditions?.includes(41) || t.price >= currentPrice).reduce((sum, t) => sum + t.size, 0);
          const sellVolume = recentTrades.filter(t => t.conditions?.includes(40) || t.price < currentPrice).reduce((sum, t) => sum + t.size, 0);
          
          const totalVolume = buyVolume + sellVolume;
          const buyPressure = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 50;
          
          // Calculate smart money score
          const avgTradeSize = recentTrades.reduce((sum, t) => sum + t.size, 0) / recentTrades.length;
          const avgInstitutionalScore = recentTrades.reduce((sum, t) => sum + t.institutionalScore, 0) / recentTrades.length;
          
          const smartMoneyScore = calculateSmartMoneyScore({
            avgTradeSize,
            avgInstitutionalScore,
            buyPressure,
            tradeCount: recentTrades.length,
            darkPoolRatio: recentTrades.filter(t => t.darkPool).length / recentTrades.length * 100
          });
          
          if (smartMoneyScore > 60) {
            smartMoneySignals.push({
              ticker,
              currentPrice,
              smartMoneyScore,
              buyPressure: parseFloat(buyPressure.toFixed(2)),
              sellPressure: parseFloat((100 - buyPressure).toFixed(2)),
              avgTradeSize: Math.round(avgTradeSize),
              avgInstitutionalScore: Math.round(avgInstitutionalScore),
              tradeCount: recentTrades.length,
              totalValue: recentTrades.reduce((sum, t) => sum + t.value, 0),
              darkPoolRatio: parseFloat((recentTrades.filter(t => t.darkPool).length / recentTrades.length * 100).toFixed(1)),
              direction: buyPressure > 60 ? 'BULLISH_FLOW' : buyPressure < 40 ? 'BEARISH_FLOW' : 'MIXED_FLOW',
              classification: smartMoneyScore > 85 ? 'STRONG_INSTITUTIONAL' : smartMoneyScore > 70 ? 'INSTITUTIONAL' : 'POSSIBLE_INSTITUTIONAL',
              timeWindow: '2h',
              timestamp: Date.now(),
              topTrades: recentTrades.slice(0, 3).map(t => ({
                size: t.size,
                price: t.price,
                value: t.value,
                institutionalScore: t.institutionalScore,
                darkPool: t.darkPool,
                time: new Date(t.timestamp).toLocaleTimeString()
              }))
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error detecting smart money for ${ticker}:`, error.message);
    }
  }
  
  return smartMoneySignals.sort((a, b) => b.smartMoneyScore - a.smartMoneyScore);
}

// Calculate smart money flow score
function calculateSmartMoneyScore(params) {
  const { avgTradeSize, avgInstitutionalScore, buyPressure, tradeCount, darkPoolRatio } = params;
  
  let score = 0;
  
  // Trade size scoring
  if (avgTradeSize > 100000) score += 30;
  else if (avgTradeSize > 50000) score += 20;
  else if (avgTradeSize > 25000) score += 10;
  
  // Institutional confidence scoring
  score += Math.min(25, avgInstitutionalScore * 0.25);
  
  // Flow direction scoring (strong bias indicates conviction)
  if (buyPressure > 75 || buyPressure < 25) score += 20;
  else if (buyPressure > 65 || buyPressure < 35) score += 10;
  
  // Trade frequency scoring
  if (tradeCount > 10) score += 15;
  else if (tradeCount > 5) score += 10;
  else if (tradeCount > 2) score += 5;
  
  // Dark pool activity bonus
  if (darkPoolRatio > 50) score += 10;
  else if (darkPoolRatio > 30) score += 5;
  
  return Math.min(100, score);
}

export async function POST(request) {
  try {
    const { action, tickers = [], params = {} } = await request.json();
    
    let results;
    
    // Use mock data for now to avoid Polygon API issues
    const USE_MOCK_DATA = true; // Set to false when you have proper Polygon API access
    
    if (USE_MOCK_DATA) {
      results = generateMockInstitutionalFlow(tickers, action);
    } else {
      switch (action) {
        case 'block_trades':
          results = await detectBlockTrades(tickers, params.minSize || 10000);
          break;
          
        case 'dark_pool_analysis':
          results = await analyzeDarkPoolActivity(tickers);
          break;
          
        case 'smart_money_flow':
          results = await detectSmartMoneyFlow(tickers);
          break;
          
        case 'comprehensive':
          // Get all institutional flow data
          const [blockTrades, darkPool, smartMoney] = await Promise.allSettled([
            detectBlockTrades(tickers, params.minSize || 25000),
            analyzeDarkPoolActivity(tickers),
            detectSmartMoneyFlow(tickers)
          ]);
          
          results = {
            blockTrades: blockTrades.status === 'fulfilled' ? blockTrades.value : [],
            darkPoolAnalysis: darkPool.status === 'fulfilled' ? darkPool.value : [],
            smartMoneyFlow: smartMoney.status === 'fulfilled' ? smartMoney.value : []
          };
          break;
          
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    }
    
    return NextResponse.json({
      success: true,
      action,
      results,
      timestamp: new Date().toISOString(),
      count: Array.isArray(results) ? results.length : Object.keys(results).length
    });
    
  } catch (error) {
    console.error('Institutional flow error:', error);
    return NextResponse.json({ 
      error: 'Institutional flow analysis failed', 
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
        status: 'Institutional Flow API ready',
        endpoints: [
          'block_trades - Large institutional trades detection',
          'dark_pool_analysis - Dark pool activity monitoring',
          'smart_money_flow - Smart money movement detection',
          'comprehensive - Complete institutional analysis'
        ],
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Institutional flow GET error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}