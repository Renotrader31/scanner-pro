// Mock institutional flow data generator

export function generateMockInstitutionalFlow(tickers = [], action = 'smart_money_flow') {
  const results = [];
  
  // Sample tickers if none provided
  if (tickers.length === 0) {
    tickers = ['AAPL', 'TSLA', 'SPY', 'QQQ', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'AMD'];
  }
  
  switch (action) {
    case 'block_trades':
      return generateBlockTrades(tickers);
    case 'dark_pool_analysis':
      return generateDarkPoolAnalysis(tickers);
    case 'smart_money_flow':
      return generateSmartMoneyFlow(tickers);
    default:
      return [];
  }
}

function generateBlockTrades(tickers) {
  return tickers.slice(0, 20).map(ticker => {
    const basePrice = 50 + Math.random() * 450;
    const blockSize = Math.floor(50000 + Math.random() * 500000);
    const tradeValue = basePrice * blockSize;
    
    return {
      ticker,
      trades: Math.floor(Math.random() * 10) + 1,
      totalSize: blockSize,
      avgPrice: parseFloat(basePrice.toFixed(2)),
      totalValue: parseFloat(tradeValue.toFixed(2)),
      institutionalScore: Math.floor(60 + Math.random() * 40),
      classification: tradeValue > 10000000 ? 'WHALE_TRADE' : 
                      tradeValue > 5000000 ? 'LARGE_INSTITUTIONAL' : 'INSTITUTIONAL',
      timing: Math.random() > 0.5 ? 'ACCUMULATION' : 'DISTRIBUTION',
      priceImpact: parseFloat((Math.random() * 2 - 1).toFixed(2)),
      timestamp: new Date().toISOString()
    };
  }).sort((a, b) => b.totalValue - a.totalValue);
}

function generateDarkPoolAnalysis(tickers) {
  return tickers.slice(0, 15).map(ticker => {
    const darkPoolPercentage = 20 + Math.random() * 40;
    const totalVolume = Math.floor(1000000 + Math.random() * 10000000);
    const darkPoolVolume = Math.floor(totalVolume * (darkPoolPercentage / 100));
    const litVolume = totalVolume - darkPoolVolume;
    const basePrice = 50 + Math.random() * 450;
    
    return {
      ticker,
      darkPoolPercentage: parseFloat(darkPoolPercentage.toFixed(2)),
      litPercentage: parseFloat((100 - darkPoolPercentage).toFixed(2)),
      totalVolume,
      darkPoolVolume,
      litVolume,
      darkPoolVWAP: parseFloat((basePrice + Math.random() * 2 - 1).toFixed(2)),
      litVWAP: parseFloat((basePrice + Math.random() * 2 - 1).toFixed(2)),
      vwapSpread: parseFloat((Math.random() * 0.5).toFixed(3)),
      score: Math.floor(30 + Math.random() * 70),
      unusualActivity: {
        highDarkPoolRatio: darkPoolPercentage > 40,
        largeVWAPSpread: Math.random() > 0.7,
        concentratedTiming: Math.random() > 0.6,
        sizeDistribution: Math.random() > 0.5 ? 'CLUSTERED' : 'DISTRIBUTED'
      },
      classification: darkPoolPercentage > 45 ? 'HIGH_ACTIVITY' : 
                      darkPoolPercentage > 35 ? 'MODERATE_ACTIVITY' : 'NORMAL_ACTIVITY',
      tradeCount: {
        total: Math.floor(100 + Math.random() * 1000),
        darkPool: Math.floor(20 + Math.random() * 200),
        lit: Math.floor(80 + Math.random() * 800)
      }
    };
  }).sort((a, b) => b.score - a.score);
}

function generateSmartMoneyFlow(tickers) {
  return tickers.slice(0, 10).map(ticker => {
    const netFlow = (Math.random() - 0.5) * 100000000;
    const buyVolume = Math.floor(5000000 + Math.random() * 50000000);
    const sellVolume = Math.floor(5000000 + Math.random() * 50000000);
    const totalVolume = buyVolume + sellVolume;
    const flowScore = 50 + (netFlow / 1000000);
    
    return {
      ticker,
      smartMoneyScore: Math.min(100, Math.max(0, Math.floor(flowScore))),
      netFlow: parseFloat(netFlow.toFixed(2)),
      buyVolume,
      sellVolume,
      totalVolume,
      buyRatio: parseFloat((buyVolume / totalVolume).toFixed(3)),
      sellRatio: parseFloat((sellVolume / totalVolume).toFixed(3)),
      flowDirection: netFlow > 0 ? 'BULLISH' : 'BEARISH',
      confidence: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
      institutionalActivity: {
        largeOrders: Math.floor(10 + Math.random() * 100),
        avgOrderSize: Math.floor(10000 + Math.random() * 100000),
        concentrationScore: parseFloat((Math.random() * 100).toFixed(1))
      },
      recentTrend: Math.random() > 0.5 ? 'ACCUMULATING' : 'DISTRIBUTING',
      timestamp: new Date().toISOString()
    };
  }).sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow));
}

