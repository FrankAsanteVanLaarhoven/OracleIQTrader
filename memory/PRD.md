# Cognitive Oracle Trading Platform - Product Requirements Document

## Original Problem Statement
Build a state-of-the-art "Cognitive Oracle Trading Platform" with:
- Glassmorphism design with ephemeral UI
- Voice-first interface, facial recognition, and gesture control
- Multi-agent AI consensus system and "Oracle" memory for historical trade lookups
- Production-ready trading capabilities with paper trading, AI bots, and training
- Mobile app with QR code scanner and biometric authentication
- ML model training capabilities and Benzinga news integration

## Current Status: P9 Complete ✅

## Core Requirements - All Phases Complete

### Phase 1-7: Foundation & Production Features ✅
- Dashboard, real-time market data, paper trading
- Facial recognition, WebSocket, Google OAuth
- Social trading, charts, portfolio analytics
- Price alerts, advanced orders, newsfeed, auto-trading
- Trading Journal, Leaderboard, Social Signals
- Trading Playground, AI Bot, Training Center
- ML Predictions, Trading Competitions, Benzinga News

### Phase 8: Mobile App Foundation ✅
- React Native + Expo scaffold
- 5 core screens: Dashboard, Markets, Trade, Portfolio, Settings
- Glassmorphism UI components
- API integration with backend

### Phase 9: Advanced Features ✅ (Jan 21, 2026)

#### QR Code Scanner (Mobile)
- Camera-based QR code scanning
- Binance/Coinbase/Kraken API key import
- JSON parsing for apiKey + secretKey
- Visual scan area with corner markers
- Permission handling

#### Biometric Authentication (Mobile)
- Face ID / Fingerprint support
- Expo LocalAuthentication integration
- Protection for sensitive operations:
  - Viewing secret keys
  - Saving API credentials
  - Scanning QR codes
- Fallback to device passcode

#### ML Model Training Module (Backend)
- `/app/backend/modules/ml_training.py`
- Scikit-learn based training scaffold
- Model types: direction, volatility, trend, anomaly, ensemble
- Feature engineering: RSI, MACD, Bollinger Bands, ATR, OBV
- Model persistence (pickle)
- API endpoints:
  - GET `/api/ml/training/status`
  - GET `/api/ml/training/models`
  - POST `/api/ml/training/train`
  - POST `/api/ml/training/predict`

#### Benzinga News Integration (Backend)
- `/app/backend/modules/benzinga_integration.py`
- Real API client (when key provided)
- Mock client for development
- Sentiment analysis
- Impact categorization
- API endpoints:
  - GET `/api/news/benzinga`
  - GET `/api/news/benzinga/crypto`
  - GET `/api/news/benzinga/market-movers`
  - GET `/api/news/benzinga/symbol/{symbol}`

#### App Store Build Configuration
- `eas.json` - EAS Build profiles
- Updated `app.json` with:
  - iOS/Android permissions
  - Camera usage descriptions
  - Face ID descriptions
  - App Store metadata fields

## Technical Architecture

### Backend Modules
```
/app/backend/modules/
├── ml_training.py           # ML model training scaffold
├── benzinga_integration.py  # Benzinga news API client
├── ml_prediction.py         # AI price predictions
├── trading_competition.py   # Trading competitions
├── trading_playground.py    # Paper trading
├── autonomous_bot.py        # AI trading bot
├── training_system.py       # User training
├── exchange_integration.py  # Binance adapter
├── additional_exchanges.py  # Coinbase/Kraken adapters
└── social_integration.py    # Social media integration
```

### Mobile App Structure
```
/app/mobile/
├── App.js                   # Entry point
├── app.json                 # App Store config
├── eas.json                 # EAS Build config
├── src/
│   ├── components/
│   │   ├── ui/              # GlassCard, NeonButton, PriceCard
│   │   └── QRScanner.js     # QR code scanner
│   ├── navigation/          # AppNavigator
│   ├── screens/             # 5 main screens
│   └── services/
│       ├── api.js           # API client
│       └── BiometricService.js # Biometrics
```

## API Endpoints Summary

### ML Training
- GET `/api/ml/training/status` - Training status
- GET `/api/ml/training/models` - List models
- POST `/api/ml/training/train` - Train model
- POST `/api/ml/training/predict` - Get prediction

### Benzinga News
- GET `/api/news/benzinga` - General news
- GET `/api/news/benzinga/crypto` - Crypto news
- GET `/api/news/benzinga/market-movers` - High impact
- GET `/api/news/benzinga/symbol/{symbol}` - Symbol news

### ML Predictions (existing)
- GET `/api/ml/predict/comprehensive/{symbol}`
- GET `/api/ml/predict/direction/{symbol}`
- GET `/api/ml/predict/volatility/{symbol}`
- GET `/api/ml/accuracy`

### Trading Competitions (existing)
- GET `/api/competition/active`
- POST `/api/competition/create/daily`
- POST `/api/competition/{id}/join`

## Configuration Required

### API Keys (when ready)
1. **Benzinga API** - `BENZINGA_API_KEY` for real news
2. **Coinbase API** - Exchange credentials
3. **Kraken API** - Exchange credentials
4. **Binance API** - Already supported (testnet ready)

### App Store Deployment
1. **Apple Developer** - $99/year
2. **Google Play Console** - $25 one-time
3. Update `eas.json` with credentials
4. Update `app.json` with Team IDs

## Mocked/Placeholder Features
- **Benzinga News** - Mock client active (API key not provided)
- **ML Training** - Scaffold ready (needs training data)
- **Coinbase/Kraken** - Adapters ready (keys not provided)
- **Social Media** - Simulated (Twitter/Reddit keys pending)

## Test Coverage
- Backend: 96+ pytest tests
- Latest report: `/app/test_reports/iteration_10.json`

## Future Roadmap

### P10 - Enhancements
- WebSocket real-time prices on mobile
- Push notifications (Expo Notifications)
- Offline mode with local caching
- Widget support (iOS/Android)

### P11 - Advanced ML
- TensorFlow/PyTorch model training
- Real-time model inference
- Custom strategy backtesting
- Sentiment-based trading signals

### P12 - Social Features
- Real Twitter/Reddit integration
- Social copy trading
- Community leaderboards
- Trading signals sharing

---
*Last Updated: January 21, 2026*
*Status: P9 Complete - QR Scanner, Biometrics, ML Training, Benzinga Integration, App Store Configs*
