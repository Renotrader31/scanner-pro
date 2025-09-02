const fetch = require('node-fetch');

async function testSingleRecommendation() {
  try {
    const ticker = 'AAPL';
    
    // Get market data
    const marketRes = await fetch(`http://localhost:3000/api/polygon?endpoint=/v2/aggs/ticker/${ticker}/prev`);
    const marketData = await marketRes.json();
    
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
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        ticker: ticker,
        marketData: formattedMarketData,
        shortData: null
      })
    });

    const mlResponse = await mlRes.json();

    // Get Recommendations
    const recRes = await fetch('http://localhost:3000/api/recommendations', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        ticker: ticker,
        marketData: formattedMarketData,
        mlAnalysis: mlResponse.analysis,
        accountSize: 100000,
        riskLevel: 'moderate',
        max_trades: 10
      })
    });

    const recResponse = await recRes.json();
    
    if (recResponse.recommendations) {
      console.log('Total recommendations:', recResponse.recommendations.length);
      
      // Find and display multi-leg strategies
      const multiLeg = recResponse.recommendations.find(r => 
        r.trade_type?.includes('spread') || 
        r.trade_type?.includes('condor')
      );
      
      if (multiLeg) {
        console.log('\n=== MULTI-LEG STRATEGY FOUND ===');
        console.log('Type:', multiLeg.trade_type);
        console.log('Description:', multiLeg.strategy_description);
        console.log('Strike Prices:', multiLeg.strike_prices);
        console.log('Expiry Date:', multiLeg.expiry_date);
        console.log('Options Details:', multiLeg.options_details);
        
        if (multiLeg.options_details && multiLeg.options_details.length > 0) {
          console.log('\n✅ SUCCESS: Options details are present!');
          multiLeg.options_details.forEach(leg => {
            console.log(`\n${leg.leg}:`);
            console.log(`  Strike: $${leg.strike}`);
            console.log(`  Bid: $${leg.bid?.toFixed(2) || 'N/A'}`);
            console.log(`  Ask: $${leg.ask?.toFixed(2) || 'N/A'}`);
            console.log(`  IV: ${leg.iv?.toFixed(1) || 'N/A'}%`);
          });
        } else {
          console.log('\n❌ ISSUE: No options details found');
        }
      } else {
        console.log('\nNo multi-leg strategies found in recommendations');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSingleRecommendation();
