"""
Transformer Model for Price Prediction
Attention-based deep learning for time-series forecasting
Ensemble with LSTM for improved accuracy
"""

import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
import os
import logging
import pickle
import json

# TensorFlow imports
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras.models import Model
    from tensorflow.keras.layers import (
        Input, Dense, Dropout, LayerNormalization,
        MultiHeadAttention, GlobalAveragePooling1D, Add
    )
    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
    from tensorflow.keras.optimizers import Adam
    from sklearn.preprocessing import MinMaxScaler
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

logger = logging.getLogger(__name__)

if TF_AVAILABLE:
    tf.get_logger().setLevel('ERROR')
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'


class TransformerConfig:
    """Configuration for Transformer model"""
    def __init__(
        self,
        symbol: str,
        lookback: int = 60,
        forecast_horizon: int = 24,
        num_heads: int = 4,
        ff_dim: int = 128,
        num_transformer_blocks: int = 2,
        mlp_units: List[int] = [64, 32],
        dropout_rate: float = 0.2,
        learning_rate: float = 0.001,
        batch_size: int = 32,
        epochs: int = 100,
    ):
        self.symbol = symbol
        self.lookback = lookback
        self.forecast_horizon = forecast_horizon
        self.num_heads = num_heads
        self.ff_dim = ff_dim
        self.num_transformer_blocks = num_transformer_blocks
        self.mlp_units = mlp_units
        self.dropout_rate = dropout_rate
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.epochs = epochs


def transformer_encoder(inputs, head_size, num_heads, ff_dim, dropout=0):
    """Transformer encoder block"""
    # Multi-head attention
    x = LayerNormalization(epsilon=1e-6)(inputs)
    x = MultiHeadAttention(
        key_dim=head_size, num_heads=num_heads, dropout=dropout
    )(x, x)
    x = Dropout(dropout)(x)
    res = Add()([x, inputs])
    
    # Feed forward network
    x = LayerNormalization(epsilon=1e-6)(res)
    x = Dense(ff_dim, activation="relu")(x)
    x = Dropout(dropout)(x)
    x = Dense(inputs.shape[-1])(x)
    return Add()([x, res])


class TransformerPredictor:
    """Transformer-based price prediction model"""
    
    def __init__(self, config: TransformerConfig):
        self.config = config
        self.model = None
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.price_scaler = MinMaxScaler(feature_range=(0, 1))
        self.is_trained = False
        self.model_dir = "/app/backend/ml_models/transformer"
        os.makedirs(self.model_dir, exist_ok=True)
    
    def _build_model(self, input_shape: Tuple[int, int]) -> Model:
        """Build Transformer model architecture"""
        inputs = Input(shape=input_shape)
        x = inputs
        
        # Transformer blocks
        for _ in range(self.config.num_transformer_blocks):
            x = transformer_encoder(
                x,
                head_size=input_shape[-1],
                num_heads=self.config.num_heads,
                ff_dim=self.config.ff_dim,
                dropout=self.config.dropout_rate
            )
        
        # Global pooling
        x = GlobalAveragePooling1D(data_format="channels_last")(x)
        
        # MLP head
        for dim in self.config.mlp_units:
            x = Dense(dim, activation="relu")(x)
            x = Dropout(self.config.dropout_rate)(x)
        
        # Output
        outputs = Dense(1)(x)
        
        model = Model(inputs, outputs)
        model.compile(
            optimizer=Adam(learning_rate=self.config.learning_rate),
            loss="mse",
            metrics=["mae"]
        )
        
        return model
    
    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for Transformer model"""
        features = pd.DataFrame(index=df.index)
        
        # Price features
        features['close'] = df['close']
        features['returns'] = df['close'].pct_change()
        
        # Moving averages
        for period in [5, 10, 20]:
            features[f'sma_{period}'] = df['close'].rolling(period).mean()
            features[f'ema_{period}'] = df['close'].ewm(span=period).mean()
        
        # Volatility
        features['volatility'] = features['returns'].rolling(10).std()
        
        # RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / (loss + 1e-10)
        features['rsi'] = 100 - (100 / (1 + rs))
        
        # MACD
        ema_12 = df['close'].ewm(span=12).mean()
        ema_26 = df['close'].ewm(span=26).mean()
        features['macd'] = ema_12 - ema_26
        
        # Momentum
        features['momentum'] = df['close'] / df['close'].shift(10) - 1
        
        return features.dropna()
    
    def _create_sequences(self, data: np.ndarray, target: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Create sequences for training"""
        X, y = [], []
        for i in range(self.config.lookback, len(data) - self.config.forecast_horizon):
            X.append(data[i - self.config.lookback:i])
            y.append(target[i + self.config.forecast_horizon - 1])
        return np.array(X), np.array(y)
    
    def train(self, df: pd.DataFrame, validation_split: float = 0.2) -> Dict:
        """Train Transformer model"""
        if not TF_AVAILABLE:
            return {"success": False, "error": "TensorFlow not available"}
        
        try:
            features = self.prepare_features(df)
            
            if len(features) < self.config.lookback + self.config.forecast_horizon + 100:
                return {"success": False, "error": "Insufficient data"}
            
            target = features['close'].values
            feature_cols = [c for c in features.columns if c != 'close']
            X_data = features[feature_cols].values
            
            X_scaled = self.scaler.fit_transform(X_data)
            y_scaled = self.price_scaler.fit_transform(target.reshape(-1, 1)).flatten()
            
            X, y = self._create_sequences(X_scaled, y_scaled)
            
            split_idx = int(len(X) * (1 - validation_split))
            X_train, X_val = X[:split_idx], X[split_idx:]
            y_train, y_val = y[:split_idx], y[split_idx:]
            
            logger.info(f"Training Transformer for {self.config.symbol}")
            
            self.model = self._build_model(input_shape=(X.shape[1], X.shape[2]))
            
            callbacks = [
                EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
                ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6)
            ]
            
            history = self.model.fit(
                X_train, y_train,
                epochs=self.config.epochs,
                batch_size=self.config.batch_size,
                validation_data=(X_val, y_val),
                callbacks=callbacks,
                verbose=0
            )
            
            self.is_trained = True
            
            # Evaluate
            y_pred_scaled = self.model.predict(X_val, verbose=0)
            y_pred = self.price_scaler.inverse_transform(y_pred_scaled).flatten()
            y_actual = self.price_scaler.inverse_transform(y_val.reshape(-1, 1)).flatten()
            
            mape = np.mean(np.abs((y_actual - y_pred) / (y_actual + 1e-10))) * 100
            direction_correct = np.sum((np.diff(y_pred) > 0) == (np.diff(y_actual) > 0)) / (len(y_pred) - 1)
            
            model_path = self.save_model()
            
            return {
                "success": True,
                "symbol": self.config.symbol,
                "model_type": "transformer",
                "training_samples": len(X_train),
                "epochs_trained": len(history.history['loss']),
                "metrics": {
                    "mape": float(mape),
                    "direction_accuracy": float(direction_correct)
                },
                "model_path": model_path
            }
            
        except Exception as e:
            logger.error(f"Transformer training error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def predict(self, df: pd.DataFrame) -> Dict:
        """Make prediction"""
        if not self.is_trained and not self.load_model():
            return {"success": False, "error": "Model not trained"}
        
        try:
            features = self.prepare_features(df)
            
            if len(features) < self.config.lookback:
                return {"success": False, "error": f"Need {self.config.lookback} data points"}
            
            feature_cols = [c for c in features.columns if c != 'close']
            X_data = features[feature_cols].values
            X_scaled = self.scaler.transform(X_data)
            
            last_sequence = X_scaled[-self.config.lookback:].reshape(1, self.config.lookback, -1)
            
            pred_scaled = self.model.predict(last_sequence, verbose=0)
            pred_price = self.price_scaler.inverse_transform(pred_scaled)[0][0]
            current_price = features['close'].iloc[-1]
            
            expected_return = (pred_price - current_price) / current_price * 100
            
            if expected_return > 1:
                direction, signal = "bullish", "buy"
            elif expected_return < -1:
                direction, signal = "bearish", "sell"
            else:
                direction, signal = "neutral", "hold"
            
            return {
                "success": True,
                "symbol": self.config.symbol,
                "model_type": "transformer",
                "current_price": float(current_price),
                "predicted_price": float(pred_price),
                "expected_return_pct": float(expected_return),
                "direction": direction,
                "signal": signal,
                "confidence": 0.70,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def save_model(self) -> str:
        model_path = os.path.join(self.model_dir, f"{self.config.symbol}_transformer.keras")
        self.model.save(model_path)
        
        with open(os.path.join(self.model_dir, f"{self.config.symbol}_scaler.pkl"), 'wb') as f:
            pickle.dump(self.scaler, f)
        with open(os.path.join(self.model_dir, f"{self.config.symbol}_price_scaler.pkl"), 'wb') as f:
            pickle.dump(self.price_scaler, f)
        
        return model_path
    
    def load_model(self) -> bool:
        model_path = os.path.join(self.model_dir, f"{self.config.symbol}_transformer.keras")
        if not os.path.exists(model_path):
            return False
        
        try:
            self.model = keras.models.load_model(model_path)
            with open(os.path.join(self.model_dir, f"{self.config.symbol}_scaler.pkl"), 'rb') as f:
                self.scaler = pickle.load(f)
            with open(os.path.join(self.model_dir, f"{self.config.symbol}_price_scaler.pkl"), 'rb') as f:
                self.price_scaler = pickle.load(f)
            self.is_trained = True
            return True
        except:
            return False


# Ensemble Predictor combining LSTM and Transformer
class EnsemblePredictor:
    """Ensemble model combining LSTM and Transformer predictions"""
    
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.lstm_weight = 0.6  # LSTM gets higher weight initially
        self.transformer_weight = 0.4
    
    def predict(self, lstm_pred: Dict, transformer_pred: Dict) -> Dict:
        """Combine predictions from both models"""
        if not lstm_pred.get("success") and not transformer_pred.get("success"):
            return {"success": False, "error": "Both models failed"}
        
        # Use whichever model succeeded
        if not lstm_pred.get("success"):
            return {**transformer_pred, "ensemble": False, "model_used": "transformer_only"}
        if not transformer_pred.get("success"):
            return {**lstm_pred, "ensemble": False, "model_used": "lstm_only"}
        
        # Weighted average of predictions
        lstm_price = lstm_pred["predicted_price"]
        trans_price = transformer_pred["predicted_price"]
        
        ensemble_price = (
            lstm_price * self.lstm_weight + 
            trans_price * self.transformer_weight
        )
        
        current_price = lstm_pred["current_price"]
        expected_return = (ensemble_price - current_price) / current_price * 100
        
        # Weighted confidence
        lstm_conf = lstm_pred.get("confidence", 0.5)
        trans_conf = transformer_pred.get("confidence", 0.5)
        ensemble_conf = lstm_conf * self.lstm_weight + trans_conf * self.transformer_weight
        
        # Direction consensus
        lstm_dir = lstm_pred["direction"]
        trans_dir = transformer_pred["direction"]
        
        if lstm_dir == trans_dir:
            direction = lstm_dir
            consensus = "strong"
            ensemble_conf *= 1.1  # Boost confidence on agreement
        else:
            # Use weighted return for direction
            if expected_return > 1:
                direction = "bullish"
            elif expected_return < -1:
                direction = "bearish"
            else:
                direction = "neutral"
            consensus = "weak"
        
        signal = "buy" if direction == "bullish" else "sell" if direction == "bearish" else "hold"
        
        return {
            "success": True,
            "symbol": self.symbol,
            "model_type": "ensemble",
            "current_price": float(current_price),
            "predicted_price": float(ensemble_price),
            "expected_return_pct": float(expected_return),
            "direction": direction,
            "signal": signal,
            "confidence": min(float(ensemble_conf), 0.95),
            "consensus": consensus,
            "individual_predictions": {
                "lstm": {
                    "price": lstm_price,
                    "direction": lstm_dir,
                    "weight": self.lstm_weight
                },
                "transformer": {
                    "price": trans_price,
                    "direction": trans_dir,
                    "weight": self.transformer_weight
                }
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Global models cache
transformer_models: Dict[str, TransformerPredictor] = {}
ensemble_predictors: Dict[str, EnsemblePredictor] = {}


def get_transformer_predictor(symbol: str) -> TransformerPredictor:
    if symbol not in transformer_models:
        config = TransformerConfig(symbol=symbol)
        transformer_models[symbol] = TransformerPredictor(config)
    return transformer_models[symbol]


def get_ensemble_predictor(symbol: str) -> EnsemblePredictor:
    if symbol not in ensemble_predictors:
        ensemble_predictors[symbol] = EnsemblePredictor(symbol)
    return ensemble_predictors[symbol]


async def train_transformer_model(symbol: str, df: pd.DataFrame) -> Dict:
    predictor = get_transformer_predictor(symbol)
    return predictor.train(df)


async def predict_with_transformer(symbol: str, df: pd.DataFrame) -> Dict:
    predictor = get_transformer_predictor(symbol)
    return predictor.predict(df)


def get_transformer_status() -> Dict:
    return {
        "available": TF_AVAILABLE,
        "trained_models": list(transformer_models.keys()),
        "model_dir": "/app/backend/ml_models/transformer"
    }