export function generateMockOptionsFlow(tickers = [], scanType = 'unusual_activity') {
  if (tickers.length === 0) {
    tickers = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'AMD', 'MSFT', 'AMZN', 'META', 'GOOGL'];
  }
  
  switch (scanType) {
    case 'unusual_activity':
      return generateUnusualOptionsActivity(tickers);
    case 'large_trades':
      return generateLargeOptionsTrades(tickers);
    case 'sweeps':
      return generateOptionsSweeps(tickers);
    default:
      return generateUnusualOptionsActivity(tickers);
  }
}

function generateUnusualOptionsActivity(tickers) {
  return tickers.slice(0, 15).map(ticker => {
    const callVolume = Math.floor(1000 + Math.random() * 50000);
    const putVolume = Math.floor(1000 + Math.random() * 50000);
    const totalVolume = callVolume + putVolume;
    const avgVolume = Math.floor(totalVolume * (0.2 + Math.random() * 0.3));
    const volumeRatio = totalVolume / avgVolume;
    
    return {
      ticker,
      totalVolume,
      callVolume,
      putVolume,
      putCallRatio: parseFloat((putVolume / callVolume).toFixed(3)),
      volumeRatio: parseFloat(volumeRatio.toFixed(2)),
      avgVolume,
      unusualScore: Math.min(100, Math.floor(volumeRatio * 20)),
      sentiment: callVolume > putVolume ? 'BULLISH' : 'BEARISH',
      mostActiveStrikes: generateActiveStrikes(ticker),
      netPremium: parseFloat((Math.random() * 10000000).toFixed(2)),
      openInterest: Math.floor(10000 + Math.random() * 100000),
      impliedVolatility: parseFloat((20 + Math.random() * 80).toFixed(2)),
      classification: volumeRatio > 5 ? 'EXTREMELY_UNUSUAL' : 
                      volumeRatio > 3 ? 'VERY_UNUSUAL' : 
                      volumeRatio > 2 ? 'UNUSUAL' : 'ELEVATED'
    };
  }).sort((a, b) => b.unusualScore - a.unusualScore);
}

function generateLargeOptionsTrades(tickers) {
  return tickers.slice(0, 10).flatMap(ticker => {
    const numTrades = Math.floor(1 + Math.random() * 5);
    return Array.from({ length: numTrades }, () => {
      const strike = Math.floor(50 + Math.random() * 450);
      const size = Math.floor(100 + Math.random() * 5000);
      const premium = size * (2 + Math.random() * 20) * 100;
      
      return {
        ticker,
        contractType: Math.random() > 0.5 ? 'CALL' : 'PUT',
        strike,
        expiration: generateExpiration(),
        size,
        premium: parseFloat(premium.toFixed(2)),
        executionPrice: parseFloat((2 + Math.random() * 20).toFixed(2)),
        spotPrice: parseFloat((strike * (0.95 + Math.random() * 0.1)).toFixed(2)),
        tradeType: Math.random() > 0.7 ? 'SWEEP' : 'BLOCK',
        sentiment: Math.random() > 0.5 ? 'OPENING' : 'CLOSING',
        aggressiveness: Math.random() > 0.5 ? 'AGGRESSIVE' : 'PASSIVE',
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
      };
    });
  }).sort((a, b) => b.premium - a.premium);
}

function generateOptionsSweeps(tickers) {
  return tickers.slice(0, 20).map(ticker => {
    const sweepCount = Math.floor(1 + Math.random() * 10);
    const totalPremium = Math.floor(100000 + Math.random() * 5000000);
    const avgSpeed = 50 + Math.random() * 450; // milliseconds
    
    return {
      ticker,
      sweepCount,
      totalPremium,
      avgExecutionSpeed: parseFloat(avgSpeed.toFixed(2)),
      contracts: Array.from({ length: Math.min(3, sweepCount) }, () => ({
        strike: Math.floor(50 + Math.random() * 450),
        type: Math.random() > 0.5 ? 'CALL' : 'PUT',
        expiration: generateExpiration(),
        size: Math.floor(100 + Math.random() * 1000),
        executionSpeed: parseFloat((50 + Math.random() * 200).toFixed(2))
      })),
      aggression: avgSpeed < 200 ? 'VERY_AGGRESSIVE' : 
                  avgSpeed < 300 ? 'AGGRESSIVE' : 'MODERATE',
      marketImpact: parseFloat((Math.random() * 2).toFixed(3)),
      followThrough: Math.random() > 0.5,
      timestamp: new Date().toISOString()
    };
  }).sort((a, b) => b.totalPremium - a.totalPremium);
}

function generateActiveStrikes(ticker) {
  const numStrikes = 3 + Math.floor(Math.random() * 3);
  const basePrice = 50 + Math.random() * 450;
  
  return Array.from({ length: numStrikes }, (_, i) => {
    const strike = Math.round(basePrice * (0.9 + i * 0.05));
    return {
      strike,
      type: Math.random() > 0.5 ? 'CALL' : 'PUT',
      volume: Math.floor(100 + Math.random() * 10000),
      openInterest: Math.floor(1000 + Math.random() * 50000),
      expiration: generateExpiration()
    };
  });
}

function generateExpiration() {
  const daysOut = [7, 14, 21, 30, 45, 60, 90];
  const selectedDays = daysOut[Math.floor(Math.random() * daysOut.length)];
  const expirationDate = new Date(Date.now() + selectedDays * 24 * 60 * 60 * 1000);
  return expirationDate.toISOString().split('T')[0];
}