// Import the function directly
const { getRealtimeOptionsChain } = require('./app/api/lib/options-pricing.js');

async function testOptionsChain() {
  try {
    console.log('Testing getRealtimeOptionsChain function...\n');
    
    const ticker = 'AAPL';
    const expiryDays = 30;
    
    console.log(`Fetching options chain for ${ticker} (${expiryDays} days out)...`);
    
    const optionsChain = await getRealtimeOptionsChain(ticker, expiryDays);
    
    console.log(`\nResults:`);
    console.log(`- Stock Price: $${optionsChain.stockPrice?.toFixed(2) || 'N/A'}`);
    console.log(`- Expiration: ${optionsChain.expirationDate}`);
    console.log(`- Calls: ${optionsChain.calls.length}`);
    console.log(`- Puts: ${optionsChain.puts.length}`);
    
    if (optionsChain.calls.length > 0) {
      console.log('\nSample Call Option:');
      const sampleCall = optionsChain.calls.find(c => Math.abs(c.strike - optionsChain.stockPrice) < 5) || optionsChain.calls[0];
      console.log(`  Strike: $${sampleCall.strike}`);
      console.log(`  Bid: $${sampleCall.bid?.toFixed(2)}`);
      console.log(`  Ask: $${sampleCall.ask?.toFixed(2)}`);
      console.log(`  Last: $${sampleCall.last?.toFixed(2)}`);
      console.log(`  IV: ${(sampleCall.iv * 100).toFixed(2)}%`);
      console.log(`  Delta: ${sampleCall.delta?.toFixed(3)}`);
      console.log(`  Volume: ${sampleCall.volume}`);
      console.log(`  OI: ${sampleCall.openInterest}`);
    }
    
    if (optionsChain.puts.length > 0) {
      console.log('\nSample Put Option:');
      const samplePut = optionsChain.puts.find(p => Math.abs(p.strike - optionsChain.stockPrice) < 5) || optionsChain.puts[0];
      console.log(`  Strike: $${samplePut.strike}`);
      console.log(`  Bid: $${samplePut.bid?.toFixed(2)}`);
      console.log(`  Ask: $${samplePut.ask?.toFixed(2)}`);
      console.log(`  Last: $${samplePut.last?.toFixed(2)}`);
      console.log(`  IV: ${(samplePut.iv * 100).toFixed(2)}%`);
      console.log(`  Delta: ${samplePut.delta?.toFixed(3)}`);
      console.log(`  Volume: ${samplePut.volume}`);
      console.log(`  OI: ${samplePut.openInterest}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testOptionsChain();
