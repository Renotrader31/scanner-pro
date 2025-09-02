const POLYGON_API_KEY = '75rlu6cWGNnIqqR_x8M384YUjBgGk6kT';

async function checkActualPrices() {
  const ticker = 'AAPL';
  const optionTicker = 'O:AAPL251017C00230000';
  
  const url = `https://api.polygon.io/v3/snapshot/options/${ticker}/${optionTicker}?apikey=${POLYGON_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.results) {
    const snapshot = data.results;
    console.log(`\n${optionTicker} (Strike: $${snapshot.details.strike_price})`);
    console.log(`Day Close: $${snapshot.day.close}`);
    console.log(`Day Volume: ${snapshot.day.volume}`);
    console.log(`Open Interest: ${snapshot.open_interest}`);
    console.log(`IV: ${(snapshot.implied_volatility * 100).toFixed(2)}%`);
    console.log(`Delta: ${snapshot.greeks.delta.toFixed(3)}`);
    
    // Calculate estimated bid/ask
    const lastPrice = snapshot.day.close;
    const ivSpread = Math.min(0.1, Math.max(0.02, snapshot.implied_volatility));
    const spread = lastPrice * ivSpread;
    console.log(`\nEstimated Bid: $${(lastPrice - spread/2).toFixed(2)}`);
    console.log(`Estimated Ask: $${(lastPrice + spread/2).toFixed(2)}`);
  }
}

checkActualPrices();
