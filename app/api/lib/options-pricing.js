// Options pricing utilities for real data integration

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || '75rlu6cWGNnIqqR_x8M384YUjBgGk6kT';

export async function getRealtimeOptionsChain(ticker, expiryDays = 30) {
  try {
    // Calculate target expiration date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + expiryDays);
    
    // Find next monthly expiration (3rd Friday)
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const expirationDate = new Date(year, month, 15);
    while (expirationDate.getDay() !== 5) {
      expirationDate.setDate(expirationDate.getDate() + 1);
    }
    const expDateString = expirationDate.toISOString().split('T')[0];
    
    console.log(`Fetching options for ${ticker} with expiration around ${expDateString}`);

    // Fetch current stock price
    const stockResponse = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?apikey=${POLYGON_API_KEY}`
    );
    const stockData = await stockResponse.json();
    const stockPrice = stockData.results?.[0]?.c || 100;

    // Fetch options contracts
    const contractsUrl = `https://api.polygon.io/v3/reference/options/contracts?` + 
      `underlying_ticker=${ticker}&expiration_date.gte=${expDateString}&` +
      `expiration_date.lte=${expDateString}&limit=200&apikey=${POLYGON_API_KEY}`;
    
    const contractsResponse = await fetch(contractsUrl);
    const contractsData = await contractsResponse.json();

    if (!contractsData.results || contractsData.results.length === 0) {
      return generateSyntheticOptionsChain(ticker, stockPrice, expDateString);
    }

    // Filter contracts near the money (within 10% of stock price)
    const nearMoneyContracts = contractsData.results.filter(c => {
      const strike = c.strike_price;
      return strike >= stockPrice * 0.9 && strike <= stockPrice * 1.1;
    }).slice(0, 30); // Get up to 30 near-the-money contracts

    // Fetch individual snapshots (bulk endpoint doesn't work for options)
    let snapshotData = { results: [] };
    
    if (nearMoneyContracts.length > 0) {
      try {
        const snapshotPromises = nearMoneyContracts.slice(0, 20).map(async (contract) => {
          try {
            const snapshotUrl = `https://api.polygon.io/v3/snapshot/options/${ticker}/${contract.ticker}?apikey=${POLYGON_API_KEY}`;
            const response = await fetch(snapshotUrl);
            const data = await response.json();
            
            if (data.status === 'OK' && data.results) {
              return data.results;
            }
            return null;
          } catch (error) {
            console.log(`Failed to fetch ${contract.ticker}:`, error.message);
            return null;
          }
        });
        
        const snapshots = await Promise.all(snapshotPromises);
        snapshotData = { results: snapshots.filter(s => s !== null) };
        
        console.log(`Fetched ${snapshotData.results.length} option snapshots for ${ticker}`);
      } catch (error) {
        console.error('Snapshot fetch error:', error);
      }
    }

    // Process and organize data
    const options = {
      calls: [],
      puts: [],
      stockPrice,
      expirationDate: expDateString
    };

    if (snapshotData.results) {
      // Handle both array and single result formats
      const resultsArray = Array.isArray(snapshotData.results) ? snapshotData.results : [snapshotData.results];
      
      resultsArray.forEach(snapshot => {
        const details = snapshot.details || {};
        const greeks = snapshot.greeks || {};
        const day = snapshot.day || {};
        
        // For paid API, we have day data and Greeks but need to estimate bid/ask
        // Use a tighter spread for liquid options
        const lastPrice = day.close || 1.0;
        const ivSpread = Math.min(0.1, Math.max(0.02, snapshot.implied_volatility || 0.25)); // 2-10% spread based on IV
        const spread = lastPrice * ivSpread;
        
        const optionData = {
          strike: details.strike_price,
          bid: Math.max(0.01, lastPrice - spread/2),
          ask: lastPrice + spread/2,
          last: lastPrice,
          volume: day.volume || 0,
          openInterest: snapshot.open_interest || 0,
          iv: snapshot.implied_volatility || 0.25,
          delta: greeks.delta || 0,
          gamma: greeks.gamma || 0,
          theta: greeks.theta || 0,
          vega: greeks.vega || 0,
          expiration: details.expiration_date,
          // Additional day data from paid API
          dayHigh: day.high || 0,
          dayLow: day.low || 0,
          dayOpen: day.open || 0,
          dayChange: day.change || 0,
          vwap: day.vwap || 0
        };

        if (details.contract_type === 'call') {
          options.calls.push(optionData);
        } else {
          options.puts.push(optionData);
        }
      });
    }

    // Sort by strike
    options.calls.sort((a, b) => a.strike - b.strike);
    options.puts.sort((a, b) => a.strike - b.strike);

    return options;

  } catch (error) {
    console.error('Error fetching real options data:', error);
    // Fallback to synthetic data
    return generateSyntheticOptionsChain(ticker, 100, null);
  }
}

