const POLYGON_API_KEY = '75rlu6cWGNnIqqR_x8M384YUjBgGk6kT';

async function testSnapshotDetail(ticker) {
  try {
    const contractTicker = 'O:AAPL251017C00230000'; // Near ATM
    
    const snapshotUrl = `https://api.polygon.io/v3/snapshot/options/${ticker}/${contractTicker}?apikey=${POLYGON_API_KEY}`;
    console.log('Fetching snapshot for:', contractTicker);
    
    const response = await fetch(snapshotUrl);
    const data = await response.json();
    
    if (data.results) {
      console.log('\nFull snapshot data structure:');
      console.log(JSON.stringify(data.results, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSnapshotDetail('AAPL');
