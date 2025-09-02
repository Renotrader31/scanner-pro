const POLYGON_API_KEY = '75rlu6cWGNnIqqR_x8M384YUjBgGk6kT';

async function testDirectOptionsAPI(ticker) {
  try {
    // Calculate target expiration date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    
    // Find next monthly expiration (3rd Friday)
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const expirationDate = new Date(year, month, 15);
    while (expirationDate.getDay() !== 5) {
      expirationDate.setDate(expirationDate.getDate() + 1);
    }
    const expDateString = expirationDate.toISOString().split('T')[0];
    
    console.log('Testing options for:', ticker);
    console.log('Target expiration:', expDateString);

    // Fetch options contracts
    const contractsUrl = `https://api.polygon.io/v3/reference/options/contracts?` + 
      `underlying_ticker=${ticker}&expiration_date.gte=${expDateString}&` +
      `expiration_date.lte=${expDateString}&limit=10&apikey=${POLYGON_API_KEY}`;
    
    console.log('Fetching contracts...');
    const contractsResponse = await fetch(contractsUrl);
    const contractsData = await contractsResponse.json();

    console.log('Contracts response status:', contractsData.status);
    console.log('Number of contracts found:', contractsData.results?.length || 0);
    
    if (contractsData.results && contractsData.results.length > 0) {
      console.log('\nFirst 3 contracts:');
      contractsData.results.slice(0, 3).forEach(contract => {
        console.log(`- ${contract.ticker}: ${contract.contract_type} Strike ${contract.strike_price}`);
      });
      
      // Try to get snapshot for first contract
      const firstTicker = contractsData.results[0].ticker;
      console.log('\nTrying to get snapshot for:', firstTicker);
      
      const snapshotUrl = `https://api.polygon.io/v3/snapshot/options/${ticker}/${firstTicker}?apikey=${POLYGON_API_KEY}`;
      const snapshotResponse = await fetch(snapshotUrl);
      const snapshotData = await snapshotResponse.json();
      
      console.log('Snapshot response status:', snapshotData.status);
      if (snapshotData.results) {
        const result = snapshotData.results;
        console.log('Option details:');
        console.log('- Strike:', result.details?.strike_price);
        console.log('- Bid:', result.last_quote?.bid);
        console.log('- Ask:', result.last_quote?.ask);
        console.log('- IV:', result.implied_volatility);
      }
    } else {
      console.log('No contracts found, falling back to synthetic data');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDirectOptionsAPI('AAPL');
