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

// Get Simple Moving Average (SMA)
async function getSMA(ticker, params = {}) {
  const {
    window = 50,
    series_type = 'close',
    timespan = 'day',
    adjusted = true,
    order = 'desc',
    limit = 100
  } = params;

  return await polygonRequest(`/v1/indicators/sma/${ticker}`, {
    'timestamp.gte': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    window,
    series_type,
    timespan,
    adjusted,
    order,
    limit
  });
}

// Get Exponential Moving Average (EMA)
async function getEMA(ticker, params = {}) {
  const {
    window = 50,
    series_type = 'close',
    timespan = 'day',
    adjusted = true,
    order = 'desc',
    limit = 100
  } = params;

  return await polygonRequest(`/v1/indicators/ema/${ticker}`, {
    'timestamp.gte': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    window,
    series_type,
    timespan,
    adjusted,
    order,
    limit
  });
}

// Get MACD (Moving Average Convergence Divergence)
async function getMACD(ticker, params = {}) {
  const {
    short_window = 12,
    long_window = 26,
    signal_window = 9,
    series_type = 'close',
    timespan = 'day',
    adjusted = true,
    order = 'desc',
    limit = 100
  } = params;

  return await polygonRequest(`/v1/indicators/macd/${ticker}`, {
    'timestamp.gte': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    short_window,
    long_window,
    signal_window,
    series_type,
    timespan,
    adjusted,
    order,
    limit
  });
}

// Get RSI (Relative Strength Index)
async function getRSI(ticker, params = {}) {
  const {
    window = 14,
    series_type = 'close',
    timespan = 'day',
    adjusted = true,
    order = 'desc',
    limit = 100
  } = params;

  return await polygonRequest(`/v1/indicators/rsi/${ticker}`, {
    'timestamp.gte': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    window,
    series_type,
    timespan,
    adjusted,
    order,
    limit
  });
}

// Get comprehensive technical analysis for a ticker
async function getComprehensiveTechnicals(ticker, params = {}) {
  try {
    // Fetch all indicators in parallel
    const [smaData, emaData, macdData, rsiData] = await Promise.allSettled([
      getSMA(ticker, { window: 20, limit: 50 }),
      getEMA(ticker, { window: 20, limit: 50 }),
      getMACD(ticker, { limit: 50 }),
      getRSI(ticker, { window: 14, limit: 50 })
    ]);

    // Get current stock price
    const stockData = await polygonRequest(`/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`);
    const currentPrice = stockData.ticker?.lastQuote?.p || stockData.ticker?.prevDay?.c || 0;

    // Process results
    const sma = smaData.status === 'fulfilled' ? smaData.value.results?.values?.[0] : null;
    const ema = emaData.status === 'fulfilled' ? emaData.value.results?.values?.[0] : null;
    const macd = macdData.status === 'fulfilled' ? macdData.value.results?.values?.[0] : null;
    const rsi = rsiData.status === 'fulfilled' ? rsiData.value.results?.values?.[0] : null;

    // Calculate technical signals
    const signals = generateTechnicalSignals(currentPrice, sma, ema, macd, rsi);

    return {
      ticker,
      currentPrice,
      timestamp: Date.now(),
      indicators: {
        sma: sma ? {
          value: sma.value,
          timestamp: sma.timestamp,
          signal: currentPrice > sma.value ? 'BULLISH' : 'BEARISH',
          strength: Math.abs(((currentPrice - sma.value) / sma.value) * 100)
        } : null,
        ema: ema ? {
          value: ema.value,
          timestamp: ema.timestamp,
          signal: currentPrice > ema.value ? 'BULLISH' : 'BEARISH',
          strength: Math.abs(((currentPrice - ema.value) / ema.value) * 100)
        } : null,
        macd: macd ? {
          value: macd.value,
          signal: macd.signal,
          histogram: macd.histogram,
          timestamp: macd.timestamp,
          trend: macd.value > macd.signal ? 'BULLISH' : 'BEARISH',
          strength: Math.abs(macd.histogram) * 10
        } : null,
        rsi: rsi ? {
          value: rsi.value,
          timestamp: rsi.timestamp,
          signal: rsi.value > 70 ? 'OVERBOUGHT' : rsi.value < 30 ? 'OVERSOLD' : 'NEUTRAL',
          strength: rsi.value > 70 ? rsi.value - 70 : rsi.value < 30 ? 30 - rsi.value : 0
        } : null
      },
      signals,
      overallSignal: signals.overall,
      confidence: signals.confidence
    };

  } catch (error) {
    console.error(`Error fetching technicals for ${ticker}:`, error);
    throw error;
  }
}

