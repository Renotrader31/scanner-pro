const POLYGON_API_KEY = '75rlu6cWGNnIqqR_x8M384YUjBgGk6kT';

async function testSnapshotFields() {
  try {
    const ticker = 'AAPL';
    const optionTicker = 'O:AAPL251017C00230000';
    
    console.log(`Testing snapshot fields for ${optionTicker}\n`);
    
    const snapshotUrl = `https://api.polygon.io/v3/snapshot/options/${ticker}/${optionTicker}?apikey=${POLYGON_API_KEY}`;
    const res = await fetch(snapshotUrl);
    const data = await res.json();
    
    if (data.results) {
      console.log('Full snapshot structure:');
      console.log(JSON.stringify(data.results, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSnapshotFields();
