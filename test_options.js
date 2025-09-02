const fetch = require('node-fetch');

async function testOptionsChain(ticker) {
  try {
    // Test the options chain API directly
    const expiryDays = 30;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + expiryDays);
    const expiry = targetDate.toISOString().split('T')[0];
    
    const url = `http://localhost:3000/api/polygon?endpoint=/v3/snapshot/options/${ticker}?expiration_date.gte=${expiry}&limit=250`;
    console.log('Fetching:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Results count:', data.results?.length || 0);
    
    if (data.results && data.results.length > 0) {
      console.log('\nFirst few options:');
      data.results.slice(0, 3).forEach(opt => {
        console.log(`- ${opt.details.contract_type} Strike: ${opt.details.strike_price}, Exp: ${opt.details.expiration_date}`);
        console.log(`  Bid: ${opt.day?.close || 0}, Ask: ${opt.day?.close || 0}, IV: ${opt.implied_volatility || 0}`);
      });
    } else {
      console.log('No options data returned');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOptionsChain('AAPL');
