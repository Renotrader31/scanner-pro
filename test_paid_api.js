const POLYGON_API_KEY = '75rlu6cWGNnIqqR_x8M384YUjBgGk6kT';

async function testPaidOptionsAPI(ticker) {
  try {
    console.log(`\nTesting Paid API Options Features for ${ticker}\n`);
    
    // 1. Get current stock price
    const stockUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?apikey=${POLYGON_API_KEY}`;
    const stockRes = await fetch(stockUrl);
    const stockData = await stockRes.json();
    const stockPrice = stockData.results?.[0]?.c || 100;
    console.log(`Stock Price: $${stockPrice.toFixed(2)}`);
    
    // 2. Get options contracts for next monthly expiration
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const expirationDate = new Date(year, month, 15);
    while (expirationDate.getDay() !== 5) {
      expirationDate.setDate(expirationDate.getDate() + 1);
    }
    const expDateString = expirationDate.toISOString().split('T')[0];
    console.log(`Target Expiration: ${expDateString}`);
    
    // 3. Fetch options contracts
    const contractsUrl = `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${ticker}&expiration_date=${expDateString}&limit=100&apikey=${POLYGON_API_KEY}`;
    const contractsRes = await fetch(contractsUrl);
    const contractsData = await contractsRes.json();
    
    console.log(`\nFound ${contractsData.results?.length || 0} contracts for ${expDateString}`);
    
    if (contractsData.results && contractsData.results.length > 0) {
      // Find ATM options
      const atmCall = contractsData.results.find(c => 
        c.contract_type === 'call' && 
        Math.abs(c.strike_price - stockPrice) < 5
      );
      
      const atmPut = contractsData.results.find(c => 
        c.contract_type === 'put' && 
        Math.abs(c.strike_price - stockPrice) < 5
      );
      
      console.log('\n--- Testing Options Snapshot (Paid Feature) ---');
      
      if (atmCall) {
        console.log(`\nATM Call: ${atmCall.ticker} (Strike: $${atmCall.strike_price})`);
        
        // Get snapshot with full data
        const snapshotUrl = `https://api.polygon.io/v3/snapshot/options/${ticker}/${atmCall.ticker}?apikey=${POLYGON_API_KEY}`;
        const snapshotRes = await fetch(snapshotUrl);
        const snapshotData = await snapshotRes.json();
        
        if (snapshotData.results) {
          const snapshot = snapshotData.results;
          console.log('Snapshot Data:');
          console.log(`  Day Close: $${snapshot.day?.close || 'N/A'}`);
          console.log(`  Day Volume: ${snapshot.day?.volume || 0}`);
          console.log(`  Open Interest: ${snapshot.open_interest || 0}`);
          console.log(`  Implied Volatility: ${(snapshot.implied_volatility * 100 || 0).toFixed(2)}%`);
          
          if (snapshot.last_quote) {
            console.log('  Last Quote (REAL BID/ASK):');
            console.log(`    Bid: $${snapshot.last_quote.bid || 'N/A'}`);
            console.log(`    Ask: $${snapshot.last_quote.ask || 'N/A'}`);
            console.log(`    Bid Size: ${snapshot.last_quote.bid_size || 'N/A'}`);
            console.log(`    Ask Size: ${snapshot.last_quote.ask_size || 'N/A'}`);
          }
          
          if (snapshot.last_trade) {
            console.log('  Last Trade:');
            console.log(`    Price: $${snapshot.last_trade.price || 'N/A'}`);
            console.log(`    Size: ${snapshot.last_trade.size || 'N/A'}`);
          }
          
          if (snapshot.greeks) {
            console.log('  Greeks:');
            console.log(`    Delta: ${snapshot.greeks.delta?.toFixed(3) || 'N/A'}`);
            console.log(`    Gamma: ${snapshot.greeks.gamma?.toFixed(3) || 'N/A'}`);
            console.log(`    Theta: ${snapshot.greeks.theta?.toFixed(3) || 'N/A'}`);
            console.log(`    Vega: ${snapshot.greeks.vega?.toFixed(3) || 'N/A'}`);
          }
        }
        
        // Test Quotes endpoint (real-time bid/ask)
        console.log('\n--- Testing Quotes Endpoint (Paid Feature) ---');
        const quotesUrl = `https://api.polygon.io/v3/quotes/${atmCall.ticker}?limit=1&order=desc&apikey=${POLYGON_API_KEY}`;
        const quotesRes = await fetch(quotesUrl);
        const quotesData = await quotesRes.json();
        
        if (quotesData.results && quotesData.results.length > 0) {
          const quote = quotesData.results[0];
          console.log('Latest Quote:');
          console.log(`  Bid: $${quote.bid_price}`);
          console.log(`  Ask: $${quote.ask_price}`);
          console.log(`  Bid Size: ${quote.bid_size}`);
          console.log(`  Ask Size: ${quote.ask_size}`);
          console.log(`  Exchange: ${quote.exchange}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test with AAPL
testPaidOptionsAPI('AAPL');