// Generate trading signals based on technical indicators
function generateTechnicalSignals(currentPrice, sma, ema, macd, rsi) {
  const signals = [];
  let bullishCount = 0;
  let bearishCount = 0;
  let totalWeight = 0;

  // SMA Signal (Weight: 20%)
  if (sma) {
    const weight = 0.2;
    totalWeight += weight;
    if (currentPrice > sma.value) {
      signals.push({ indicator: 'SMA', signal: 'BULLISH', strength: ((currentPrice - sma.value) / sma.value) * 100, weight });
      bullishCount += weight;
    } else {
      signals.push({ indicator: 'SMA', signal: 'BEARISH', strength: ((sma.value - currentPrice) / sma.value) * 100, weight });
      bearishCount += weight;
    }
  }

  // EMA Signal (Weight: 25%)
  if (ema) {
    const weight = 0.25;
    totalWeight += weight;
    if (currentPrice > ema.value) {
      signals.push({ indicator: 'EMA', signal: 'BULLISH', strength: ((currentPrice - ema.value) / ema.value) * 100, weight });
      bullishCount += weight;
    } else {
      signals.push({ indicator: 'EMA', signal: 'BEARISH', strength: ((ema.value - currentPrice) / ema.value) * 100, weight });
      bearishCount += weight;
    }
  }

  // MACD Signal (Weight: 30%)
  if (macd) {
    const weight = 0.3;
    totalWeight += weight;
    if (macd.value > macd.signal) {
      signals.push({ indicator: 'MACD', signal: 'BULLISH', strength: Math.abs(macd.histogram) * 10, weight });
      bullishCount += weight;
    } else {
      signals.push({ indicator: 'MACD', signal: 'BEARISH', strength: Math.abs(macd.histogram) * 10, weight });
      bearishCount += weight;
    }
  }

  // RSI Signal (Weight: 25%)
  if (rsi) {
    const weight = 0.25;
    totalWeight += weight;
    if (rsi.value > 70) {
      signals.push({ indicator: 'RSI', signal: 'OVERBOUGHT', strength: rsi.value - 70, weight });
      bearishCount += weight * 0.7; // Overbought is 70% bearish
    } else if (rsi.value < 30) {
      signals.push({ indicator: 'RSI', signal: 'OVERSOLD', strength: 30 - rsi.value, weight });
      bullishCount += weight * 0.7; // Oversold is 70% bullish
    } else {
      signals.push({ indicator: 'RSI', signal: 'NEUTRAL', strength: 0, weight });
      // Neutral RSI doesn't add to either side
    }
  }

  // Calculate overall signal
  const bullishPercentage = totalWeight > 0 ? (bullishCount / totalWeight) : 0;
  const bearishPercentage = totalWeight > 0 ? (bearishCount / totalWeight) : 0;
  
  let overall = 'NEUTRAL';
  let confidence = 0;

  if (bullishPercentage > 0.6) {
    overall = 'STRONG_BULLISH';
    confidence = Math.min(95, bullishPercentage * 100);
  } else if (bullishPercentage > 0.4) {
    overall = 'BULLISH';
    confidence = Math.min(85, bullishPercentage * 100);
  } else if (bearishPercentage > 0.6) {
    overall = 'STRONG_BEARISH';
    confidence = Math.min(95, bearishPercentage * 100);
  } else if (bearishPercentage > 0.4) {
    overall = 'BEARISH';
    confidence = Math.min(85, bearishPercentage * 100);
  } else {
    overall = 'NEUTRAL';
    confidence = 50;
  }

  return {
    individual: signals,
    overall,
    confidence: Math.round(confidence),
    bullishWeight: Math.round(bullishPercentage * 100),
    bearishWeight: Math.round(bearishPercentage * 100),
    summary: `${signals.length} indicators analyzed: ${overall} (${Math.round(confidence)}% confidence)`
  };
}

export async function POST(request) {
  try {
    const { action, ticker, tickers = [], params = {} } = await request.json();
    
    let results;
    
    switch (action) {
      case 'sma':
        if (!ticker) throw new Error('Ticker required for SMA');
        results = await getSMA(ticker, params);
        break;
        
      case 'ema':
        if (!ticker) throw new Error('Ticker required for EMA');
        results = await getEMA(ticker, params);
        break;
        
      case 'macd':
        if (!ticker) throw new Error('Ticker required for MACD');
        results = await getMACD(ticker, params);
        break;
        
      case 'rsi':
        if (!ticker) throw new Error('Ticker required for RSI');
        results = await getRSI(ticker, params);
        break;
        
      case 'comprehensive':
        if (!ticker) throw new Error('Ticker required for comprehensive analysis');
        results = await getComprehensiveTechnicals(ticker, params);
        break;
        
      case 'batch_analysis':
        if (!tickers.length) throw new Error('Tickers required for batch analysis');
        
        const batchResults = [];
        for (const t of tickers.slice(0, 10)) { // Limit to prevent rate limiting
          try {
            const analysis = await getComprehensiveTechnicals(t, params);
            batchResults.push(analysis);
          } catch (error) {
            console.error(`Error analyzing ${t}:`, error.message);
            batchResults.push({
              ticker: t,
              error: error.message,
              timestamp: Date.now()
            });
          }
        }
        results = batchResults;
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      action,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Technical indicators error:', error);
    return NextResponse.json({ 
      error: 'Technical analysis failed', 
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
        status: 'Technical Indicators API ready',
        endpoints: [
          'sma - Simple Moving Average',
          'ema - Exponential Moving Average', 
          'macd - MACD Indicator',
          'rsi - Relative Strength Index',
          'comprehensive - Full technical analysis',
          'batch_analysis - Multiple tickers analysis'
        ],
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Technical indicators GET error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}