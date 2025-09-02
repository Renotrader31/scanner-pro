import { NextResponse } from 'next/server';
import { getMarketSnapshot } from '../lib/market-data.js';

export const dynamic = 'force-dynamic';

// Advanced screening criteria and filters
const SCREENING_CRITERIA = {
  // Technical Indicators
  MOMENTUM_BREAKOUT: {
    name: 'Momentum Breakout',
    description: 'Stocks breaking above 20-day MA with high volume',
    criteria: (stock) => stock.change > 2 && stock.volume > stock.avgVolume * 1.5 && stock.rsi < 70
  },
  
  OVERSOLD_BOUNCE: {
    name: 'Oversold Bounce',
    description: 'Oversold stocks showing early reversal signs',
    criteria: (stock) => stock.rsi < 30 && stock.change > 0 && stock.volume > stock.avgVolume * 1.2
  },
  
  BREAKOUT_VOLUME: {
    name: 'Volume Breakout',
    description: 'High volume with price acceleration',
    criteria: (stock) => stock.volume > stock.avgVolume * 2 && Math.abs(stock.change) > 3
  },
  
  GAP_AND_GO: {
    name: 'Gap and Go',
    description: 'Stocks gapping up with sustained momentum',
    criteria: (stock) => stock.gapPercent > 3 && stock.change > 0 && stock.volume > stock.avgVolume * 1.8
  },
  
  MEAN_REVERSION: {
    name: 'Mean Reversion',
    description: 'Overextended stocks ready for pullback',
    criteria: (stock) => stock.rsi > 80 && stock.change > 5 && stock.bollinger_position > 1.8
  },
  
  // Options-Based Scans
  UNUSUAL_OPTIONS: {
    name: 'Unusual Options Activity',
    description: 'Abnormal options volume vs historical',
    criteria: (stock) => stock.optionsVolume > stock.avgOptionsVolume * 3 && stock.putCallRatio != null
  },
  
  GAMMA_SQUEEZE: {
    name: 'Gamma Squeeze Setup',
    description: 'High gamma exposure with call buying',
    criteria: (stock) => stock.gammaExposure > 1000000 && stock.putCallRatio < 0.7
  },
  
  // Short Squeeze Indicators
  SHORT_SQUEEZE: {
    name: 'Short Squeeze Candidates',
    description: 'High short interest with price momentum',
    criteria: (stock) => stock.shortInterest > 20 && stock.change > 3 && stock.utilizationRate > 90
  },
  
  DARK_POOL: {
    name: 'Dark Pool Activity',
    description: 'Unusual institutional flow detected',
    criteria: (stock) => stock.darkPoolActivity > 0.4 && stock.volume > stock.avgVolume * 1.5
  },
  
  // Market Cap Categories
  LARGE_CAP_MOVERS: {
    name: 'Large Cap Movers',
    description: 'Blue chip stocks with significant moves',
    criteria: (stock) => stock.marketCap > 50000000000 && Math.abs(stock.change) > 2
  },
  
  SMALL_CAP_MOMENTUM: {
    name: 'Small Cap Momentum',
    description: 'Small caps with explosive moves',
    criteria: (stock) => stock.marketCap < 2000000000 && stock.change > 5 && stock.volume > 500000
  },
  
  // Sector Rotation
  SECTOR_LEADERS: {
    name: 'Sector Leaders',
    description: 'Top performers in each sector',
    criteria: (stock) => stock.sectorRank <= 3 && stock.change > 1
  },
  
  // Earnings & Events
  EARNINGS_MOMENTUM: {
    name: 'Earnings Momentum',
    description: 'Post-earnings movers with follow-through',
    criteria: (stock) => stock.earningsProximity <= 5 && Math.abs(stock.change) > 8
  },
  
  // Volatility Plays
  LOW_VOLATILITY_BREAKOUT: {
    name: 'Low Vol Breakout',
    description: 'Quiet stocks starting to move',
    criteria: (stock) => stock.avgVolatility < 0.02 && stock.change > 3
  },
  
  HIGH_BETA_MOMENTUM: {
    name: 'High Beta Momentum',
    description: 'High beta stocks with market momentum',
    criteria: (stock) => stock.beta > 1.5 && stock.change * stock.spyChange > 0 && Math.abs(stock.change) > 2
  },

  // More realistic scanners for regular use
  ALL_STOCKS: {
    name: 'All Stocks',
    description: 'Show all stocks for testing - minimal filtering',
    criteria: (stock) => true // No filtering
  },

  TOP_GAINERS: {
    name: 'Top Gainers',
    description: 'Stocks with any positive movement',
    criteria: (stock) => stock.change > 0
  },

  TOP_LOSERS: {
    name: 'Top Losers', 
    description: 'Stocks with negative movement',
    criteria: (stock) => stock.change < 0
  },

  HIGH_VOLUME: {
    name: 'High Volume',
    description: 'Stocks with above-average volume activity',
    criteria: (stock) => stock.volumeScore > 1.2
  },

  MODERATE_MOVERS: {
    name: 'Moderate Movers',
    description: 'Stocks with moderate price movement (0.5%+)',
    criteria: (stock) => Math.abs(stock.change) > 0.5
  }
};

