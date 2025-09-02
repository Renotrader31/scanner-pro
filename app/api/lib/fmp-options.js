// FMP (Financial Modeling Prep) options data integration
const FMP_API_KEY = process.env.FMP_API_KEY || 'your_fmp_key_here';

// Get real-time quote with bid/ask from FMP
export async function getFMPQuote(ticker) {
  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${FMP_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.length > 0) {
      const quote = data[0];
      return {
        price: quote.price,
        bid: quote.bid || quote.price * 0.995,
        ask: quote.ask || quote.price * 1.005,
        volume: quote.volume,
        dayHigh: quote.dayHigh,
        dayLow: quote.dayLow,
        previousClose: quote.previousClose,
        change: quote.change,
        changePercent: quote.changesPercentage,
        marketCap: quote.marketCap,
        pe: quote.pe,
        eps: quote.eps,
        timestamp: quote.timestamp
      };
    }
    return null;
  } catch (error) {
    console.error('FMP quote fetch error:', error);
    return null;
  }
}

// Get option chain with bid/ask from FMP
export async function getFMPOptionsChain(ticker, expirationDate = null) {
  try {
    let url = `https://financialmodelingprep.com/api/v3/options-chain/${ticker}?apikey=${FMP_API_KEY}`;
    if (expirationDate) {
      url += `&date=${expirationDate}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data) {
      const options = {
        calls: [],
        puts: [],
        expirationDates: []
      };
      
      // Process the data based on FMP's format
      if (Array.isArray(data)) {
        data.forEach(expiry => {
          const expDate = expiry.expirationDate;
          options.expirationDates.push(expDate);
          
          if (expiry.options) {
            expiry.options.forEach(option => {
              const optionData = {
                strike: option.strike,
                bid: option.bid || 0,
                ask: option.ask || 0,
                last: option.lastPrice || ((option.bid + option.ask) / 2),
                volume: option.volume || 0,
                openInterest: option.openInterest || 0,
                iv: option.impliedVolatility || 0.25,
                delta: option.delta || 0,
                gamma: option.gamma || 0,
                theta: option.theta || 0,
                vega: option.vega || 0,
                expiration: expDate,
                inTheMoney: option.inTheMoney || false,
                contractSymbol: option.contractSymbol
              };
              
              if (option.type === 'CALL') {
                options.calls.push(optionData);
              } else if (option.type === 'PUT') {
                options.puts.push(optionData);
              }
            });
          }
        });
      }
      
      // Sort by strike
      options.calls.sort((a, b) => a.strike - b.strike);
      options.puts.sort((a, b) => a.strike - b.strike);
      
      return options;
    }
    
    return null;
  } catch (error) {
    console.error('FMP options chain fetch error:', error);
    return null;
  }
}

// Get historical options data from FMP
export async function getFMPHistoricalOptions(ticker, fromDate, toDate) {
  try {
    const url = `https://financialmodelingprep.com/api/v4/options-chain/${ticker}/historical?from=${fromDate}&to=${toDate}&apikey=${FMP_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('FMP historical options fetch error:', error);
    return null;
  }
}

// Get most active options from FMP
export async function getFMPMostActiveOptions() {
  try {
    const url = `https://financialmodelingprep.com/api/v3/options-chain/most-active?apikey=${FMP_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('FMP most active options fetch error:', error);
    return [];
  }
}

export default {
  getFMPQuote,
  getFMPOptionsChain,
  getFMPHistoricalOptions,
  getFMPMostActiveOptions
};