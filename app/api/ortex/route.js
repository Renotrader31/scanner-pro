import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Enhanced short interest data with more realistic patterns
const getShortInterestData = (ticker) => {
  const upperTicker = ticker?.toUpperCase();
  
  // Define different categories of stocks with realistic short interest patterns
  const shortCategories = {
    // Meme stocks / High short interest
    extreme: {
      tickers: ['AMC', 'GME', 'BBBY', 'ATER', 'MULN', 'CLOV', 'WISH'],
      shortInterest: { base: 25, variance: 25 }, // 25-50%
      utilization: { base: 85, variance: 15 }, // 85-100%
      costToBorrow: { base: 20, variance: 80 }, // 20-100%
      daysTocover: { base: 3, variance: 7 } // 3-10 days
    },
    // Growth stocks with moderate short interest
    high: {
      tickers: ['TSLA', 'NFLX', 'ZM', 'PELOTON', 'ROKU'],
      shortInterest: { base: 15, variance: 15 }, // 15-30%
      utilization: { base: 70, variance: 25 }, // 70-95%
      costToBorrow: { base: 8, variance: 20 }, // 8-28%
      daysTocover: { base: 2, variance: 4 } // 2-6 days
    },
    // Stable large caps with low short interest
    low: {
      tickers: ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'SPY', 'QQQ'],
      shortInterest: { base: 1, variance: 4 }, // 1-5%
      utilization: { base: 30, variance: 30 }, // 30-60%
      costToBorrow: { base: 0.5, variance: 3 }, // 0.5-3.5%
      daysTocover: { base: 0.5, variance: 1.5 } // 0.5-2 days
    }
  };
  
  // Determine category
  let category = 'low'; // default
  for (const [cat, data] of Object.entries(shortCategories)) {
    if (data.tickers.includes(upperTicker)) {
      category = cat;
      break;
    }
  }
  
  const config = shortCategories[category];
  
  // Add some time-based variance to make data feel more realistic
  const timeVariance = Math.sin(Date.now() / 86400000) * 0.1; // Daily cycle
  const randomVariance = (Math.random() - 0.5) * 0.2;
  const totalVariance = 1 + timeVariance + randomVariance;
  
  return {
    ticker,
    shortInterestPercent: Math.max(0, config.shortInterest.base + (Math.random() * config.shortInterest.variance * totalVariance)),
    utilizationRate: Math.min(100, Math.max(0, config.utilization.base + (Math.random() * config.utilization.variance * totalVariance))),
    costToBorrow: Math.max(0, config.costToBorrow.base + (Math.random() * config.costToBorrow.variance * totalVariance)),
    daystocover: Math.max(0.1, config.daysTocover.base + (Math.random() * config.daysTocover.variance * totalVariance)),
    
    // Additional realistic metrics
    sharesShort: Math.floor(Math.random() * 100000000) + 1000000, // 1M-100M shares
    sharesOutstanding: Math.floor(Math.random() * 1000000000) + 50000000, // 50M-1B shares
    freefloat: Math.floor(Math.random() * 500000000) + 25000000, // 25M-500M shares
    
    // Recent changes (simulate 7-day trend)
    shortInterestChange: (Math.random() - 0.5) * 10, // +/- 5%
    utilizationChange: (Math.random() - 0.5) * 20, // +/- 10%
    costToBorrowChange: (Math.random() - 0.5) * 5, // +/- 2.5%
    
    // Data quality indicators
    dataAge: Math.floor(Math.random() * 3) + 1, // 1-3 days old
    exchange: ['NASDAQ', 'NYSE', 'AMEX'][Math.floor(Math.random() * 3)],
    lastUpdated: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
  };
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker required' }, { status: 400 });
  }
  
  // Simulate some processing delay for realism
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
  
  const data = getShortInterestData(ticker);
  
  return NextResponse.json({ 
    success: true, 
    data,
    source: 'Enhanced Ortex Simulation',
    timestamp: new Date().toISOString()
  });
}