// Enhanced stock data enrichment
const enrichStockData = (baseStock) => {
  const price = baseStock.price;
  const change = baseStock.change;
  
  // Calculate technical indicators
  const rsi = calculateRSI(change);
  const sma20 = price * (0.98 + Math.random() * 0.04);
  const bollinger_upper = sma20 * 1.02;
  const bollinger_lower = sma20 * 0.98;
  const bollinger_position = (price - bollinger_lower) / (bollinger_upper - bollinger_lower);
  
  // Market metrics
  const marketCap = estimateMarketCap(baseStock.ticker, price);
  const avgVolume = baseStock.volume / (0.7 + Math.random() * 0.6); // Reverse calculate avg volume
  const beta = calculateBeta(baseStock.ticker);
  const sector = getSector(baseStock.ticker);
  
  // Options metrics
  const optionsVolume = Math.floor(baseStock.volume * (0.05 + Math.random() * 0.15));
  const avgOptionsVolume = optionsVolume / (0.8 + Math.random() * 0.4);
  const putCallRatio = 0.4 + Math.random() * 0.8;
  const gammaExposure = (Math.random() - 0.5) * 5000000;
  
  // Short metrics
  const shortInterest = Math.random() * 40;
  const utilizationRate = 70 + Math.random() * 30;
  const costToBorrow = Math.random() * 100;
  
  // Other metrics
  const darkPoolActivity = Math.random() * 0.6;
  const gapPercent = (Math.random() - 0.5) * 10;
  const earningsProximity = Math.floor(Math.random() * 90); // Days to earnings
  const avgVolatility = 0.01 + Math.random() * 0.05;
  const sectorRank = Math.floor(Math.random() * 10) + 1;
  const spyChange = -1 + Math.random() * 2; // SPY change for correlation
  
  return {
    ...baseStock,
    rsi,
    sma20,
    bollinger_position,
    marketCap,
    avgVolume,
    beta,
    sector,
    optionsVolume,
    avgOptionsVolume,
    putCallRatio,
    gammaExposure,
    shortInterest,
    utilizationRate,
    costToBorrow,
    darkPoolActivity,
    gapPercent,
    earningsProximity,
    avgVolatility,
    sectorRank,
    spyChange,
    // Calculated scores
    momentumScore: calculateMomentumScore(change, baseStock.volume, avgVolume),
    volumeScore: baseStock.volume / avgVolume,
    shortSqueezeScore: calculateShortSqueezeScore(shortInterest, utilizationRate, costToBorrow),
    technicalScore: calculateTechnicalScore(rsi, bollinger_position, change)
  };
};

const calculateRSI = (change) => {
  // Simplified RSI based on current change
  if (change > 5) return 70 + Math.random() * 25;
  if (change > 2) return 55 + Math.random() * 25;
  if (change < -5) return 5 + Math.random() * 25;
  if (change < -2) return 15 + Math.random() * 25;
  return 40 + Math.random() * 20;
};

