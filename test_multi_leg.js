const fetch = require('node-fetch');

async function testMultiLeg(ticker) {
  try {
    // Get market data
    const marketRes = await fetch(`http://localhost:3000/api/polygon?endpoint=/v2/aggs/ticker/${ticker}/prev`);
    const marketData = await marketRes.json();
    
    if (!marketData.results?.[0]) {
      console.log(`No market data for ${ticker}`);
      return;
    }

    const stockData = marketData.results[0];
    const formattedMarketData = {
      ticker: ticker,
      price: stockData.c,
      change: ((stockData.c - stockData.o) / stockData.o * 100).toFixed(2),
      volume: stockData.v,
      high: stockData.h,
      low: stockData.l
    };

    // Get ML Analysis
    const mlRes = await fetch('http://localhost:3000/api/ml-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticker: ticker,
        marketData: formattedMarketData,
        shortData: null
      })
    });

    const mlResponse = await mlRes.json();

    // Try different risk levels to trigger more strategies
    const riskLevels = ['conservative', 'moderate', 'aggressive'];
    
    for (const riskLevel of riskLevels) {
      // Get Recommendations
      const recRes = await fetch('http://localhost:3000/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: ticker,
          marketData: formattedMarketData,
          mlAnalysis: mlResponse.analysis,
          accountSize: 100000,
          riskLevel: riskLevel,
          max_trades: 20
        })
      });

      const recResponse = await recRes.json();
      
      if (recResponse.recommendations) {
        const multiLegStrategies = recResponse.recommendations.filter(r => 
          r.trade_type?.includes('spread') || 
          r.trade_type?.includes('strangle') || 
          r.trade_type?.includes('straddle') || 
          r.trade_type?.includes('condor')
        );
        
        if (multiLegStrategies.length > 0) {
          console.log(`\n=== ${ticker} - Risk Level: ${riskLevel} ===`);
          console.log(`ML Direction: ${mlResponse.analysis?.prediction?.direction || 'N/A'}`);
          console.log(`ML Confidence: ${(mlResponse.analysis?.prediction?.confidence * 100 || 0).toFixed(1)}%`);
          console.log(`Multi-leg strategies found: ${multiLegStrategies.length}`);
          
          multiLegStrategies.forEach(strategy => {
            console.log(`\n--- ${strategy.trade_type.replace(/_/g, ' ').toUpperCase()} ---`);
            console.log('Description:', strategy.strategy_description);
            console.log('Strike Prices:', strategy.strike_prices);
            console.log('Expiry Date:', strategy.expiry_date);
            
            if (strategy.options_details) {
              console.log('Options Details:');
              strategy.options_details.forEach(leg => {
                console.log(`  ${leg.leg}: Strike $${leg.strike}, Bid $${leg.bid?.toFixed(2)}, Ask $${leg.ask?.toFixed(2)}, IV ${leg.iv?.toFixed(1)}%`);
              });
            } else {
              console.log('(No detailed options data available)');
            }
            
            console.log('Entry Price: $' + (strategy.entry_price || 0).toFixed(2));
            console.log('Max Risk: $' + (strategy.max_risk || 0).toFixed(0));
            console.log('Max Reward: $' + (strategy.max_reward || 0).toFixed(0));
          });
        }
      }
    }
    
  } catch (error) {
    console.error(`Error testing ${ticker}:`, error.message);
  }
}

// Test multiple tickers
async function runTests() {
  const tickers = ['AAPL', 'NVDA', 'TSLA'];
  
  for (const ticker of tickers) {
    await testMultiLeg(ticker);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
}

runTests();
