const fetch = require('node-fetch');

async function testRecommendations() {
  try {
    // Get market data for SPY
    const marketRes = await fetch('http://localhost:3000/api/polygon?endpoint=/v2/aggs/ticker/SPY/prev');
    const marketData = await marketRes.json();
    
    if (!marketData.results?.[0]) {
      throw new Error('No market data available');
    }

    const stockData = marketData.results[0];
    const formattedMarketData = {
      ticker: 'SPY',
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
        ticker: 'SPY',
        marketData: formattedMarketData,
        shortData: null
      })
    });

    const mlResponse = await mlRes.json();
    console.log('ML Analysis:', mlResponse.success ? 'Success' : 'Failed');

    // Get Recommendations
    const recRes = await fetch('http://localhost:3000/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticker: 'SPY',
        marketData: formattedMarketData,
        mlAnalysis: mlResponse.analysis,
        accountSize: 10000,
        riskLevel: 'moderate'
      })
    });

    const recResponse = await recRes.json();
    console.log('Recommendations:', recResponse.success ? 'Success' : 'Failed');
    
    if (recResponse.recommendations) {
      console.log('Total recommendations:', recResponse.recommendations.length);
      
      // Show multi-leg strategies
      const multiLegStrategies = recResponse.recommendations.filter(r => 
        r.trade_type?.includes('spread') || 
        r.trade_type?.includes('strangle') || 
        r.trade_type?.includes('straddle') || 
        r.trade_type?.includes('condor')
      );
      
      console.log('\nMulti-leg strategies found:', multiLegStrategies.length);
      
      multiLegStrategies.forEach(strategy => {
        console.log('\n---', strategy.trade_type.toUpperCase(), '---');
        console.log('Description:', strategy.strategy_description);
        console.log('Strike Prices:', strategy.strike_prices);
        console.log('Expiry Date:', strategy.expiry_date);
        if (strategy.options_details) {
          console.log('Options Details:');
          strategy.options_details.forEach(leg => {
            console.log(`  ${leg.leg}: Strike $${leg.strike}, Bid $${leg.bid}, Ask $${leg.ask}, IV ${leg.iv}%`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRecommendations();