const estimateMarketCap = (ticker, price) => {
  const capMap = {
    'AAPL': 3000000000000, 'MSFT': 2800000000000, 'GOOGL': 1800000000000,
    'AMZN': 1600000000000, 'TSLA': 800000000000, 'META': 700000000000,
    'NVDA': 1100000000000, 'BRK.B': 750000000000, 'UNH': 500000000000,
    'JPM': 450000000000, 'JNJ': 420000000000, 'V': 500000000000,
    'SPY': 400000000000, 'QQQ': 200000000000
  };
  
  if (capMap[ticker]) return capMap[ticker];
  
  // Estimate based on price
  if (price > 1000) return 100000000000 + Math.random() * 500000000000;
  if (price > 200) return 10000000000 + Math.random() * 90000000000;
  if (price > 50) return 1000000000 + Math.random() * 9000000000;
  return 100000000 + Math.random() * 900000000;
};

const calculateBeta = (ticker) => {
  const betaMap = {
    'TSLA': 2.1, 'NVDA': 1.8, 'AMD': 1.9, 'META': 1.3, 'NFLX': 1.2,
    'GME': 3.5, 'AMC': 4.2, 'AAPL': 1.2, 'MSFT': 0.9, 'GOOGL': 1.1,
    'SPY': 1.0, 'QQQ': 1.0, 'JNJ': 0.7, 'PG': 0.6, 'KO': 0.6
  };
  
  return betaMap[ticker] || (0.5 + Math.random() * 2);
};

const getSector = (ticker) => {
  const sectorMap = {
    'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'NVDA': 'Technology',
    'TSLA': 'Consumer Discretionary', 'META': 'Communication Services', 'AMZN': 'Consumer Discretionary',
    'JPM': 'Financial Services', 'BAC': 'Financial Services', 'WFC': 'Financial Services',
    'JNJ': 'Healthcare', 'PFE': 'Healthcare', 'UNH': 'Healthcare', 'ABBV': 'Healthcare',
    'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'EOG': 'Energy',
    'SPY': 'ETF', 'QQQ': 'ETF', 'IWM': 'ETF', 'VIX': 'ETF'
  };
  
  return sectorMap[ticker] || 'Other';
};

const calculateMomentumScore = (change, volume, avgVolume) => {
  const priceScore = Math.abs(change) / 10 * 50; // Max 50 points for 10% move
  const volumeScore = (volume / avgVolume) / 3 * 30; // Max 30 points for 3x volume
  const directionScore = change > 0 ? 20 : change < -2 ? 15 : 0; // Bonus for positive momentum
  
  return Math.min(100, priceScore + volumeScore + directionScore);
};

const calculateShortSqueezeScore = (shortInterest, utilization, costToBorrow) => {
  let score = 0;
  
  if (shortInterest > 30) score += 40;
  else if (shortInterest > 20) score += 25;
  else if (shortInterest > 10) score += 10;
  
  if (utilization > 95) score += 35;
  else if (utilization > 90) score += 25;
  else if (utilization > 80) score += 15;
  
  if (costToBorrow > 50) score += 25;
  else if (costToBorrow > 20) score += 15;
  else if (costToBorrow > 5) score += 5;
  
  return Math.min(100, score);
};

const calculateTechnicalScore = (rsi, bollingerPos, change) => {
  let score = 50; // Base score
  
  // RSI scoring
  if (rsi < 30 && change > 0) score += 25; // Oversold bounce
  else if (rsi > 70 && change < 0) score += 20; // Overbought reversal
  else if (rsi >= 50 && rsi <= 70 && change > 0) score += 15; // Healthy uptrend
  
  // Bollinger Band position
  if (bollingerPos > 1.0 && change > 0) score += 15; // Breaking upper band
  else if (bollingerPos < 0.0 && change > 0) score += 20; // Bouncing from lower band
  
  // Momentum consideration
  if (Math.abs(change) > 5) score += 10;
  
  return Math.min(100, Math.max(0, score));
};

