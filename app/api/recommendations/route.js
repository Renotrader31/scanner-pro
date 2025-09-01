import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { ticker, marketData, mlAnalysis, accountSize = 100000, riskLevel = 'moderate' } = await request.json();
    
    if (!ticker || !marketData || !mlAnalysis) {
      return NextResponse.json({ error: 'Ticker, market data, and ML analysis required' }, { status: 400 });
    }

    // Generate trade recommendations
    const recommendations = await generateRecommendations(ticker, marketData, mlAnalysis, accountSize, riskLevel);
    
    return NextResponse.json({
      success: true,
      ticker,
      recommendations,
      total_recommendations: recommendations.length,
      account_size: accountSize,
      risk_level: riskLevel,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Recommendations generation failed', details: error.message }, { status: 500 });
  }
}

async function generateRecommendations(ticker, marketData, mlAnalysis, accountSize, riskLevel) {
  // Extract ML predictions with enhanced data
  const mlPred = mlAnalysis.ml_analysis || {};
  const pricePred = mlPred.price_prediction || {};
  const volForecast = mlPred.volatility_forecast || {};
  const composite = mlPred.composite_score || {};
  const features = mlAnalysis.features || {};
  const marketContext = mlAnalysis.market_context || {};
  
  const direction = pricePred.direction || 'NEUTRAL';
  const confidence = composite.confidence_score || 0.5;
  const rating = composite.rating || 'C';
  const stockPrice = marketData.price || 0;
  const priceTarget = pricePred.price_target || stockPrice;
  const volPrediction = volForecast.prediction || 'STABLE';
  const rsi = features.rsi_14 || 50;
  
  const recommendations = [];
  
  // Enhanced risk parameters based on level and market conditions
  const riskParams = {
    conservative: { 
      maxRiskPct: 0.015, 
      minProbProfit: 0.75, 
      maxLeverage: 1.0,
      minConfidence: 0.65
    },
    moderate: { 
      maxRiskPct: 0.04, 
      minProbProfit: 0.62, 
      maxLeverage: 2.0,
      minConfidence: 0.55
    },
    aggressive: { 
      maxRiskPct: 0.08, 
      minProbProfit: 0.52, 
      maxLeverage: 3.0,
      minConfidence: 0.45
    },
    speculation: { 
      maxRiskPct: 0.15, 
      minProbProfit: 0.42, 
      maxLeverage: 5.0,
      minConfidence: 0.35
    }
  };
  
  const params = riskParams[riskLevel] || riskParams.moderate;
  
  // Enhanced confidence threshold based on market conditions
  let minConfidence = params.minConfidence;
  if (features.volatility > 0.03) minConfidence += 0.1; // Higher threshold in volatile markets
  if (marketContext.vix_impact === 'HIGH') minConfidence += 0.05;
  
  // Only generate recommendations for sufficient confidence
  if (confidence < minConfidence) {
    return [{
      id: `${ticker}_no_rec_${Date.now()}`,
      ticker,
      trade_type: 'hold',
      direction: 'NEUTRAL',
      entry_price: stockPrice,
      position_size: 0,
      confidence_score: confidence,
      ml_rating: rating,
      strategy_description: `Insufficient confidence for trade recommendations. Current ML confidence: ${(confidence * 100).toFixed(1)}%`,
      risk_level: riskLevel,
      reasons: [
        `ML confidence ${(confidence * 100).toFixed(1)}% below ${(minConfidence * 100).toFixed(1)}% threshold`,
        `Market volatility: ${volPrediction}`,
        `Wait for clearer signals`
      ],
      created_at: new Date().toISOString()
    }];
  }
  
  // 1. Enhanced Stock Long/Short Recommendations
  if (direction === 'BULLISH' && confidence >= params.minConfidence) {
    const stopLossDistance = Math.max(0.08, confidence < 0.7 ? 0.15 : 0.12);
    const positionSize = Math.floor((accountSize * params.maxRiskPct) / (stockPrice * stopLossDistance));
    const targetPrice = priceTarget || (stockPrice * (1 + confidence * 0.18));
    const stopLoss = stockPrice * (1 - stopLossDistance);
    
    const maxRisk = positionSize * stockPrice * stopLossDistance;
    const maxReward = positionSize * (targetPrice - stockPrice);
    const riskReward = maxRisk > 0 ? maxReward / maxRisk : 0;
    
    // RSI considerations
    let rsiAdjustment = '';
    if (rsi < 30) rsiAdjustment = ' • RSI oversold - good entry';
    else if (rsi > 70) rsiAdjustment = ' • RSI overbought - monitor closely';
    
    recommendations.push({
      id: `${ticker}_stock_long_${Date.now()}`,
      ticker,
      trade_type: 'stock_long',
      direction: 'BULLISH',
      entry_price: stockPrice,
      target_price: targetPrice,
      stop_loss: stopLoss,
      position_size: positionSize,
      risk_reward_ratio: riskReward,
      probability_of_profit: pricePred.probability || confidence * 0.95,
      max_risk: maxRisk,
      max_reward: maxReward,
      time_horizon: confidence > 0.75 ? '1-3 weeks' : '2-5 weeks',
      confidence_score: confidence,
      ml_rating: rating,
      strategy_description: `Long ${ticker} - ${pricePred.strength || 'MODERATE'} bullish signal with ${(confidence * 100).toFixed(1)}% ML confidence`,
      risk_level: riskLevel,
      reasons: [
        `ML ensemble ${(confidence * 100).toFixed(1)}% bullish probability`,
        `Price target: $${targetPrice.toFixed(2)} (${((targetPrice/stockPrice - 1) * 100).toFixed(1)}% upside)`,
        `Rating: ${rating} • RSI: ${rsi.toFixed(0)}${rsiAdjustment}`,
        `Vol prediction: ${volPrediction} • Market correlation: ${(marketContext.correlation_spy * 100).toFixed(0)}%`
      ],
      technical_levels: {
        support: stopLoss,
        resistance: targetPrice,
        pivot: stockPrice
      },
      created_at: new Date().toISOString()
    });
  }
  
  if (direction === 'BEARISH' && confidence >= params.minConfidence) {
    const stopLossDistance = Math.max(0.08, confidence < 0.7 ? 0.15 : 0.12);
    const positionSize = Math.floor((accountSize * params.maxRiskPct) / (stockPrice * stopLossDistance));
    const targetPrice = priceTarget || (stockPrice * (1 - confidence * 0.14));
    const stopLoss = stockPrice * (1 + stopLossDistance);
    
    const maxRisk = positionSize * stockPrice * stopLossDistance;
    const maxReward = positionSize * (stockPrice - targetPrice);
    const riskReward = maxRisk > 0 ? maxReward / maxRisk : 0;
    
    // RSI considerations for shorts
    let rsiAdjustment = '';
    if (rsi > 70) rsiAdjustment = ' • RSI overbought - good short entry';
    else if (rsi < 30) rsiAdjustment = ' • RSI oversold - risky short';
    
    recommendations.push({
      id: `${ticker}_stock_short_${Date.now()}`,
      ticker,
      trade_type: 'stock_short',
      direction: 'BEARISH',
      entry_price: stockPrice,
      target_price: targetPrice,
      stop_loss: stopLoss,
      position_size: positionSize,
      risk_reward_ratio: riskReward,
      probability_of_profit: pricePred.probability || confidence * 0.92,
      max_risk: maxRisk,
      max_reward: maxReward,
      time_horizon: confidence > 0.75 ? '1-3 weeks' : '2-5 weeks',
      confidence_score: confidence,
      ml_rating: rating,
      strategy_description: `Short ${ticker} - ${pricePred.strength || 'MODERATE'} bearish signal with ${(confidence * 100).toFixed(1)}% ML confidence`,
      risk_level: riskLevel,
      reasons: [
        `ML ensemble ${(confidence * 100).toFixed(1)}% bearish probability`,
        `Price target: $${targetPrice.toFixed(2)} (${((1 - targetPrice/stockPrice) * 100).toFixed(1)}% downside)`,
        `Rating: ${rating} • RSI: ${rsi.toFixed(0)}${rsiAdjustment}`,
        `Short interest: ${(features.short_interest || 0).toFixed(1)}% • Vol: ${volPrediction}`
      ],
      technical_levels: {
        support: targetPrice,
        resistance: stopLoss,
        pivot: stockPrice
      },
      created_at: new Date().toISOString()
    });
  }
  
  // 2. Options Recommendations
  if (confidence > 0.5) {
    const iv = Math.random() * 30 + 20; // 20-50% IV
    const expiryDays = 30;
    
    if (direction === 'BULLISH') {
      const strike = Math.round(stockPrice * 1.02 * 2) / 2; // Slightly OTM call
      const premium = stockPrice * 0.03 + Math.random() * stockPrice * 0.04; // 3-7% of stock price
      const contracts = Math.max(1, Math.floor((accountSize * params.maxRiskPct) / (premium * 100)));
      
      const maxRisk = contracts * premium * 100;
      const maxReward = maxRisk * 3;
      
      recommendations.push({
        id: `${ticker}_call_buy_${Date.now()}`,
        ticker,
        trade_type: 'call_buy',
        direction: 'BULLISH',
        entry_price: premium,
        target_price: premium * 2,
        stop_loss: premium * 0.5,
        position_size: contracts,
        risk_reward_ratio: 3.0,
        probability_of_profit: confidence * 0.8,
        max_risk: maxRisk,
        max_reward: maxReward,
        time_horizon: `${expiryDays} days`,
        confidence_score: confidence * 0.9,
        ml_rating: rating,
        strategy_description: `Buy $${strike} calls based on bullish ML prediction`,
        risk_level: riskLevel,
        reasons: [
          `ML bullish with ${(confidence * 100).toFixed(1)}% confidence`,
          `Strike $${strike.toFixed(2)} offers good risk/reward`,
          `Implied volatility: ${iv.toFixed(1)}%`
        ],
        expiry_date: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        strike_prices: [strike],
        premium: premium,
        implied_volatility: iv,
        created_at: new Date().toISOString()
      });
    }
    
    if (direction === 'BEARISH') {
      const strike = Math.round(stockPrice * 0.98 * 2) / 2; // Slightly OTM put
      const premium = stockPrice * 0.03 + Math.random() * stockPrice * 0.04;
      const contracts = Math.max(1, Math.floor((accountSize * params.maxRiskPct) / (premium * 100)));
      
      const maxRisk = contracts * premium * 100;
      const maxReward = maxRisk * 3;
      
      recommendations.push({
        id: `${ticker}_put_buy_${Date.now()}`,
        ticker,
        trade_type: 'put_buy',
        direction: 'BEARISH',
        entry_price: premium,
        target_price: premium * 2,
        stop_loss: premium * 0.5,
        position_size: contracts,
        risk_reward_ratio: 3.0,
        probability_of_profit: confidence * 0.8,
        max_risk: maxRisk,
        max_reward: maxReward,
        time_horizon: `${expiryDays} days`,
        confidence_score: confidence * 0.9,
        ml_rating: rating,
        strategy_description: `Buy $${strike} puts based on bearish ML prediction`,
        risk_level: riskLevel,
        reasons: [
          `ML bearish with ${(confidence * 100).toFixed(1)}% confidence`,
          `Strike $${strike.toFixed(2)} offers good risk/reward`,
          `Implied volatility: ${iv.toFixed(1)}%`
        ],
        expiry_date: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        strike_prices: [strike],
        premium: premium,
        implied_volatility: iv,
        created_at: new Date().toISOString()
      });
    }
  }
  
  // 3. ADVANCED TRADING STRATEGIES (15+ Strategies)
  
  // Strategy 3: Long Straddle (Volatility Expansion)
  if (volForecast.prediction === 'EXPANSION' && confidence > 0.6) {
    const atmStrike = Math.round(stockPrice);
    const totalPremium = stockPrice * 0.06 + Math.random() * stockPrice * 0.04;
    const contracts = Math.max(1, Math.floor((accountSize * 0.03) / (totalPremium * 100)));
    
    recommendations.push({
      id: `${ticker}_straddle_${Date.now()}`,
      ticker, trade_type: 'long_straddle', direction: 'NEUTRAL',
      entry_price: totalPremium, target_price: totalPremium * 1.5, stop_loss: totalPremium * 0.6,
      position_size: contracts, risk_reward_ratio: 2.0, probability_of_profit: 0.65,
      max_risk: contracts * totalPremium * 100, max_reward: contracts * totalPremium * 300,
      time_horizon: '21 days', confidence_score: confidence * 0.8, ml_rating: rating,
      strategy_description: `Long straddle to profit from ML-predicted volatility expansion`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [atmStrike, atmStrike], premium: totalPremium,
      reasons: [`ML predicts volatility expansion with ${(confidence * 100).toFixed(1)}% confidence`, `ATM straddle at $${atmStrike}`, 'Benefits from movement in either direction'],
      created_at: new Date().toISOString()
    });
  }

  // Strategy 4: Short Strangle (High IV Crush)
  if (features.implied_volatility > 40 && confidence > 0.55) {
    const otmCallStrike = Math.round(stockPrice * 1.05);
    const otmPutStrike = Math.round(stockPrice * 0.95);
    const totalCredit = stockPrice * 0.03 + Math.random() * stockPrice * 0.02;
    const contracts = Math.max(1, Math.floor((accountSize * 0.02) / (stockPrice * 100)));
    
    recommendations.push({
      id: `${ticker}_short_strangle_${Date.now()}`,
      ticker, trade_type: 'short_strangle', direction: 'NEUTRAL',
      entry_price: -totalCredit, target_price: -totalCredit * 0.5, stop_loss: -totalCredit * 2,
      position_size: contracts, risk_reward_ratio: 2.0, probability_of_profit: 0.68,
      max_risk: contracts * stockPrice * 10, max_reward: contracts * totalCredit * 100,
      time_horizon: '30 days', confidence_score: confidence * 0.75, ml_rating: rating,
      strategy_description: `Short strangle to profit from high IV crush and sideways movement`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [otmCallStrike, otmPutStrike], premium: totalCredit,
      reasons: [`High IV ${features.implied_volatility.toFixed(1)}% suggests overpriced options`, `Profit zone: $${otmPutStrike}-$${otmCallStrike}`, 'Time decay advantage'],
      created_at: new Date().toISOString()
    });
  }

  // Strategy 5: Iron Condor (Range-Bound Market)
  if (volForecast.prediction === 'STABLE' && confidence > 0.65) {
    const strikes = {
      longPut: Math.round(stockPrice * 0.92),
      shortPut: Math.round(stockPrice * 0.96),
      shortCall: Math.round(stockPrice * 1.04),
      longCall: Math.round(stockPrice * 1.08)
    };
    const netCredit = stockPrice * 0.015 + Math.random() * stockPrice * 0.01;
    const contracts = Math.max(1, Math.floor((accountSize * 0.04) / (400 * contracts || 1)));
    
    recommendations.push({
      id: `${ticker}_iron_condor_${Date.now()}`,
      ticker, trade_type: 'iron_condor', direction: 'NEUTRAL',
      entry_price: -netCredit, target_price: -netCredit * 0.3, stop_loss: -netCredit * 3,
      position_size: contracts, risk_reward_ratio: 1.5, probability_of_profit: 0.72,
      max_risk: contracts * 400, max_reward: contracts * netCredit * 100,
      time_horizon: '35 days', confidence_score: confidence * 0.8, ml_rating: rating,
      strategy_description: `Iron condor to profit from range-bound price action and theta decay`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [strikes.longPut, strikes.shortPut, strikes.shortCall, strikes.longCall],
      premium: netCredit,
      reasons: [`ML predicts stable price action`, `Profit zone: $${strikes.shortPut}-$${strikes.shortCall}`, 'Multiple income sources'],
      created_at: new Date().toISOString()
    });
  }

  // Strategy 6: Bull Call Spread (Moderate Bullish)
  if (direction === 'BULLISH' && confidence >= 0.6 && confidence <= 0.8) {
    const atmStrike = Math.round(stockPrice);
    const otmStrike = Math.round(stockPrice * 1.05);
    const netDebit = stockPrice * 0.025 + Math.random() * stockPrice * 0.015;
    const contracts = Math.max(1, Math.floor((accountSize * params.maxRiskPct) / (netDebit * 100)));
    
    recommendations.push({
      id: `${ticker}_bull_call_spread_${Date.now()}`,
      ticker, trade_type: 'bull_call_spread', direction: 'BULLISH',
      entry_price: netDebit, target_price: (otmStrike - atmStrike) * 0.7, stop_loss: netDebit * 0.5,
      position_size: contracts, risk_reward_ratio: 2.5, probability_of_profit: pricePred.probability * 0.85 || 0.65,
      max_risk: contracts * netDebit * 100, max_reward: contracts * (otmStrike - atmStrike - netDebit) * 100,
      time_horizon: '25 days', confidence_score: confidence * 0.85, ml_rating: rating,
      strategy_description: `Bull call spread for moderate upside with limited risk`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [atmStrike, otmStrike], premium: netDebit,
      reasons: [`Moderate bullish outlook with ${(confidence * 100).toFixed(1)}% confidence`, `Max profit at $${otmStrike}`, 'Lower cost than long calls'],
      created_at: new Date().toISOString()
    });
  }

  // Strategy 7: Bear Put Spread (Moderate Bearish)
  if (direction === 'BEARISH' && confidence >= 0.6 && confidence <= 0.8) {
    const atmStrike = Math.round(stockPrice);
    const otmStrike = Math.round(stockPrice * 0.95);
    const netDebit = stockPrice * 0.025 + Math.random() * stockPrice * 0.015;
    const contracts = Math.max(1, Math.floor((accountSize * params.maxRiskPct) / (netDebit * 100)));
    
    recommendations.push({
      id: `${ticker}_bear_put_spread_${Date.now()}`,
      ticker, trade_type: 'bear_put_spread', direction: 'BEARISH',
      entry_price: netDebit, target_price: (atmStrike - otmStrike) * 0.7, stop_loss: netDebit * 0.5,
      position_size: contracts, risk_reward_ratio: 2.5, probability_of_profit: pricePred.probability * 0.85 || 0.65,
      max_risk: contracts * netDebit * 100, max_reward: contracts * (atmStrike - otmStrike - netDebit) * 100,
      time_horizon: '25 days', confidence_score: confidence * 0.85, ml_rating: rating,
      strategy_description: `Bear put spread for moderate downside with limited risk`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [atmStrike, otmStrike], premium: netDebit,
      reasons: [`Moderate bearish outlook with ${(confidence * 100).toFixed(1)}% confidence`, `Max profit at $${otmStrike}`, 'Lower cost than long puts'],
      created_at: new Date().toISOString()
    });
  }

  // Strategy 8: Calendar Spread (Time Decay Play)
  if (volForecast.prediction === 'STABLE' && features.implied_volatility < 35) {
    const atmStrike = Math.round(stockPrice);
    const netDebit = stockPrice * 0.02 + Math.random() * stockPrice * 0.01;
    const contracts = Math.max(1, Math.floor((accountSize * 0.03) / (netDebit * 100)));
    
    recommendations.push({
      id: `${ticker}_calendar_spread_${Date.now()}`,
      ticker, trade_type: 'calendar_spread', direction: 'NEUTRAL',
      entry_price: netDebit, target_price: netDebit * 1.8, stop_loss: netDebit * 0.6,
      position_size: contracts, risk_reward_ratio: 1.8, probability_of_profit: 0.58,
      max_risk: contracts * netDebit * 100, max_reward: contracts * netDebit * 180,
      time_horizon: '30 days', confidence_score: confidence * 0.7, ml_rating: rating,
      strategy_description: `Calendar spread to profit from time decay and low volatility`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [atmStrike, atmStrike], premium: netDebit,
      reasons: [`Low IV environment favorable for calendar spreads`, `Time decay advantage`, `Profit maximized near $${atmStrike}`],
      created_at: new Date().toISOString()
    });
  }

  // Strategy 9: Butterfly Spread (Pinpoint Prediction)
  if (Math.abs(stockPrice - Math.round(stockPrice)) < 0.5 && confidence > 0.75) {
    const centerStrike = Math.round(stockPrice);
    const wingSpread = Math.max(2.5, stockPrice * 0.025);
    const lowerStrike = centerStrike - wingSpread;
    const upperStrike = centerStrike + wingSpread;
    const netDebit = stockPrice * 0.015 + Math.random() * stockPrice * 0.01;
    const contracts = Math.max(1, Math.floor((accountSize * 0.025) / (netDebit * 100)));
    
    recommendations.push({
      id: `${ticker}_butterfly_${Date.now()}`,
      ticker, trade_type: 'butterfly_spread', direction: 'NEUTRAL',
      entry_price: netDebit, target_price: wingSpread - netDebit, stop_loss: netDebit * 0.5,
      position_size: contracts, risk_reward_ratio: 4.0, probability_of_profit: 0.45,
      max_risk: contracts * netDebit * 100, max_reward: contracts * (wingSpread - netDebit) * 100,
      time_horizon: '21 days', confidence_score: confidence * 0.9, ml_rating: rating,
      strategy_description: `Butterfly spread for high-precision price target at $${centerStrike}`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [lowerStrike, centerStrike, centerStrike, upperStrike], premium: netDebit,
      reasons: [`High confidence price target at $${centerStrike}`, `Excellent risk/reward of 4:1`, 'Limited risk with high reward potential'],
      created_at: new Date().toISOString()
    });
  }

  // Strategy 10: Covered Call (Income Generation)
  if (direction === 'NEUTRAL' || (direction === 'BULLISH' && confidence < 0.6)) {
    const otmStrike = Math.round(stockPrice * 1.05);
    const callPremium = stockPrice * 0.015 + Math.random() * stockPrice * 0.01;
    const shareSize = Math.floor((accountSize * 0.6) / stockPrice / 100) * 100; // Round lots
    
    if (shareSize >= 100) {
      recommendations.push({
        id: `${ticker}_covered_call_${Date.now()}`,
        ticker, trade_type: 'covered_call', direction: 'NEUTRAL',
        entry_price: stockPrice - callPremium, target_price: otmStrike, stop_loss: stockPrice * 0.93,
        position_size: shareSize / 100, risk_reward_ratio: 1.2, probability_of_profit: 0.75,
        max_risk: shareSize * stockPrice * 0.07, max_reward: shareSize * (otmStrike - stockPrice + callPremium),
        time_horizon: '30 days', confidence_score: confidence * 0.8, ml_rating: rating,
        strategy_description: `Covered call for income generation on existing/new stock position`,
        risk_level: riskLevel, expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        strike_prices: [otmStrike], premium: callPremium, stock_shares: shareSize,
        reasons: [`Generate ${((callPremium/stockPrice)*100).toFixed(2)}% monthly income`, `Upside capture to $${otmStrike}`, 'Lower volatility strategy'],
        created_at: new Date().toISOString()
      });
    }
  }

  // Strategy 11: Cash-Secured Put (Income + Entry)
  if (direction === 'BULLISH' && confidence < 0.7 && rsi < 60) {
    const otmStrike = Math.round(stockPrice * 0.95);
    const putPremium = stockPrice * 0.015 + Math.random() * stockPrice * 0.01;
    const contracts = Math.floor((accountSize * 0.3) / (otmStrike * 100));
    
    if (contracts >= 1) {
      recommendations.push({
        id: `${ticker}_cash_secured_put_${Date.now()}`,
        ticker, trade_type: 'cash_secured_put', direction: 'BULLISH',
        entry_price: -putPremium, target_price: -putPremium * 0.5, stop_loss: otmStrike,
        position_size: contracts, risk_reward_ratio: 1.0, probability_of_profit: 0.78,
        max_risk: contracts * otmStrike * 100, max_reward: contracts * putPremium * 100,
        time_horizon: '30 days', confidence_score: confidence * 0.75, ml_rating: rating,
        strategy_description: `Cash-secured put for income while waiting to buy at lower price`,
        risk_level: riskLevel, expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        strike_prices: [otmStrike], premium: putPremium,
        reasons: [`Collect ${((putPremium/stockPrice)*100).toFixed(2)}% premium`, `Buy ${ticker} at discount if assigned`, 'Win-win strategy'],
        created_at: new Date().toISOString()
      });
    }
  }

  // Strategy 12: Protective Put (Downside Protection)
  if (direction === 'BULLISH' && marketContext.vix_impact === 'HIGH') {
    const otmStrike = Math.round(stockPrice * 0.92);
    const putPremium = stockPrice * 0.02 + Math.random() * stockPrice * 0.015;
    const shareSize = Math.floor((accountSize * 0.7) / stockPrice / 100) * 100;
    
    if (shareSize >= 100) {
      recommendations.push({
        id: `${ticker}_protective_put_${Date.now()}`,
        ticker, trade_type: 'protective_put', direction: 'BULLISH',
        entry_price: stockPrice + putPremium, target_price: priceTarget || stockPrice * 1.1, stop_loss: otmStrike,
        position_size: shareSize / 100, risk_reward_ratio: 2.5, probability_of_profit: pricePred.probability * 0.9 || 0.65,
        max_risk: shareSize * (stockPrice - otmStrike + putPremium), max_reward: shareSize * ((priceTarget || stockPrice * 1.1) - stockPrice - putPremium),
        time_horizon: '45 days', confidence_score: confidence * 0.85, ml_rating: rating,
        strategy_description: `Long stock with protective put for bullish play with downside protection`,
        risk_level: riskLevel, expiry_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        strike_prices: [otmStrike], premium: putPremium, stock_shares: shareSize,
        reasons: [`Bullish outlook with ${(confidence * 100).toFixed(1)}% confidence`, `Downside protection at $${otmStrike}`, 'High VIX environment warrants protection'],
        created_at: new Date().toISOString()
      });
    }
  }

  // Strategy 13: Ratio Spread (High Confidence Directional)
  if ((direction === 'BULLISH' || direction === 'BEARISH') && confidence > 0.8) {
    const isCall = direction === 'BULLISH';
    const atmStrike = Math.round(stockPrice);
    const otmStrike = Math.round(stockPrice * (isCall ? 1.05 : 0.95));
    const netCredit = stockPrice * 0.01 + Math.random() * stockPrice * 0.005;
    const contracts = Math.max(1, Math.floor((accountSize * 0.04) / (stockPrice * 50)));
    
    recommendations.push({
      id: `${ticker}_ratio_spread_${Date.now()}`,
      ticker, trade_type: `${isCall ? 'call' : 'put'}_ratio_spread`, direction,
      entry_price: -netCredit, target_price: isCall ? otmStrike - atmStrike : atmStrike - otmStrike, stop_loss: (isCall ? otmStrike - atmStrike : atmStrike - otmStrike) * 1.5,
      position_size: contracts, risk_reward_ratio: 3.0, probability_of_profit: 0.72,
      max_risk: contracts * (isCall ? otmStrike - atmStrike : atmStrike - otmStrike) * 150, max_reward: contracts * netCredit * 100,
      time_horizon: '21 days', confidence_score: confidence * 0.9, ml_rating: rating,
      strategy_description: `${isCall ? 'Call' : 'Put'} ratio spread for high-confidence ${direction.toLowerCase()} move`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [atmStrike, otmStrike, otmStrike], premium: netCredit,
      reasons: [`High ${(confidence * 100).toFixed(1)}% confidence in ${direction.toLowerCase()} move`, `Profit from moderate moves`, 'Income generation strategy'],
      created_at: new Date().toISOString()
    });
  }

  // Strategy 14: Synthetic Long/Short (Leverage Play)
  if ((direction === 'BULLISH' || direction === 'BEARISH') && confidence > 0.7 && riskLevel === 'aggressive') {
    const isLong = direction === 'BULLISH';
    const atmStrike = Math.round(stockPrice);
    const syntheticCost = stockPrice * 0.03 + Math.random() * stockPrice * 0.02;
    const contracts = Math.max(1, Math.floor((accountSize * params.maxRiskPct) / (syntheticCost * 100)));
    
    recommendations.push({
      id: `${ticker}_synthetic_${isLong ? 'long' : 'short'}_${Date.now()}`,
      ticker, trade_type: `synthetic_${isLong ? 'long' : 'short'}`, direction,
      entry_price: isLong ? syntheticCost : -syntheticCost, 
      target_price: isLong ? syntheticCost + (priceTarget - stockPrice) : syntheticCost - (stockPrice - priceTarget),
      stop_loss: isLong ? syntheticCost - (stockPrice * 0.08) : syntheticCost + (stockPrice * 0.08),
      position_size: contracts, risk_reward_ratio: 3.5, probability_of_profit: pricePred.probability * 0.85 || 0.7,
      max_risk: contracts * syntheticCost * 100, max_reward: contracts * Math.abs(priceTarget - stockPrice) * 100,
      time_horizon: '30 days', confidence_score: confidence * 0.9, ml_rating: rating,
      strategy_description: `Synthetic ${isLong ? 'long' : 'short'} for leveraged ${direction.toLowerCase()} exposure`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [atmStrike, atmStrike], premium: syntheticCost,
      reasons: [`High-leverage ${direction.toLowerCase()} play`, `${(confidence * 100).toFixed(1)}% ML confidence`, 'Capital efficient strategy'],
      created_at: new Date().toISOString()
    });
  }

  // Strategy 15: Jade Lizard (High IV + Neutral/Bullish)
  if (features.implied_volatility > 45 && (direction === 'NEUTRAL' || direction === 'BULLISH') && confidence > 0.6) {
    const callStrike = Math.round(stockPrice * 1.05);
    const putStrike = Math.round(stockPrice * 0.92);
    const netCredit = stockPrice * 0.04 + Math.random() * stockPrice * 0.02;
    const contracts = Math.max(1, Math.floor((accountSize * 0.05) / (1000)));
    
    recommendations.push({
      id: `${ticker}_jade_lizard_${Date.now()}`,
      ticker, trade_type: 'jade_lizard', direction: 'NEUTRAL',
      entry_price: -netCredit, target_price: -netCredit * 0.5, stop_loss: -netCredit * 2,
      position_size: contracts, risk_reward_ratio: 1.5, probability_of_profit: 0.75,
      max_risk: contracts * (callStrike * 2 - stockPrice) * 100, max_reward: contracts * netCredit * 100,
      time_horizon: '35 days', confidence_score: confidence * 0.8, ml_rating: rating,
      strategy_description: `Jade lizard for high IV crush with unlimited upside profit potential`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [putStrike, callStrike, callStrike], premium: netCredit,
      reasons: [`Extremely high IV ${features.implied_volatility.toFixed(1)}%`, `Unlimited profit above $${callStrike}`, 'Complex strategy for experienced traders'],
      created_at: new Date().toISOString()
    });
  }

  // Strategy 16: Broken Wing Butterfly (Directional Bias)
  if (confidence > 0.65 && (direction === 'BULLISH' || direction === 'BEARISH')) {
    const isBullish = direction === 'BULLISH';
    const centerStrike = Math.round(stockPrice);
    const nearStrike = Math.round(stockPrice * (isBullish ? 0.98 : 1.02));
    const farStrike = Math.round(stockPrice * (isBullish ? 1.08 : 0.92));
    const netDebit = stockPrice * 0.02 + Math.random() * stockPrice * 0.01;
    const contracts = Math.max(1, Math.floor((accountSize * 0.03) / (netDebit * 100)));
    
    recommendations.push({
      id: `${ticker}_broken_wing_butterfly_${Date.now()}`,
      ticker, trade_type: 'broken_wing_butterfly', direction,
      entry_price: netDebit, target_price: Math.abs(farStrike - centerStrike) * 0.8, stop_loss: netDebit * 0.5,
      position_size: contracts, risk_reward_ratio: 6.0, probability_of_profit: 0.55,
      max_risk: contracts * netDebit * 100, max_reward: contracts * Math.abs(farStrike - centerStrike) * 100,
      time_horizon: '28 days', confidence_score: confidence * 0.85, ml_rating: rating,
      strategy_description: `Broken wing butterfly with ${direction.toLowerCase()} bias and excellent risk/reward`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [nearStrike, centerStrike, centerStrike, farStrike], premium: netDebit,
      reasons: [`${direction} bias with ${(confidence * 100).toFixed(1)}% confidence`, `Exceptional 6:1 risk/reward`, 'Advanced asymmetric risk profile'],
      created_at: new Date().toISOString()
    });
  }

  // Strategy 17: Poor Man's Covered Call (Capital Efficient)
  if (direction === 'BULLISH' && confidence >= 0.6 && riskLevel !== 'conservative') {
    const longCallStrike = Math.round(stockPrice * 0.95); // Deep ITM
    const shortCallStrike = Math.round(stockPrice * 1.05); // OTM
    const longCallCost = stockPrice * 0.08 + Math.random() * stockPrice * 0.03;
    const shortCallCredit = stockPrice * 0.02 + Math.random() * stockPrice * 0.01;
    const netDebit = longCallCost - shortCallCredit;
    const contracts = Math.max(1, Math.floor((accountSize * params.maxRiskPct) / (netDebit * 100)));
    
    recommendations.push({
      id: `${ticker}_pmcc_${Date.now()}`,
      ticker, trade_type: 'poor_mans_covered_call', direction: 'BULLISH',
      entry_price: netDebit, target_price: shortCallStrike - longCallStrike - netDebit, stop_loss: netDebit * 0.6,
      position_size: contracts, risk_reward_ratio: 2.0, probability_of_profit: pricePred.probability * 0.8 || 0.65,
      max_risk: contracts * netDebit * 100, max_reward: contracts * (shortCallStrike - longCallStrike - netDebit) * 100,
      time_horizon: '45 days', confidence_score: confidence * 0.8, ml_rating: rating,
      strategy_description: `Poor man's covered call for bullish exposure with less capital`,
      risk_level: riskLevel, expiry_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [longCallStrike, shortCallStrike], premium: netDebit,
      reasons: [`Capital-efficient bullish strategy`, `${((shortCallCredit/netDebit)*100).toFixed(1)}% monthly income potential`, 'Less capital than 100 shares'],
      created_at: new Date().toISOString()
    });
  }
  
  // Sort by confidence score
  recommendations.sort((a, b) => b.confidence_score - a.confidence_score);
  
  return recommendations.slice(0, 5); // Return top 5 recommendations
}