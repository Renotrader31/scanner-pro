"""
AI-Powered Trade Recommendation Engine
Advanced trading strategies with ML-driven recommendations
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class TradeType(Enum):
    STOCK_LONG = "stock_long"
    STOCK_SHORT = "stock_short"
    CALL_BUY = "call_buy"
    PUT_BUY = "put_buy"
    CALL_SPREAD = "call_spread"
    PUT_SPREAD = "put_spread"
    IRON_CONDOR = "iron_condor"
    STRADDLE = "straddle"
    STRANGLE = "strangle"
    CALENDAR_SPREAD = "calendar_spread"

class RiskLevel(Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    SPECULATION = "speculation"

@dataclass
class TradeRecommendation:
    ticker: str
    trade_type: TradeType
    direction: str
    entry_price: float
    target_price: float
    stop_loss: float
    position_size: int
    risk_reward_ratio: float
    probability_of_profit: float
    max_risk: float
    max_reward: float
    time_horizon: str
    confidence_score: float
    ml_rating: str
    strategy_description: str
    risk_level: RiskLevel
    reasons: List[str]
    expiry_date: Optional[str] = None
    strike_prices: Optional[List[float]] = None
    premium: Optional[float] = None
    greeks: Optional[Dict] = None

class OptionsStrategy:
    """Options strategy calculator and analyzer"""
    
    @staticmethod
    def calculate_option_metrics(stock_price: float, strike: float, expiry_days: int, 
                               iv: float, is_call: bool = True) -> Dict:
        """Calculate option Greeks and pricing (simplified Black-Scholes)"""
        try:
            # Simplified option pricing and Greeks calculation
            moneyness = stock_price / strike if strike > 0 else 1
            time_decay = max(0.01, expiry_days / 365)
            
            # Simplified delta calculation
            if is_call:
                delta = np.clip(0.5 + (moneyness - 1) * 0.5, 0.01, 0.99)
            else:
                delta = np.clip(-0.5 - (moneyness - 1) * 0.5, -0.99, -0.01)
            
            # Other Greeks (simplified)
            gamma = np.clip(0.1 / (abs(moneyness - 1) + 0.1), 0.01, 0.5)
            theta = -0.05 * time_decay
            vega = 0.1 * np.sqrt(time_decay)
            
            # Option premium (simplified)
            intrinsic = max(0, (stock_price - strike) if is_call else (strike - stock_price))
            time_value = iv / 100 * stock_price * np.sqrt(time_decay) * 0.4
            premium = intrinsic + time_value
            
            return {
                'premium': premium,
                'delta': delta,
                'gamma': gamma,
                'theta': theta,
                'vega': vega,
                'intrinsic_value': intrinsic,
                'time_value': time_value,
                'break_even': strike + premium if is_call else strike - premium
            }
            
        except Exception as e:
            print(f"Error calculating option metrics: {e}")
            return {}
    
    @staticmethod
    def suggest_option_strikes(stock_price: float, volatility: float, 
                             direction: str, expiry_days: int) -> List[float]:
        """Suggest optimal strike prices based on ML prediction"""
        try:
            vol_adjustment = volatility / 100 * np.sqrt(expiry_days / 365)
            
            if direction == 'BULLISH':
                # Suggest ITM to slightly OTM calls
                strikes = [
                    stock_price * 0.98,  # ITM
                    stock_price * 1.02,  # Slightly OTM
                    stock_price * 1.05,  # OTM
                    stock_price * 1.10   # Further OTM
                ]
            elif direction == 'BEARISH':
                # Suggest ITM to slightly OTM puts
                strikes = [
                    stock_price * 1.02,  # ITM
                    stock_price * 0.98,  # Slightly OTM
                    stock_price * 0.95,  # OTM
                    stock_price * 0.90   # Further OTM
                ]
            else:  # NEUTRAL
                # Suggest ATM and slightly OTM for strangles/condors
                strikes = [
                    stock_price * 0.95,
                    stock_price * 1.00,  # ATM
                    stock_price * 1.05,
                    stock_price * 1.10
                ]
            
            # Round to nearest $0.50 or $1.00
            return [round(strike * 2) / 2 for strike in strikes]
            
        except Exception as e:
            print(f"Error suggesting strikes: {e}")
            return [stock_price]

class TradeRecommendationEngine:
    """Main recommendation engine with ML integration"""
    
    def __init__(self):
        self.options_strategy = OptionsStrategy()
        self.risk_preferences = {
            RiskLevel.CONSERVATIVE: {'max_risk_pct': 0.02, 'min_prob_profit': 0.70},
            RiskLevel.MODERATE: {'max_risk_pct': 0.05, 'min_prob_profit': 0.60},
            RiskLevel.AGGRESSIVE: {'max_risk_pct': 0.10, 'min_prob_profit': 0.50},
            RiskLevel.SPECULATION: {'max_risk_pct': 0.20, 'min_prob_profit': 0.40}
        }
    
    async def generate_recommendations(self, ticker: str, market_data: Dict, 
                                    ml_analysis: Dict, account_size: float = 100000,
                                    risk_level: RiskLevel = RiskLevel.MODERATE) -> List[TradeRecommendation]:
        """Generate AI-powered trade recommendations"""
        try:
            recommendations = []
            
            stock_price = market_data.get('price', 0)
            if stock_price <= 0:
                return recommendations
            
            # Extract ML predictions
            ml_pred = ml_analysis.get('ml_analysis', {})
            price_prediction = ml_pred.get('price_prediction', {})
            vol_forecast = ml_pred.get('volatility_forecast', {})
            options_flow = ml_pred.get('options_flow', {})
            composite = ml_pred.get('composite_score', {})
            
            direction = price_prediction.get('direction', 'NEUTRAL')
            confidence = composite.get('confidence_score', 0.5)
            rating = composite.get('rating', 'C')
            
            # Only generate recommendations for decent confidence
            if confidence < 0.4:
                return recommendations
            
            # Generate different types of recommendations based on ML signals
            
            # 1. Stock recommendations
            stock_recs = await self._generate_stock_recommendations(
                ticker, stock_price, direction, confidence, rating, account_size, risk_level
            )
            recommendations.extend(stock_recs)
            
            # 2. Options recommendations
            options_recs = await self._generate_options_recommendations(
                ticker, market_data, ml_analysis, account_size, risk_level
            )
            recommendations.extend(options_recs)
            
            # 3. Advanced strategy recommendations
            strategy_recs = await self._generate_strategy_recommendations(
                ticker, market_data, ml_analysis, account_size, risk_level
            )
            recommendations.extend(strategy_recs)
            
            # Sort by confidence score and return top recommendations
            recommendations.sort(key=lambda x: x.confidence_score, reverse=True)
            return recommendations[:5]  # Top 5 recommendations
            
        except Exception as e:
            print(f"Error generating recommendations for {ticker}: {e}")
            return []
    
    async def _generate_stock_recommendations(self, ticker: str, stock_price: float,
                                           direction: str, confidence: float, rating: str,
                                           account_size: float, risk_level: RiskLevel) -> List[TradeRecommendation]:
        """Generate stock long/short recommendations"""
        recommendations = []
        risk_params = self.risk_preferences[risk_level]
        
        try:
            if direction == 'BULLISH' and confidence > 0.6:
                # Long stock recommendation
                position_size = int((account_size * risk_params['max_risk_pct']) / (stock_price * 0.15))  # 15% stop loss
                target_price = stock_price * (1 + confidence * 0.2)  # Up to 20% target based on confidence
                stop_loss = stock_price * 0.85  # 15% stop loss
                
                max_risk = position_size * stock_price * 0.15
                max_reward = position_size * (target_price - stock_price)
                risk_reward = max_reward / max_risk if max_risk > 0 else 0
                
                recommendations.append(TradeRecommendation(
                    ticker=ticker,
                    trade_type=TradeType.STOCK_LONG,
                    direction='BULLISH',
                    entry_price=stock_price,
                    target_price=target_price,
                    stop_loss=stop_loss,
                    position_size=position_size,
                    risk_reward_ratio=risk_reward,
                    probability_of_profit=confidence,
                    max_risk=max_risk,
                    max_reward=max_reward,
                    time_horizon='2-4 weeks',
                    confidence_score=confidence,
                    ml_rating=rating,
                    strategy_description=f"Long {ticker} based on ML bullish prediction with {confidence:.1%} confidence",
                    risk_level=risk_level,
                    reasons=[
                        f"ML model shows {confidence:.1%} bullish probability",
                        f"Rating: {rating}",
                        f"Target: {((target_price/stock_price - 1) * 100):.1f}% upside"
                    ]
                ))
            
            elif direction == 'BEARISH' and confidence > 0.6:
                # Short stock recommendation (if allowed)
                position_size = int((account_size * risk_params['max_risk_pct']) / (stock_price * 0.15))
                target_price = stock_price * (1 - confidence * 0.15)  # Up to 15% downside target
                stop_loss = stock_price * 1.15  # 15% stop loss
                
                max_risk = position_size * stock_price * 0.15
                max_reward = position_size * (stock_price - target_price)
                risk_reward = max_reward / max_risk if max_risk > 0 else 0
                
                recommendations.append(TradeRecommendation(
                    ticker=ticker,
                    trade_type=TradeType.STOCK_SHORT,
                    direction='BEARISH',
                    entry_price=stock_price,
                    target_price=target_price,
                    stop_loss=stop_loss,
                    position_size=position_size,
                    risk_reward_ratio=risk_reward,
                    probability_of_profit=confidence,
                    max_risk=max_risk,
                    max_reward=max_reward,
                    time_horizon='2-4 weeks',
                    confidence_score=confidence,
                    ml_rating=rating,
                    strategy_description=f"Short {ticker} based on ML bearish prediction with {confidence:.1%} confidence",
                    risk_level=risk_level,
                    reasons=[
                        f"ML model shows {confidence:.1%} bearish probability",
                        f"Rating: {rating}",
                        f"Target: {((1 - target_price/stock_price) * 100):.1f}% downside"
                    ]
                ))
                
        except Exception as e:
            print(f"Error generating stock recommendations: {e}")
        
        return recommendations
    
    async def _generate_options_recommendations(self, ticker: str, market_data: Dict,
                                              ml_analysis: Dict, account_size: float, 
                                              risk_level: RiskLevel) -> List[TradeRecommendation]:
        """Generate options recommendations based on ML analysis"""
        recommendations = []
        risk_params = self.risk_preferences[risk_level]
        
        try:
            stock_price = market_data.get('price', 0)
            ml_pred = ml_analysis.get('ml_analysis', {})
            price_prediction = ml_pred.get('price_prediction', {})
            vol_forecast = ml_pred.get('volatility_forecast', {})
            composite = ml_pred.get('composite_score', {})
            
            direction = price_prediction.get('direction', 'NEUTRAL')
            confidence = composite.get('confidence_score', 0.5)
            rating = composite.get('rating', 'C')
            
            # Simulate options data
            iv = np.clip(np.random.normal(35, 10), 15, 80)  # IV between 15-80%
            expiry_days = 30  # 30 DTE
            
            if confidence > 0.5:
                # Generate strikes based on direction
                strikes = self.options_strategy.suggest_option_strikes(
                    stock_price, iv, direction, expiry_days
                )
                
                if direction == 'BULLISH':
                    # Call buying recommendation
                    strike = strikes[1]  # Slightly OTM
                    option_metrics = self.options_strategy.calculate_option_metrics(
                        stock_price, strike, expiry_days, iv, is_call=True
                    )
                    
                    premium = option_metrics.get('premium', stock_price * 0.05)
                    contracts = max(1, int((account_size * risk_params['max_risk_pct']) / (premium * 100)))
                    
                    max_risk = contracts * premium * 100
                    max_reward = max_risk * 3  # Assume 3:1 reward potential
                    
                    recommendations.append(TradeRecommendation(
                        ticker=ticker,
                        trade_type=TradeType.CALL_BUY,
                        direction='BULLISH',
                        entry_price=premium,
                        target_price=premium * 2,
                        stop_loss=premium * 0.5,
                        position_size=contracts,
                        risk_reward_ratio=3.0,
                        probability_of_profit=confidence * 0.8,  # Options have lower POP
                        max_risk=max_risk,
                        max_reward=max_reward,
                        time_horizon=f'{expiry_days} days',
                        confidence_score=confidence * 0.9,  # Slightly lower for options
                        ml_rating=rating,
                        strategy_description=f"Buy ${strike} calls based on bullish ML prediction",
                        risk_level=risk_level,
                        reasons=[
                            f"ML bullish with {confidence:.1%} confidence",
                            f"Strike ${strike:.2f} offers good risk/reward",
                            f"Implied volatility: {iv:.1f}%"
                        ],
                        expiry_date=(datetime.now() + timedelta(days=expiry_days)).strftime('%Y-%m-%d'),
                        strike_prices=[strike],
                        premium=premium,
                        greeks=option_metrics
                    ))
                
                elif direction == 'BEARISH':
                    # Put buying recommendation
                    strike = strikes[1]  # Slightly OTM
                    option_metrics = self.options_strategy.calculate_option_metrics(
                        stock_price, strike, expiry_days, iv, is_call=False
                    )
                    
                    premium = option_metrics.get('premium', stock_price * 0.05)
                    contracts = max(1, int((account_size * risk_params['max_risk_pct']) / (premium * 100)))
                    
                    max_risk = contracts * premium * 100
                    max_reward = max_risk * 3
                    
                    recommendations.append(TradeRecommendation(
                        ticker=ticker,
                        trade_type=TradeType.PUT_BUY,
                        direction='BEARISH',
                        entry_price=premium,
                        target_price=premium * 2,
                        stop_loss=premium * 0.5,
                        position_size=contracts,
                        risk_reward_ratio=3.0,
                        probability_of_profit=confidence * 0.8,
                        max_risk=max_risk,
                        max_reward=max_reward,
                        time_horizon=f'{expiry_days} days',
                        confidence_score=confidence * 0.9,
                        ml_rating=rating,
                        strategy_description=f"Buy ${strike} puts based on bearish ML prediction",
                        risk_level=risk_level,
                        reasons=[
                            f"ML bearish with {confidence:.1%} confidence",
                            f"Strike ${strike:.2f} offers good risk/reward",
                            f"Implied volatility: {iv:.1f}%"
                        ],
                        expiry_date=(datetime.now() + timedelta(days=expiry_days)).strftime('%Y-%m-%d'),
                        strike_prices=[strike],
                        premium=premium,
                        greeks=option_metrics
                    ))
                    
        except Exception as e:
            print(f"Error generating options recommendations: {e}")
        
        return recommendations
    
    async def _generate_strategy_recommendations(self, ticker: str, market_data: Dict,
                                               ml_analysis: Dict, account_size: float,
                                               risk_level: RiskLevel) -> List[TradeRecommendation]:
        """Generate advanced strategy recommendations"""
        recommendations = []
        
        try:
            stock_price = market_data.get('price', 0)
            ml_pred = ml_analysis.get('ml_analysis', {})
            vol_forecast = ml_pred.get('volatility_forecast', {})
            composite = ml_pred.get('composite_score', {})
            
            vol_prediction = vol_forecast.get('prediction', 'STABLE')
            confidence = composite.get('confidence_score', 0.5)
            
            # Volatility-based strategies
            if vol_prediction == 'EXPANSION' and confidence > 0.6:
                # Long straddle for volatility expansion
                atm_strike = round(stock_price)
                iv = np.clip(np.random.normal(30, 8), 15, 60)
                expiry_days = 21
                
                call_metrics = self.options_strategy.calculate_option_metrics(
                    stock_price, atm_strike, expiry_days, iv, True
                )
                put_metrics = self.options_strategy.calculate_option_metrics(
                    stock_price, atm_strike, expiry_days, iv, False
                )
                
                total_premium = call_metrics.get('premium', 0) + put_metrics.get('premium', 0)
                contracts = max(1, int((account_size * 0.03) / (total_premium * 100)))  # 3% of account
                
                max_risk = contracts * total_premium * 100
                max_reward = max_risk * 2  # Assume good volatility expansion
                
                recommendations.append(TradeRecommendation(
                    ticker=ticker,
                    trade_type=TradeType.STRADDLE,
                    direction='NEUTRAL',
                    entry_price=total_premium,
                    target_price=total_premium * 1.5,
                    stop_loss=total_premium * 0.6,
                    position_size=contracts,
                    risk_reward_ratio=2.0,
                    probability_of_profit=0.65,
                    max_risk=max_risk,
                    max_reward=max_reward,
                    time_horizon=f'{expiry_days} days',
                    confidence_score=confidence * 0.8,
                    ml_rating=composite.get('rating', 'B'),
                    strategy_description=f"Long straddle to profit from ML-predicted volatility expansion",
                    risk_level=risk_level,
                    reasons=[
                        f"ML predicts volatility expansion with {confidence:.1%} confidence",
                        f"ATM straddle at ${atm_strike}",
                        "Benefits from movement in either direction"
                    ],
                    expiry_date=(datetime.now() + timedelta(days=expiry_days)).strftime('%Y-%m-%d'),
                    strike_prices=[atm_strike, atm_strike],
                    premium=total_premium
                ))
                
        except Exception as e:
            print(f"Error generating strategy recommendations: {e}")
        
        return recommendations

# Global recommendation engine instance
recommendation_engine = TradeRecommendationEngine()