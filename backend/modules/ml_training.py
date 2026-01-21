"""
ML Model Training Module for Cognitive Oracle Trading Platform

This module provides a scaffold for training custom ML models for:
- Price direction prediction
- Volatility forecasting
- Trend analysis
- Anomaly detection

Supported frameworks: scikit-learn, TensorFlow, PyTorch (optional)
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import json
import os
import pickle
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelType(str, Enum):
    DIRECTION = "direction"        # Predicts price up/down
    VOLATILITY = "volatility"      # Predicts volatility level
    TREND = "trend"                # Predicts trend strength
    ANOMALY = "anomaly"            # Detects unusual patterns
    ENSEMBLE = "ensemble"          # Combines multiple models


@dataclass
class TrainingConfig:
    """Configuration for model training"""
    model_type: ModelType
    symbol: str
    lookback_periods: int = 50          # Historical periods to consider
    prediction_horizon: int = 24        # Hours ahead to predict
    train_split: float = 0.8            # Train/test split ratio
    validation_split: float = 0.1       # Validation split from training
    epochs: int = 100                   # Training epochs
    batch_size: int = 32                # Batch size
    learning_rate: float = 0.001        # Learning rate
    early_stopping_patience: int = 10   # Early stopping patience


@dataclass
class ModelMetrics:
    """Model evaluation metrics"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    mse: Optional[float] = None
    mae: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None


