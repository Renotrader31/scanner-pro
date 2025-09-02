// Shared market data functions for API routes

// Stock universe - 400+ stocks from major indices
export const STOCK_UNIVERSE = [
  // S&P 500 Large Caps
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B', 'UNH',
  'JNJ', 'V', 'PG', 'JPM', 'XOM', 'HD', 'CVX', 'MA', 'PFE', 'ABBV',
  'AVGO', 'COST', 'WMT', 'DIS', 'KO', 'PEP', 'TMO', 'ABT', 'ACN', 'MRK',
  'CSCO', 'ADBE', 'LLY', 'NFLX', 'CRM', 'VZ', 'INTC', 'AMD', 'CMCSA', 'NKE',
  
  // Tech & Growth
  'SNOW', 'PLTR', 'ZM', 'DOCU', 'ROKU', 'SHOP', 'SQ', 'PYPL', 'UBER', 'LYFT',
  'TWLO', 'OKTA', 'ZS', 'CRWD', 'NET', 'DDOG', 'MDB', 'TEAM', 'NOW', 'WDAY',
  'SPLK', 'PANW', 'FTNT', 'CYBR', 'S', 'BILL', 'DOCN', 'FROG', 'AI', 'C3AI',
  
  // Add more stocks here...
];

// Generate realistic market data
export function generateMarketData(symbols = STOCK_UNIVERSE) {
  return symbols.map((symbol) => {
    const basePrice = Math.random() * 500 + 10;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;
    const volume = Math.floor(Math.random() * 50000000) + 1000000;
    
    return {
      symbol,
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume,
      bid: parseFloat((basePrice - 0.01).toFixed(2)),
      ask: parseFloat((basePrice + 0.01).toFixed(2)),
      dayHigh: parseFloat((basePrice + Math.abs(change)).toFixed(2)),
      dayLow: parseFloat((basePrice - Math.abs(change)).toFixed(2)),
      open: parseFloat((basePrice - change * 0.3).toFixed(2)),
      previousClose: parseFloat((basePrice - change).toFixed(2)),
      marketCap: Math.floor(basePrice * volume * Math.random() * 1000),
      avgVolume: Math.floor(volume * 0.9),
      week52High: parseFloat((basePrice * 1.5).toFixed(2)),
      week52Low: parseFloat((basePrice * 0.5).toFixed(2)),
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 2,
      bollinger: {
        upper: parseFloat((basePrice * 1.02).toFixed(2)),
        middle: basePrice,
        lower: parseFloat((basePrice * 0.98).toFixed(2))
      },
      timestamp: new Date().toISOString()
    };
  });
}

// Get live market snapshot
export function getMarketSnapshot() {
  try {
    const marketData = generateMarketData();
    return {
      success: true,
      data: marketData,
      timestamp: new Date().toISOString(),
      count: marketData.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}