export function generateSyntheticOptionsChain(ticker, stockPrice, expirationDate) {
  if (!expirationDate) {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    expirationDate = date.toISOString().split('T')[0];
  }

  const strikes = [];
  const baseStrike = Math.round(stockPrice / 5) * 5;
  
  // Generate strikes around current price
  for (let i = -5; i <= 5; i++) {
    const strike = baseStrike + (i * 5);
    if (strike > 0) strikes.push(strike);
  }

  const daysToExpiry = Math.max(1, Math.floor((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24)));
  const timeToExpiry = daysToExpiry / 365;
  const iv = 0.25 + Math.random() * 0.15;

  const calls = strikes.map(strike => {
    const moneyness = stockPrice / strike;
    const intrinsic = Math.max(0, stockPrice - strike);
    const timeValue = calculateTimeValue(stockPrice, strike, timeToExpiry, iv, 'call');
    const price = intrinsic + timeValue;
    const spread = Math.max(0.01, price * 0.02);
    
    return {
      strike,
      bid: Math.max(0.01, price - spread),
      ask: price + spread,
      last: price,
      volume: Math.floor(Math.random() * 1000) + 10,
      openInterest: Math.floor(Math.random() * 5000) + 100,
      iv,
      delta: calculateDelta(stockPrice, strike, timeToExpiry, iv, 'call'),
      gamma: 0.02,
      theta: -0.05,
      vega: 0.15,
      expiration: expirationDate
    };
  });

  const puts = strikes.map(strike => {
    const moneyness = strike / stockPrice;
    const intrinsic = Math.max(0, strike - stockPrice);
    const timeValue = calculateTimeValue(stockPrice, strike, timeToExpiry, iv, 'put');
    const price = intrinsic + timeValue;
    const spread = Math.max(0.01, price * 0.02);
    
    return {
      strike,
      bid: Math.max(0.01, price - spread),
      ask: price + spread,
      last: price,
      volume: Math.floor(Math.random() * 1000) + 10,
      openInterest: Math.floor(Math.random() * 5000) + 100,
      iv,
      delta: calculateDelta(stockPrice, strike, timeToExpiry, iv, 'put'),
      gamma: 0.02,
      theta: -0.05,
      vega: 0.15,
      expiration: expirationDate
    };
  });

  return {
    calls,
    puts,
    stockPrice,
    expirationDate
  };
}

function calculateTimeValue(stock, strike, time, iv, type) {
  const moneyness = type === 'call' ? stock / strike : strike / stock;
  const atmDistance = Math.abs(1 - moneyness);
  return Math.max(0.01, stock * iv * Math.sqrt(time) * 0.4 * Math.exp(-atmDistance * 3));
}

function calculateDelta(stock, strike, time, iv, type) {
  const moneyness = stock / strike;
  if (type === 'call') {
    if (moneyness > 1.1) return 0.9;
    if (moneyness < 0.9) return 0.1;
    return 0.5 + (moneyness - 1) * 2;
  } else {
    if (moneyness > 1.1) return -0.1;
    if (moneyness < 0.9) return -0.9;
    return -0.5 + (moneyness - 1) * 2;
  }
}

// Fetch real-time quote for a specific option contract (paid API feature)
export async function getOptionQuote(optionTicker) {
  try {
    const quoteUrl = `https://api.polygon.io/v3/quotes/${optionTicker}?limit=1&order=desc&apikey=${POLYGON_API_KEY}`;
    const response = await fetch(quoteUrl);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const quote = data.results[0];
      return {
        bid: quote.bid_price || 0,
        ask: quote.ask_price || 0,
        bidSize: quote.bid_size || 0,
        askSize: quote.ask_size || 0,
        timestamp: quote.participant_timestamp
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching option quote:', error);
    return null;
  }
}

// Fetch last trade for a specific option contract (paid API feature)
export async function getOptionLastTrade(optionTicker) {
  try {
    const tradeUrl = `https://api.polygon.io/v3/trades/${optionTicker}?limit=1&order=desc&apikey=${POLYGON_API_KEY}`;
    const response = await fetch(tradeUrl);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const trade = data.results[0];
      return {
        price: trade.price || 0,
        size: trade.size || 0,
        timestamp: trade.participant_timestamp,
        exchange: trade.exchange
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching last trade:', error);
    return null;
  }
}

export function findBestOption(options, type, targetStrike, minVolume = 0) {
  const optionsList = type === 'call' ? options.calls : options.puts;
  
  // Find closest strike with decent volume
  let bestOption = null;
  let minDiff = Infinity;
  
  for (const option of optionsList) {
    const diff = Math.abs(option.strike - targetStrike);
    if (diff < minDiff && option.volume >= minVolume) {
      minDiff = diff;
      bestOption = option;
    }
  }
  
  // If no option with volume, just get closest strike
  if (!bestOption && optionsList.length > 0) {
    bestOption = optionsList.reduce((prev, curr) => 
      Math.abs(curr.strike - targetStrike) < Math.abs(prev.strike - targetStrike) ? curr : prev
    );
  }
  
  return bestOption || {
    strike: targetStrike,
    bid: 1,
    ask: 1.5,
    last: 1.25,
    volume: 0,
    openInterest: 0,
    iv: 0.25
  };
}

export function calculateSpreadPrices(longOption, shortOption, type = 'debit') {
  if (!longOption || !shortOption) return { debit: 0, credit: 0, maxProfit: 0, maxLoss: 0 };
  
  if (type === 'debit') {
    const debit = longOption.ask - shortOption.bid;
    const maxProfit = Math.abs(longOption.strike - shortOption.strike) - debit;
    const maxLoss = debit;
    
    return {
      debit: Math.max(0.01, debit),
      credit: 0,
      maxProfit: maxProfit > 0 ? maxProfit : 0,
      maxLoss: maxLoss
    };
  } else {
    const credit = shortOption.bid - longOption.ask;
    const maxProfit = credit;
    const maxLoss = Math.abs(longOption.strike - shortOption.strike) - credit;
    
    return {
      debit: 0,
      credit: Math.max(0.01, credit),
      maxProfit: maxProfit > 0 ? maxProfit : 0,
      maxLoss: maxLoss > 0 ? maxLoss : 0
    };
  }
}