class FeatureEngineer:
    """Feature engineering for trading ML models"""
    
    @staticmethod
    def calculate_rsi(prices: np.ndarray, period: int = 14) -> np.ndarray:
        """Calculate Relative Strength Index"""
        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = pd.Series(gains).rolling(window=period).mean().values
        avg_loss = pd.Series(losses).rolling(window=period).mean().values
        
        rs = avg_gain / (avg_loss + 1e-10)
        rsi = 100 - (100 / (1 + rs))
        return np.concatenate([[np.nan], rsi])
    
    @staticmethod
    def calculate_macd(prices: np.ndarray, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Calculate MACD, Signal, and Histogram"""
        prices_series = pd.Series(prices)
        ema_fast = prices_series.ewm(span=fast).mean()
        ema_slow = prices_series.ewm(span=slow).mean()
        macd = ema_fast - ema_slow
        signal_line = macd.ewm(span=signal).mean()
        histogram = macd - signal_line
        return macd.values, signal_line.values, histogram.values
    
    @staticmethod
    def calculate_bollinger_bands(prices: np.ndarray, period: int = 20, std_dev: float = 2) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Calculate Bollinger Bands"""
        prices_series = pd.Series(prices)
        sma = prices_series.rolling(window=period).mean()
        std = prices_series.rolling(window=period).std()
        upper = sma + (std * std_dev)
        lower = sma - (std * std_dev)
        return upper.values, sma.values, lower.values
    
    @staticmethod
    def calculate_atr(high: np.ndarray, low: np.ndarray, close: np.ndarray, period: int = 14) -> np.ndarray:
        """Calculate Average True Range"""
        prev_close = np.concatenate([[close[0]], close[:-1]])
        tr1 = high - low
        tr2 = np.abs(high - prev_close)
        tr3 = np.abs(low - prev_close)
        tr = np.maximum(tr1, np.maximum(tr2, tr3))
        return pd.Series(tr).rolling(window=period).mean().values
    
    @staticmethod
    def calculate_obv(close: np.ndarray, volume: np.ndarray) -> np.ndarray:
        """Calculate On-Balance Volume"""
        obv = np.zeros(len(close))
        obv[0] = volume[0]
        for i in range(1, len(close)):
            if close[i] > close[i-1]:
                obv[i] = obv[i-1] + volume[i]
            elif close[i] < close[i-1]:
                obv[i] = obv[i-1] - volume[i]
            else:
                obv[i] = obv[i-1]
        return obv
    
    def generate_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate all features from OHLCV data"""
        features = pd.DataFrame(index=df.index)
        
        # Price-based features
        features['returns'] = df['close'].pct_change()
        features['log_returns'] = np.log(df['close'] / df['close'].shift(1))
        features['price_momentum'] = df['close'] / df['close'].shift(10) - 1
        
        # Technical indicators
        features['rsi'] = self.calculate_rsi(df['close'].values)
        macd, signal, hist = self.calculate_macd(df['close'].values)
        features['macd'] = macd
        features['macd_signal'] = signal
        features['macd_histogram'] = hist
        
        upper, middle, lower = self.calculate_bollinger_bands(df['close'].values)
        features['bb_upper'] = upper
        features['bb_middle'] = middle
        features['bb_lower'] = lower
        features['bb_width'] = (upper - lower) / middle
        features['bb_position'] = (df['close'].values - lower) / (upper - lower + 1e-10)
        
        features['atr'] = self.calculate_atr(df['high'].values, df['low'].values, df['close'].values)
        features['atr_percent'] = features['atr'] / df['close'].values * 100
        
        # Volume features
        if 'volume' in df.columns:
            features['volume_sma'] = df['volume'].rolling(20).mean()
            features['volume_ratio'] = df['volume'] / features['volume_sma']
            features['obv'] = self.calculate_obv(df['close'].values, df['volume'].values)
        
        # Volatility features
        features['volatility_20'] = features['returns'].rolling(20).std() * np.sqrt(252)
        features['volatility_50'] = features['returns'].rolling(50).std() * np.sqrt(252)
        
        # Trend features
        features['sma_20'] = df['close'].rolling(20).mean()
        features['sma_50'] = df['close'].rolling(50).mean()
        features['sma_200'] = df['close'].rolling(200).mean()
        features['trend_20_50'] = (features['sma_20'] - features['sma_50']) / features['sma_50']
        
        return features.dropna()


class MLModelTrainer:
    """Main class for training and managing ML models"""
    
    def __init__(self, model_dir: str = "/app/backend/ml_models"):
        self.model_dir = model_dir
        self.feature_engineer = FeatureEngineer()
        self.models: Dict[str, any] = {}
        self.scalers: Dict[str, any] = {}
        
        # Create model directory if not exists
        os.makedirs(model_dir, exist_ok=True)
    
    def prepare_data(self, df: pd.DataFrame, config: TrainingConfig) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and labels for training"""
        features = self.feature_engineer.generate_features(df)
        
        # Create labels based on model type
        if config.model_type == ModelType.DIRECTION:
            # Binary: 1 if price goes up in prediction_horizon, 0 otherwise
            future_returns = df['close'].pct_change(config.prediction_horizon).shift(-config.prediction_horizon)
            labels = (future_returns > 0).astype(int)
        elif config.model_type == ModelType.VOLATILITY:
            # Categorical: Low, Medium, High volatility
            future_vol = df['close'].pct_change().rolling(config.prediction_horizon).std().shift(-config.prediction_horizon)
            labels = pd.cut(future_vol, bins=3, labels=[0, 1, 2]).astype(float)
        elif config.model_type == ModelType.TREND:
            # Categorical: Strong Down, Down, Neutral, Up, Strong Up
            future_returns = df['close'].pct_change(config.prediction_horizon).shift(-config.prediction_horizon)
            labels = pd.cut(future_returns, bins=5, labels=[0, 1, 2, 3, 4]).astype(float)
        else:
            # Default to direction
            future_returns = df['close'].pct_change(config.prediction_horizon).shift(-config.prediction_horizon)
            labels = (future_returns > 0).astype(int)
        
        # Align features and labels
        valid_idx = ~(features.isna().any(axis=1) | labels.isna())
        X = features[valid_idx].values
        y = labels[valid_idx].values
        
        return X, y
    
    def train_sklearn_model(self, X: np.ndarray, y: np.ndarray, config: TrainingConfig) -> Dict:
        """Train a scikit-learn model"""
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import StandardScaler
        from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=1-config.train_split, shuffle=False
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train model
        if config.model_type in [ModelType.DIRECTION, ModelType.VOLATILITY]:
            model = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=config.learning_rate,
                max_depth=5,
                random_state=42
            )
        else:
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
        
        logger.info(f"Training {config.model_type} model for {config.symbol}...")
        model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test_scaled)
        
        metrics = ModelMetrics(
            accuracy=accuracy_score(y_test, y_pred),
            precision=precision_score(y_test, y_pred, average='weighted', zero_division=0),
            recall=recall_score(y_test, y_pred, average='weighted', zero_division=0),
            f1_score=f1_score(y_test, y_pred, average='weighted', zero_division=0)
        )
        
        # Store model and scaler
        model_key = f"{config.symbol}_{config.model_type}"
        self.models[model_key] = model
        self.scalers[model_key] = scaler
        
        return {
            "model_key": model_key,
            "metrics": metrics.__dict__,
            "feature_importance": dict(zip(
                [f"feature_{i}" for i in range(X.shape[1])],
                model.feature_importances_.tolist() if hasattr(model, 'feature_importances_') else []
            ))
        }
    
    def save_model(self, model_key: str) -> str:
        """Save model to disk"""
        if model_key not in self.models:
            raise ValueError(f"Model {model_key} not found")
        
        model_path = os.path.join(self.model_dir, f"{model_key}_model.pkl")
        scaler_path = os.path.join(self.model_dir, f"{model_key}_scaler.pkl")
        
        with open(model_path, 'wb') as f:
            pickle.dump(self.models[model_key], f)
        
        if model_key in self.scalers:
            with open(scaler_path, 'wb') as f:
                pickle.dump(self.scalers[model_key], f)
        
        logger.info(f"Model saved to {model_path}")
        return model_path
    
    def load_model(self, model_key: str) -> bool:
        """Load model from disk"""
        model_path = os.path.join(self.model_dir, f"{model_key}_model.pkl")
        scaler_path = os.path.join(self.model_dir, f"{model_key}_scaler.pkl")
        
        if not os.path.exists(model_path):
            return False
        
        with open(model_path, 'rb') as f:
            self.models[model_key] = pickle.load(f)
        
        if os.path.exists(scaler_path):
            with open(scaler_path, 'rb') as f:
                self.scalers[model_key] = pickle.load(f)
        
        logger.info(f"Model loaded from {model_path}")
        return True
    
    def predict(self, model_key: str, features: np.ndarray) -> Dict:
        """Make prediction using trained model"""
        if model_key not in self.models:
            if not self.load_model(model_key):
                raise ValueError(f"Model {model_key} not found")
        
        model = self.models[model_key]
        scaler = self.scalers.get(model_key)
        
        if scaler:
            features_scaled = scaler.transform(features.reshape(1, -1))
        else:
            features_scaled = features.reshape(1, -1)
        
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0] if hasattr(model, 'predict_proba') else None
        
        return {
            "prediction": int(prediction),
            "confidence": float(max(probabilities)) if probabilities is not None else None,
            "probabilities": probabilities.tolist() if probabilities is not None else None
        }
    
    def get_model_info(self, model_key: str) -> Dict:
        """Get information about a trained model"""
        model_path = os.path.join(self.model_dir, f"{model_key}_model.pkl")
        
        if model_key in self.models:
            model = self.models[model_key]
        elif os.path.exists(model_path):
            self.load_model(model_key)
            model = self.models[model_key]
        else:
            return {"error": "Model not found"}
        
        return {
            "model_key": model_key,
            "model_type": type(model).__name__,
            "n_features": model.n_features_in_ if hasattr(model, 'n_features_in_') else None,
            "trained": True,
            "path": model_path if os.path.exists(model_path) else None
        }
    
    def list_models(self) -> List[Dict]:
        """List all available models"""
        models = []
        
        # Check in-memory models
        for key in self.models:
            models.append(self.get_model_info(key))
        
        # Check saved models
        for filename in os.listdir(self.model_dir):
            if filename.endswith('_model.pkl'):
                key = filename.replace('_model.pkl', '')
                if key not in self.models:
                    models.append(self.get_model_info(key))
        
        return models


# Global trainer instance
ml_trainer = MLModelTrainer()


# FastAPI integration functions
def get_training_status() -> Dict:
    """Get current training status and available models"""
    return {
        "available_models": ml_trainer.list_models(),
        "model_types": [t.value for t in ModelType],
        "supported_symbols": ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE"],
        "status": "ready"
    }


def start_training(symbol: str, model_type: str, data: List[Dict]) -> Dict:
    """Start training a new model"""
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(data)
        df.columns = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df.set_index('timestamp', inplace=True)
        
        # Create config
        config = TrainingConfig(
            model_type=ModelType(model_type),
            symbol=symbol
        )
        
        # Prepare and train
        X, y = ml_trainer.prepare_data(df, config)
        result = ml_trainer.train_sklearn_model(X, y, config)
        
        # Save model
        ml_trainer.save_model(result['model_key'])
        
        return {
            "success": True,
            "result": result
        }
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


def get_prediction(symbol: str, model_type: str, features: List[float]) -> Dict:
    """Get prediction from trained model"""
    try:
        model_key = f"{symbol}_{model_type}"
        result = ml_trainer.predict(model_key, np.array(features))
        return {
            "success": True,
            "prediction": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
