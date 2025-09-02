// Test FMP API integration
const FMP_API_KEY = process.env.FMP_API_KEY || 'your_fmp_key_here';

async function testFMPAPI() {
  console.log('\n=== Testing FMP API ===\n');
  
  if (FMP_API_KEY === 'your_fmp_key_here') {
    console.log('❌ FMP API key not configured');
    console.log('Please add your FMP API key to .env.local file:');
    console.log('FMP_API_KEY=your_actual_fmp_key_here\n');
    return;
  }
  
  console.log('✅ FMP API key found (hidden for security)');
  
  try {
    // Test 1: Get stock quote with bid/ask
    console.log('\nTest 1: Fetching AAPL quote with bid/ask...');
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${FMP_API_KEY}`;
    const quoteRes = await fetch(quoteUrl);
    const quoteData = await quoteRes.json();
    
    if (quoteData && quoteData.length > 0) {
      const quote = quoteData[0];
      console.log('✅ Stock Quote Success:');
      console.log(`  Symbol: ${quote.symbol}`);
      console.log(`  Price: $${quote.price}`);
      console.log(`  Bid: $${quote.bid || 'N/A'}`);
      console.log(`  Ask: $${quote.ask || 'N/A'}`);
      console.log(`  Volume: ${quote.volume}`);
      console.log(`  Change: ${quote.changesPercentage}%`);
    } else if (quoteData.error) {
      console.log('❌ FMP API Error:', quoteData.error);
    } else {
      console.log('❌ No quote data returned');
    }
    
    // Test 2: Get options chain
    console.log('\nTest 2: Fetching AAPL options chain...');
    const optionsUrl = `https://financialmodelingprep.com/api/v3/options-chain/AAPL?apikey=${FMP_API_KEY}`;
    const optionsRes = await fetch(optionsUrl);
    const optionsData = await optionsRes.json();
    
    if (Array.isArray(optionsData) && optionsData.length > 0) {
      console.log('✅ Options Chain Success:');
      console.log(`  Found ${optionsData.length} expiration dates`);
      
      // Show first expiration details
      const firstExpiry = optionsData[0];
      console.log(`  Next expiry: ${firstExpiry.expirationDate}`);
      
      if (firstExpiry.options && firstExpiry.options.length > 0) {
        const atmOption = firstExpiry.options.find(opt => 
          opt.type === 'CALL' && Math.abs(opt.strike - quote.price) < 5
        );
        
        if (atmOption) {
          console.log(`  Sample ATM Call (Strike ${atmOption.strike}):`);
          console.log(`    Bid: $${atmOption.bid}`);
          console.log(`    Ask: $${atmOption.ask}`);
          console.log(`    Last: $${atmOption.lastPrice}`);
          console.log(`    Volume: ${atmOption.volume}`);
          console.log(`    Open Interest: ${atmOption.openInterest}`);
          console.log(`    IV: ${(atmOption.impliedVolatility * 100).toFixed(2)}%`);
        }
      }
    } else if (optionsData.error) {
      console.log('❌ FMP Options API Error:', optionsData.error);
    } else {
      console.log('❌ No options data returned');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFMPAPI();