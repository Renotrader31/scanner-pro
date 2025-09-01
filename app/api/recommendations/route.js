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
  
  // 3. Volatility Strategies
  if (volForecast.prediction === 'EXPANSION' && confidence > 0.6) {
    const atmStrike = Math.round(stockPrice);
    const totalPremium = stockPrice * 0.06 + Math.random() * stockPrice * 0.04; // 6-10% for straddle
    const contracts = Math.max(1, Math.floor((accountSize * 0.03) / (totalPremium * 100))); // 3% of account
    
    const maxRisk = contracts * totalPremium * 100;
    const maxReward = maxRisk * 2;
    
    recommendations.push({
      id: `${ticker}_straddle_${Date.now()}`,
      ticker,
      trade_type: 'straddle',
      direction: 'NEUTRAL',
      entry_price: totalPremium,
      target_price: totalPremium * 1.5,
      stop_loss: totalPremium * 0.6,
      position_size: contracts,
      risk_reward_ratio: 2.0,
      probability_of_profit: 0.65,
      max_risk: maxRisk,
      max_reward: maxReward,
      time_horizon: '21 days',
      confidence_score: confidence * 0.8,
      ml_rating: rating,
      strategy_description: `Long straddle to profit from ML-predicted volatility expansion`,
      risk_level: riskLevel,
      reasons: [
        `ML predicts volatility expansion with ${(confidence * 100).toFixed(1)}% confidence`,
        `ATM straddle at $${atmStrike}`,
        'Benefits from movement in either direction'
      ],
      expiry_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike_prices: [atmStrike, atmStrike],
      premium: totalPremium,
      created_at: new Date().toISOString()
    });
  }
  
  // Sort by confidence score
  recommendations.sort((a, b) => b.confidence_score - a.confidence_score);
  
  return recommendations.slice(0, 5); // Return top 5 recommendations
}