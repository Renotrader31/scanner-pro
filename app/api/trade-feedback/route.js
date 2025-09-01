import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

// Trade feedback database (in production, use proper database)
const FEEDBACK_DIR = path.join(process.cwd(), 'data', 'trade-feedback');
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, 'trade-results.json');
const ML_METRICS_FILE = path.join(FEEDBACK_DIR, 'ml-metrics.json');

// Ensure feedback directory exists
const ensureFeedbackDir = async () => {
  try {
    await fs.mkdir(FEEDBACK_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
};

// Load existing feedback data
const loadFeedbackData = async () => {
  try {
    await ensureFeedbackDir();
    const data = await fs.readFile(FEEDBACK_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { trades: [], lastUpdate: Date.now() };
  }
};

// Save feedback data
const saveFeedbackData = async (data) => {
  await ensureFeedbackDir();
  await fs.writeFile(FEEDBACK_FILE, JSON.stringify(data, null, 2));
};

// Load ML metrics
const loadMLMetrics = async () => {
  try {
    const data = await fs.readFile(ML_METRICS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      totalTrades: 0,
      winRate: 0,
      avgConfidenceAccuracy: 0,
      modelPerformance: {
        price_prediction: { accuracy: 0.5, totalPredictions: 0 },
        volatility_forecast: { accuracy: 0.5, totalPredictions: 0 },
        options_flow: { accuracy: 0.5, totalPredictions: 0 }
      },
      strategyPerformance: {},
      tickerPerformance: {},
      timeBasedPerformance: {},
      lastUpdated: Date.now()
    };
  }
};

// Save ML metrics
const saveMLMetrics = async (metrics) => {
  await fs.writeFile(ML_METRICS_FILE, JSON.stringify(metrics, null, 2));
};

// Calculate trade outcome based on entry and current/exit prices
const calculateTradeOutcome = (trade, currentPrice) => {
  const entryPrice = trade.entry_price;
  const direction = trade.direction?.toLowerCase();
  
  if (!currentPrice || !entryPrice) return null;
  
  let outcome = {
    pnl: 0,
    pnlPercent: 0,
    outcome: 'UNKNOWN',
    daysHeld: Math.floor((Date.now() - new Date(trade.entry_date).getTime()) / (1000 * 60 * 60 * 24))
  };
  
  if (trade.trade_type === 'stock_long') {
    outcome.pnl = (currentPrice - entryPrice) * trade.position_size;
    outcome.pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
  } else if (trade.trade_type === 'stock_short') {
    outcome.pnl = (entryPrice - currentPrice) * trade.position_size;
    outcome.pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
  } else if (trade.trade_type.includes('call')) {
    // Simplified options P&L (in reality would need Black-Scholes)
    const intrinsicValue = Math.max(0, currentPrice - (trade.strike_price || entryPrice));
    const estimatedPremium = intrinsicValue + (trade.time_decay_factor || 0.5);
    outcome.pnl = (estimatedPremium - entryPrice) * trade.position_size * 100;
    outcome.pnlPercent = ((estimatedPremium - entryPrice) / entryPrice) * 100;
  } else if (trade.trade_type.includes('put')) {
    const intrinsicValue = Math.max(0, (trade.strike_price || entryPrice) - currentPrice);
    const estimatedPremium = intrinsicValue + (trade.time_decay_factor || 0.5);
    outcome.pnl = (estimatedPremium - entryPrice) * trade.position_size * 100;
    outcome.pnlPercent = ((estimatedPremium - entryPrice) / entryPrice) * 100;
  }
  
  // Determine outcome status
  if (outcome.pnlPercent > 10) outcome.outcome = 'BIG_WIN';
  else if (outcome.pnlPercent > 2) outcome.outcome = 'WIN';
  else if (outcome.pnlPercent > -2) outcome.outcome = 'BREAKEVEN';
  else if (outcome.pnlPercent > -10) outcome.outcome = 'LOSS';
  else outcome.outcome = 'BIG_LOSS';
  
  // Check if targets hit
  if (trade.target_price && 
      ((direction === 'bullish' && currentPrice >= trade.target_price) ||
       (direction === 'bearish' && currentPrice <= trade.target_price))) {
    outcome.targetHit = true;
  }
  
  if (trade.stop_loss &&
      ((direction === 'bullish' && currentPrice <= trade.stop_loss) ||
       (direction === 'bearish' && currentPrice >= trade.stop_loss))) {
    outcome.stopHit = true;
  }
  
  return outcome;
};

// Update ML model performance based on feedback
const updateMLPerformance = async (trade, outcome) => {
  const metrics = await loadMLMetrics();
  
  // Update overall metrics
  metrics.totalTrades++;
  
  // Calculate win rate
  const isWin = outcome.outcome === 'WIN' || outcome.outcome === 'BIG_WIN';
  const currentWins = Math.floor(metrics.winRate * (metrics.totalTrades - 1) / 100);
  metrics.winRate = ((currentWins + (isWin ? 1 : 0)) / metrics.totalTrades) * 100;
  
  // Update confidence accuracy
  const confidenceAccuracy = trade.ml_confidence_score || 0.5;
  const actualAccuracy = isWin ? 1 : 0;
  const confidenceError = Math.abs(confidenceAccuracy - actualAccuracy);
  
  const currentConfidenceSum = metrics.avgConfidenceAccuracy * (metrics.totalTrades - 1);
  metrics.avgConfidenceAccuracy = (currentConfidenceSum + (1 - confidenceError)) / metrics.totalTrades;
  
  // Update model-specific performance
  if (trade.ml_predictions) {
    Object.keys(trade.ml_predictions).forEach(modelType => {
      if (!metrics.modelPerformance[modelType]) {
        metrics.modelPerformance[modelType] = { accuracy: 0.5, totalPredictions: 0 };
      }
      
      const model = metrics.modelPerformance[modelType];
      model.totalPredictions++;
      
      const currentAccuracySum = model.accuracy * (model.totalPredictions - 1);
      model.accuracy = (currentAccuracySum + actualAccuracy) / model.totalPredictions;
    });
  }
  
  // Update strategy performance
  const strategy = trade.trade_type;
  if (!metrics.strategyPerformance[strategy]) {
    metrics.strategyPerformance[strategy] = {
      totalTrades: 0,
      winRate: 0,
      avgReturn: 0,
      avgConfidence: 0
    };
  }
  
  const stratPerf = metrics.strategyPerformance[strategy];
  stratPerf.totalTrades++;
  
  const stratCurrentWins = Math.floor(stratPerf.winRate * (stratPerf.totalTrades - 1) / 100);
  stratPerf.winRate = ((stratCurrentWins + (isWin ? 1 : 0)) / stratPerf.totalTrades) * 100;
  
  const stratCurrentReturnSum = stratPerf.avgReturn * (stratPerf.totalTrades - 1);
  stratPerf.avgReturn = (stratCurrentReturnSum + outcome.pnlPercent) / stratPerf.totalTrades;
  
  const stratCurrentConfidenceSum = stratPerf.avgConfidence * (stratPerf.totalTrades - 1);
  stratPerf.avgConfidence = (stratCurrentConfidenceSum + confidenceAccuracy) / stratPerf.totalTrades;
  
  // Update ticker performance
  const ticker = trade.ticker;
  if (!metrics.tickerPerformance[ticker]) {
    metrics.tickerPerformance[ticker] = {
      totalTrades: 0,
      winRate: 0,
      avgReturn: 0,
      lastTrade: Date.now()
    };
  }
  
  const tickerPerf = metrics.tickerPerformance[ticker];
  tickerPerf.totalTrades++;
  tickerPerf.lastTrade = Date.now();
  
  const tickerCurrentWins = Math.floor(tickerPerf.winRate * (tickerPerf.totalTrades - 1) / 100);
  tickerPerf.winRate = ((tickerCurrentWins + (isWin ? 1 : 0)) / tickerPerf.totalTrades) * 100;
  
  const tickerCurrentReturnSum = tickerPerf.avgReturn * (tickerPerf.totalTrades - 1);
  tickerPerf.avgReturn = (tickerCurrentReturnSum + outcome.pnlPercent) / tickerPerf.totalTrades;
  
  // Update time-based performance (by hour of day)
  const hour = new Date(trade.entry_date).getHours();
  if (!metrics.timeBasedPerformance[hour]) {
    metrics.timeBasedPerformance[hour] = {
      totalTrades: 0,
      winRate: 0,
      avgReturn: 0
    };
  }
  
  const timePerf = metrics.timeBasedPerformance[hour];
  timePerf.totalTrades++;
  
  const timeCurrentWins = Math.floor(timePerf.winRate * (timePerf.totalTrades - 1) / 100);
  timePerf.winRate = ((timeCurrentWins + (isWin ? 1 : 0)) / timePerf.totalTrades) * 100;
  
  const timeCurrentReturnSum = timePerf.avgReturn * (timePerf.totalTrades - 1);
  timePerf.avgReturn = (timeCurrentReturnSum + outcome.pnlPercent) / timePerf.totalTrades;
  
  metrics.lastUpdated = Date.now();
  
  await saveMLMetrics(metrics);
  return metrics;
};

// Generate improved recommendations based on feedback
const generateImprovedRecommendations = async (ticker, baseRecommendations) => {
  const metrics = await loadMLMetrics();
  
  // Adjust confidence based on historical performance
  const adjustedRecommendations = baseRecommendations.map(rec => {
    let confidenceAdjustment = 0;
    
    // Adjust based on strategy performance
    const stratPerf = metrics.strategyPerformance[rec.trade_type];
    if (stratPerf && stratPerf.totalTrades >= 5) {
      const strategyMultiplier = (stratPerf.winRate / 50) - 1; // -1 to +1 range
      confidenceAdjustment += strategyMultiplier * 0.1;
    }
    
    // Adjust based on ticker performance
    const tickerPerf = metrics.tickerPerformance[ticker];
    if (tickerPerf && tickerPerf.totalTrades >= 3) {
      const tickerMultiplier = (tickerPerf.winRate / 50) - 1;
      confidenceAdjustment += tickerMultiplier * 0.15;
    }
    
    // Adjust based on time of day
    const currentHour = new Date().getHours();
    const timePerf = metrics.timeBasedPerformance[currentHour];
    if (timePerf && timePerf.totalTrades >= 10) {
      const timeMultiplier = (timePerf.winRate / 50) - 1;
      confidenceAdjustment += timeMultiplier * 0.05;
    }
    
    // Apply adjustments
    const adjustedConfidence = Math.max(0.1, Math.min(0.95, rec.confidence_score + confidenceAdjustment));
    const adjustedProbability = Math.max(0.3, Math.min(0.9, rec.probability_of_profit + confidenceAdjustment));
    
    return {
      ...rec,
      confidence_score: adjustedConfidence,
      probability_of_profit: adjustedProbability,
      ml_confidence_adjustment: confidenceAdjustment,
      historical_performance: {
        strategy: stratPerf,
        ticker: tickerPerf,
        timeOfDay: timePerf
      }
    };
  });
  
  return adjustedRecommendations;
};

export async function POST(request) {
  try {
    const { action, ...data } = await request.json();
    
    if (action === 'submit_trade') {
      // User executed a trade based on our recommendation
      const trade = {
        ...data,
        trade_id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entry_date: new Date().toISOString(),
        status: 'ACTIVE',
        source: 'AI_RECOMMENDATION'
      };
      
      const feedbackData = await loadFeedbackData();
      feedbackData.trades.push(trade);
      feedbackData.lastUpdate = Date.now();
      
      await saveFeedbackData(feedbackData);
      
      return NextResponse.json({
        success: true,
        message: 'Trade feedback recorded',
        trade_id: trade.trade_id,
        total_trades: feedbackData.trades.length
      });
    }
    
    if (action === 'update_trade') {
      // Update existing trade with current market data
      const { trade_id, current_price, exit_price, status } = data;
      
      const feedbackData = await loadFeedbackData();
      const tradeIndex = feedbackData.trades.findIndex(t => t.trade_id === trade_id);
      
      if (tradeIndex === -1) {
        return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
      }
      
      const trade = feedbackData.trades[tradeIndex];
      
      // Calculate outcome
      const priceForCalculation = exit_price || current_price;
      const outcome = calculateTradeOutcome(trade, priceForCalculation);
      
      // Update trade
      trade.current_price = current_price;
      if (exit_price) trade.exit_price = exit_price;
      if (status) trade.status = status;
      if (outcome) trade.outcome = outcome;
      trade.last_updated = new Date().toISOString();
      
      feedbackData.trades[tradeIndex] = trade;
      feedbackData.lastUpdate = Date.now();
      
      await saveFeedbackData(feedbackData);
      
      // Update ML performance if trade is closed
      if (status === 'CLOSED' && outcome) {
        const updatedMetrics = await updateMLPerformance(trade, outcome);
        
        return NextResponse.json({
          success: true,
          message: 'Trade updated and ML performance improved',
          trade_id,
          outcome,
          ml_metrics: updatedMetrics
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Trade updated',
        trade_id,
        outcome
      });
    }
    
    if (action === 'get_improved_recommendations') {
      // Generate recommendations with ML feedback adjustments
      const { ticker, base_recommendations } = data;
      
      const improvedRecs = await generateImprovedRecommendations(ticker, base_recommendations);
      
      return NextResponse.json({
        success: true,
        improved_recommendations: improvedRecs,
        improvement_applied: true,
        timestamp: Date.now()
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Trade feedback error:', error);
    return NextResponse.json({ 
      error: 'Trade feedback processing failed', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    
    if (type === 'summary') {
      const metrics = await loadMLMetrics();
      const feedbackData = await loadFeedbackData();
      
      return NextResponse.json({
        success: true,
        summary: {
          totalTrades: metrics.totalTrades,
          winRate: metrics.winRate.toFixed(1),
          avgConfidenceAccuracy: (metrics.avgConfidenceAccuracy * 100).toFixed(1),
          activeTrades: feedbackData.trades.filter(t => t.status === 'ACTIVE').length,
          lastTradeDate: feedbackData.trades.length > 0 ? 
            feedbackData.trades[feedbackData.trades.length - 1].entry_date : null
        },
        modelPerformance: metrics.modelPerformance,
        topStrategies: Object.entries(metrics.strategyPerformance)
          .sort(([,a], [,b]) => b.winRate - a.winRate)
          .slice(0, 5)
          .map(([strategy, perf]) => ({ strategy, ...perf })),
        topTickers: Object.entries(metrics.tickerPerformance)
          .sort(([,a], [,b]) => b.winRate - a.winRate)
          .slice(0, 10)
          .map(([ticker, perf]) => ({ ticker, ...perf }))
      });
    }
    
    if (type === 'trades') {
      const feedbackData = await loadFeedbackData();
      const limit = parseInt(searchParams.get('limit')) || 50;
      
      return NextResponse.json({
        success: true,
        trades: feedbackData.trades.slice(-limit).reverse(),
        totalTrades: feedbackData.trades.length
      });
    }
    
    if (type === 'performance') {
      const metrics = await loadMLMetrics();
      
      return NextResponse.json({
        success: true,
        performance: metrics,
        lastUpdated: new Date(metrics.lastUpdated).toISOString()
      });
    }
    
    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    
  } catch (error) {
    console.error('Trade feedback GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback data' }, { status: 500 });
  }
}