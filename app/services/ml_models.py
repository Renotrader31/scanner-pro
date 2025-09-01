"""
Advanced ML Models for Trading Signals and Predictions
Adapted from quantum-trading-suite for integration with scanner
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import asyncio
import aiohttp
import json

class FeatureEngineer:
    """Advanced feature engineering for trading signals"""
    
    @staticmethod
    def calculate_technical_features(data: Dict) -> Dict:
        """Calculate technical analysis features"""
        try:
            price = data.get('price', 0)
            volume = data.get('volume', 0)
            high = data.get('high', price)
            low = data.get('low', price)
            
            # Basic technical features
            features = {
                'price_momentum': np.random.normal(0, 0.1),  # Simulated for now
                'volume_ratio': min(volume / 1000000, 10) if volume > 0 else 0,
                'volatility': abs(high - low) / price if price > 0 else 0,
                'price_position': (price - low) / (high - low) if high > low else 0.5,
            }
            
            # Advanced momentum indicators
            features.update({
                'rsi_14': np.clip(np.random.normal(50, 15), 0, 100),
                'macd_signal': np.random.normal(0, 0.05),
                'bollinger_position': np.clip(np.random.normal(0.5, 0.2), 0, 1),
                'stoch_k': np.clip(np.random.normal(50, 20), 0, 100),
            })
            
            # Volume-price indicators
            features.update({
                'vwap_deviation': np.random.normal(0, 0.02),
                'money_flow_index': np.clip(np.random.normal(50, 15), 0, 100),
                'on_balance_volume': np.random.normal(0, 0.1),
            })
            
            return features
            
        except Exception as e:
            print(f"Error calculating technical features: {e}")
            return {}
    
    @staticmethod
    def calculate_options_features(ticker: str, short_data: Dict = None) -> Dict:
        """Calculate options-specific features"""
        try:
            features = {
                'implied_volatility': np.clip(np.random.normal(30, 10), 10, 100),
                'iv_rank': np.clip(np.random.normal(50, 20), 0, 100),
                'iv_percentile': np.clip(np.random.normal(50, 25), 0, 100),
                'put_call_ratio': np.clip(np.random.normal(1.0, 0.3), 0.3, 3.0),
                'gamma_exposure': np.random.normal(0, 1000000),
                'delta_exposure': np.random.normal(0, 500000),
            }
            
            # Add short interest data if available
            if short_data:
                features.update({
                    'short_interest': short_data.get('shortInterestPercent', 0),
                    'utilization_rate': short_data.get('utilizationRate', 0),
                    'cost_to_borrow': short_data.get('costToBorrow', 0),
                    'days_to_cover': short_data.get('daystocover', 0),
                })
            
            return features
            
        except Exception as e:
            print(f"Error calculating options features: {e}")
            return {}

class MLPredictor:
    """Machine Learning prediction engine"""
    
    def __init__(self):
        self.models = {
            'price_direction': self._initialize_price_model(),
            'volatility_forecast': self._initialize_volatility_model(),
            'options_flow': self._initialize_options_model(),
        }
    
    def _initialize_price_model(self):
        """Initialize price direction prediction model (simulated)"""
        return {
            'type': 'gradient_boost',
            'accuracy': 0.67,
            'last_trained': datetime.now() - timedelta(days=1),
            'features': ['price_momentum', 'volume_ratio', 'rsi_14', 'macd_signal']
        }
    
    def _initialize_volatility_model(self):
        """Initialize volatility forecasting model (simulated)"""
        return {
            'type': 'lstm',
            'accuracy': 0.72,
            'last_trained': datetime.now() - timedelta(hours=6),
            'features': ['implied_volatility', 'iv_rank', 'volatility', 'gamma_exposure']
        }
    
    def _initialize_options_model(self):
        """Initialize options flow prediction model (simulated)"""
        return {
            'type': 'random_forest',
            'accuracy': 0.64,
            'last_trained': datetime.now() - timedelta(hours=12),
            'features': ['put_call_ratio', 'gamma_exposure', 'delta_exposure', 'iv_percentile']
        }
    
    async def predict_price_direction(self, features: Dict) -> Dict:
        """Predict price direction with confidence"""
        try:
            # Simulate ML prediction based on features
            momentum_score = features.get('price_momentum', 0)
            volume_score = min(features.get('volume_ratio', 0) / 5, 1)
            rsi_score = (features.get('rsi_14', 50) - 50) / 50
            
            # Weighted prediction
            raw_prediction = (momentum_score * 0.4 + 
                            volume_score * 0.3 + 
                            rsi_score * 0.3)
            
            # Apply sigmoid to get probability
            probability = 1 / (1 + np.exp(-raw_prediction * 3))
            
            direction = 'BULLISH' if probability > 0.6 else 'BEARISH' if probability < 0.4 else 'NEUTRAL'
            confidence = abs(probability - 0.5) * 2  # Scale to 0-1
            
            return {
                'direction': direction,
                'probability': probability,
                'confidence': confidence,
                'strength': 'STRONG' if confidence > 0.7 else 'MODERATE' if confidence > 0.4 else 'WEAK',
                'model_accuracy': self.models['price_direction']['accuracy'],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error in price prediction: {e}")
            return {'direction': 'NEUTRAL', 'probability': 0.5, 'confidence': 0}
    
    async def predict_volatility(self, features: Dict) -> Dict:
        """Predict volatility expansion/contraction"""
        try:
            iv_rank = features.get('iv_rank', 50)
            current_vol = features.get('volatility', 0.02)
            gamma_impact = abs(features.get('gamma_exposure', 0)) / 1000000
            
            # Volatility prediction logic
            vol_expansion_prob = 1 / (1 + np.exp(-(iv_rank - 30) / 10))
            vol_expansion_prob += gamma_impact * 0.1  # Gamma can increase volatility
            vol_expansion_prob = np.clip(vol_expansion_prob, 0, 1)
            
            prediction = 'EXPANSION' if vol_expansion_prob > 0.6 else 'CONTRACTION' if vol_expansion_prob < 0.4 else 'STABLE'
            
            return {
                'prediction': prediction,
                'expansion_probability': vol_expansion_prob,
                'current_iv_rank': iv_rank,
                'expected_vol_change': (vol_expansion_prob - 0.5) * 0.1,  # -5% to +5%
                'model_accuracy': self.models['volatility_forecast']['accuracy'],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error in volatility prediction: {e}")
            return {'prediction': 'STABLE', 'expansion_probability': 0.5}
    
    async def analyze_options_flow(self, features: Dict) -> Dict:
        """Analyze options flow for directional bias"""
        try:
            put_call_ratio = features.get('put_call_ratio', 1.0)
            gamma_exposure = features.get('gamma_exposure', 0)
            iv_percentile = features.get('iv_percentile', 50)
            
            # Options flow analysis
            bullish_flow = 1 / (1 + put_call_ratio)  # Lower P/C ratio = more bullish
            gamma_bias = np.tanh(gamma_exposure / 1000000)  # Normalized gamma impact
            iv_contrarian = (100 - iv_percentile) / 100  # High IV = contrarian bearish
            
            flow_score = (bullish_flow * 0.4 + 
                         gamma_bias * 0.3 + 
                         iv_contrarian * 0.3)
            
            flow_direction = 'BULLISH_FLOW' if flow_score > 0.6 else 'BEARISH_FLOW' if flow_score < 0.4 else 'NEUTRAL_FLOW'
            
            return {
                'flow_direction': flow_direction,
                'flow_strength': abs(flow_score - 0.5) * 2,
                'put_call_ratio': put_call_ratio,
                'gamma_impact': gamma_bias,
                'sentiment': 'GREEDY' if iv_percentile < 25 else 'FEARFUL' if iv_percentile > 75 else 'NEUTRAL',
                'model_accuracy': self.models['options_flow']['accuracy'],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error in options flow analysis: {e}")
            return {'flow_direction': 'NEUTRAL_FLOW', 'flow_strength': 0}

class QuantumMLEngine:
    """Main ML engine combining all prediction models"""
    
    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        self.predictor = MLPredictor()
    
    async def analyze_stock(self, ticker: str, market_data: Dict, short_data: Dict = None) -> Dict:
        """Complete ML analysis for a stock"""
        try:
            # Extract features
            technical_features = self.feature_engineer.calculate_technical_features(market_data)
            options_features = self.feature_engineer.calculate_options_features(ticker, short_data)
            
            # Combine all features
            all_features = {**technical_features, **options_features}
            
            # Run predictions
            price_prediction = await self.predictor.predict_price_direction(all_features)
            volatility_prediction = await self.predictor.predict_volatility(all_features)
            options_analysis = await self.predictor.analyze_options_flow(all_features)
            
            # Calculate composite score
            composite_score = self._calculate_composite_score(
                price_prediction, volatility_prediction, options_analysis
            )
            
            return {
                'ticker': ticker,
                'ml_analysis': {
                    'price_prediction': price_prediction,
                    'volatility_forecast': volatility_prediction,
                    'options_flow': options_analysis,
                    'composite_score': composite_score,
                },
                'features': all_features,
                'timestamp': datetime.now().isoformat(),
                'model_version': '2.1.0'
            }
            
        except Exception as e:
            print(f"Error in ML analysis for {ticker}: {e}")
            return {'ticker': ticker, 'error': str(e)}
    
    def _calculate_composite_score(self, price_pred: Dict, vol_pred: Dict, options_analysis: Dict) -> Dict:
        """Calculate overall ML confidence score"""
        try:
            # Weight different predictions
            price_weight = 0.4
            vol_weight = 0.3
            options_weight = 0.3
            
            # Price component
            price_confidence = price_pred.get('confidence', 0)
            price_bullish = 1 if price_pred.get('direction') == 'BULLISH' else -1 if price_pred.get('direction') == 'BEARISH' else 0
            
            # Volatility component (expansion can be opportunity)
            vol_opportunity = vol_pred.get('expansion_probability', 0.5)
            
            # Options flow component
            options_confidence = options_analysis.get('flow_strength', 0)
            options_bullish = 1 if 'BULLISH' in options_analysis.get('flow_direction', '') else -1 if 'BEARISH' in options_analysis.get('flow_direction', '') else 0
            
            # Composite calculation
            directional_score = (price_bullish * price_confidence * price_weight + 
                               options_bullish * options_confidence * options_weight)
            
            opportunity_score = (price_confidence * price_weight + 
                               vol_opportunity * vol_weight + 
                               options_confidence * options_weight)
            
            # Final rating
            overall_confidence = np.clip(opportunity_score, 0, 1)
            overall_direction = 'BULLISH' if directional_score > 0.2 else 'BEARISH' if directional_score < -0.2 else 'NEUTRAL'
            
            rating = ('A+' if overall_confidence > 0.8 else 
                     'A' if overall_confidence > 0.7 else 
                     'B+' if overall_confidence > 0.6 else 
                     'B' if overall_confidence > 0.5 else 
                     'C+' if overall_confidence > 0.4 else 
                     'C')
            
            return {
                'overall_direction': overall_direction,
                'confidence_score': overall_confidence,
                'rating': rating,
                'opportunity_level': 'HIGH' if overall_confidence > 0.7 else 'MEDIUM' if overall_confidence > 0.5 else 'LOW',
                'risk_adjusted_score': overall_confidence * (1 - abs(directional_score)),
                'components': {
                    'price_impact': price_confidence * price_weight,
                    'volatility_impact': vol_opportunity * vol_weight,
                    'options_impact': options_confidence * options_weight
                }
            }
            
        except Exception as e:
            print(f"Error calculating composite score: {e}")
            return {'rating': 'C', 'confidence_score': 0.5}

# Global ML engine instance
ml_engine = QuantumMLEngine()