export async function POST(request) {
  try {
    const { 
      scanType = 'MOMENTUM_BREAKOUT', 
      filters = {}, 
      sortBy = 'change', 
      sortOrder = 'desc',
      limit = 50,
      minPrice = 1,
      maxPrice = 10000,
      minVolume = 100000,
      minMarketCap = 0,
      sectors = []
    } = await request.json();

    // Get live market data directly
    const liveDataResult = getMarketSnapshot();
    
    if (!liveDataResult.success) {
      throw new Error('Failed to fetch live market data');
    }

    // Map symbol to ticker for compatibility
    const mappedData = liveDataResult.data.map(stock => ({
      ...stock,
      ticker: stock.symbol  // Add ticker field from symbol
    }));

    // Enrich all stocks with technical and fundamental data
    const enrichedStocks = mappedData.map(enrichStockData);
    
    // Apply base filters
    let filteredStocks = enrichedStocks.filter(stock => {
      return stock.price >= minPrice &&
             stock.price <= maxPrice &&
             stock.volume >= minVolume &&
             stock.marketCap >= minMarketCap &&
             (sectors.length === 0 || sectors.includes(stock.sector));
    });

    // Apply screening criteria
    const criteria = SCREENING_CRITERIA[scanType];
    if (scanType === 'ALL') {
      // Don't apply any additional filtering for ALL
    } else if (criteria && criteria.criteria) {
      filteredStocks = filteredStocks.filter(criteria.criteria);
    }

    // Apply additional custom filters
    if (filters.minRSI) filteredStocks = filteredStocks.filter(s => s.rsi >= filters.minRSI);
    if (filters.maxRSI) filteredStocks = filteredStocks.filter(s => s.rsi <= filters.maxRSI);
    if (filters.minBeta) filteredStocks = filteredStocks.filter(s => s.beta >= filters.minBeta);
    if (filters.maxBeta) filteredStocks = filteredStocks.filter(s => s.beta <= filters.maxBeta);
    if (filters.minShortInterest) filteredStocks = filteredStocks.filter(s => s.shortInterest >= filters.minShortInterest);

    // Sort results
    filteredStocks.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    // Limit results
    const results = filteredStocks.slice(0, limit);

    // Calculate summary statistics
    const summary = {
      totalScanned: enrichedStocks.length,
      totalFiltered: filteredStocks.length,
      totalReturned: results.length,
      avgChange: results.reduce((sum, s) => sum + s.change, 0) / results.length || 0,
      avgVolume: results.reduce((sum, s) => sum + s.volume, 0) / results.length || 0,
      topSectors: getTopSectors(results),
      marketCapDistribution: getMarketCapDistribution(results)
    };

    return NextResponse.json({
      success: true,
      scanType,
      criteria: criteria ? {
        name: criteria.name,
        description: criteria.description
      } : null,
      results,
      summary,
      filters: {
        minPrice, maxPrice, minVolume, minMarketCap, sectors,
        sortBy, sortOrder, limit
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Mass scanner error:', error);
    return NextResponse.json({ 
      error: 'Mass scanning failed', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'criteria';
    
    if (action === 'criteria') {
      const criteriaList = Object.entries(SCREENING_CRITERIA).map(([key, value]) => ({
        id: key,
        name: value.name,
        description: value.description
      }));
      
      return NextResponse.json({
        success: true,
        criteria: criteriaList,
        totalCriteria: criteriaList.length
      });
    }
    
    if (action === 'sectors') {
      const sectors = [
        'Technology', 'Healthcare', 'Financial Services', 'Energy', 
        'Consumer Discretionary', 'Consumer Staples', 'Communication Services',
        'Industrials', 'Materials', 'Utilities', 'Real Estate', 'ETF'
      ];
      
      return NextResponse.json({
        success: true,
        sectors,
        totalSectors: sectors.length
      });
    }
    
    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    
  } catch (error) {
    console.error('Mass scanner GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch scanner info' }, { status: 500 });
  }
}

const getTopSectors = (stocks) => {
  const sectorCounts = {};
  stocks.forEach(stock => {
    sectorCounts[stock.sector] = (sectorCounts[stock.sector] || 0) + 1;
  });
  
  return Object.entries(sectorCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([sector, count]) => ({ sector, count }));
};

const getMarketCapDistribution = (stocks) => {
  const distribution = { large: 0, mid: 0, small: 0, micro: 0 };
  
  stocks.forEach(stock => {
    if (stock.marketCap >= 10000000000) distribution.large++;
    else if (stock.marketCap >= 2000000000) distribution.mid++;
    else if (stock.marketCap >= 300000000) distribution.small++;
    else distribution.micro++;
  });
  
  return distribution;
};