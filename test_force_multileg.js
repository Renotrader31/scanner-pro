const fetch = require('node-fetch');

async function testForceMultiLeg() {
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

    // Create ML analysis that triggers multi-leg strategies
    const mlAnalysis = {
      prediction: {
        direction: 'BULLISH',
        confidence: 0.65,  // Moderate confidence for spreads
        strength: 'MODERATE'
      },
      volatility: {
        prediction: 'STABLE',  // For iron condor
        confidence: 0.7
      },
      features: {
        implied_volatility: 45,  // High IV for short strangle
        price: stockData.c,
        volume: stockData.v,
        short_interest: 5
      }
    };

    // Get Recommendations with forced ML analysis
    const recRes = await fetch('http://localhost:3000/api/recommendations', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        ticker: ticker,
        marketData: formattedMarketData,
        mlAnalysis: mlAnalysis,
        accountSize: 100000,
        riskLevel: 'moderate',
        max_trades: 20
      })
    });

    const recResponse = await recRes.json();
    
    if (recResponse.recommendations) {
      console.log('Total recommendations:', recResponse.recommendations.length);
      
      // Find multi-leg strategies
      const multiLegStrategies = recResponse.recommendations.filter(r => 
        r.trade_type?.includes('spread') || 
        r.trade_type?.includes('condor') ||
        r.trade_type?.includes('strangle') ||
        r.trade_type?.includes('straddle')
      );
      
      console.log('Multi-leg strategies found:', multiLegStrategies.length);
      
      if (multiLegStrategies.length > 0) {
        multiLegStrategies.forEach(strategy => {
          console.log(`\n=== ${strategy.trade_type.toUpperCase()} ===`);
          console.log('Description:', strategy.strategy_description);
          console.log('Strike Prices:', strategy.strike_prices);
          console.log('Expiry Date:', strategy.expiry_date);
          console.log('Entry Price: $' + (strategy.entry_price || 0).toFixed(2));
          
          if (strategy.options_details && strategy.options_details.length > 0) {
            console.log('\n✅ OPTIONS DETAILS FOUND:');
            strategy.options_details.forEach(leg => {
              console.log(`\n  ${leg.leg}:`);
              console.log(`    Strike: $${leg.strike}`);
              console.log(`    Bid: $${leg.bid?.toFixed(2) || 'N/A'}`);
              console.log(`    Ask: $${leg.ask?.toFixed(2) || 'N/A'}`);
              console.log(`    IV: ${leg.iv?.toFixed(1) || 'N/A'}%`);
              console.log(`    Delta: ${leg.delta?.toFixed(3) || 'N/A'}`);
            });
          } else {
            console.log('❌ No options details found');
          }
        });
      } else {
        console.log('\nNo multi-leg strategies generated');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testForceMultiLeg();
