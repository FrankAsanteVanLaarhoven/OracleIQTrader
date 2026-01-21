# Cognitive Oracle Trading Platform

A state-of-the-art AI-powered trading platform with glassmorphism UI, voice commands, facial recognition, and multi-exchange support.

## 🚀 Features

### Trading Features
- **Paper Trading Playground** - $100k virtual money for practice
- **Autonomous AI Bot** - Configure strategies (Conservative/Moderate/Aggressive)
- **ML Predictions** - AI-powered price, volatility, and trend forecasts
- **Trading Competitions** - Daily challenges, weekly tournaments, themed events
- **Social Signals** - Twitter/Reddit sentiment analysis

### Advanced UI
- **3D Trading Avatar** - Real-time facial tracking with webcam
- **Voice Commands** - Hands-free trading
- **Glassmorphism Design** - Modern dark theme
- **Multi-language Support** - i18n ready

### Exchange Integrations
- **Binance** - Full trading support (testnet/mainnet)
- **Coinbase Pro** - Account balance, orders, trades
- **Kraken** - Full API integration

### Mobile App
- React Native + Expo
- QR Code scanner for API key import
- Biometric authentication (Face ID/Fingerprint)
- Matches web app design

## 📁 Project Structure

```
/app/
├── backend/                    # FastAPI Backend
│   ├── server.py              # Main server
│   ├── modules/               # Feature modules
│   │   ├── ml_prediction.py
│   │   ├── ml_training.py
│   │   ├── trading_playground.py
│   │   ├── autonomous_bot.py
│   │   ├── trading_competition.py
│   │   ├── benzinga_integration.py
│   │   ├── exchange_integration.py
│   │   ├── additional_exchanges.py
│   │   └── social_integration.py
│   ├── .env                   # Environment variables
│   ├── .env.example           # Template
│   └── requirements.txt
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # 50+ components
│   │   ├── contexts/          # Auth, Theme
│   │   └── App.js
│   ├── .env
│   └── package.json
├── mobile/                     # React Native App
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   └── services/
│   ├── app.json               # Expo config
│   ├── eas.json               # Build config
│   └── package.json
└── memory/
    └── PRD.md                 # Product requirements
```

## 🔧 Local Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB
- Expo CLI (for mobile)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Run server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Configure environment
# Edit .env with your backend URL

# Run development server
yarn start
```

### Mobile Setup

```bash
cd mobile

# Install dependencies
yarn install

# Start Expo
yarn start

# Scan QR with Expo Go app
```

## 🔑 API Keys Configuration

Edit `/backend/.env` with your keys:

### Required
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=oracle_trading
EMERGENT_LLM_KEY=your_key  # For AI voice features
```

### Exchange APIs
```env
# Binance (https://www.binance.com/en/my/settings/api-management)
BINANCE_API_KEY=your_key
BINANCE_SECRET_KEY=your_secret
BINANCE_TESTNET=true  # Set false for live trading

# Coinbase (https://www.coinbase.com/settings/api)
COINBASE_API_KEY=your_key
COINBASE_SECRET_KEY=your_secret
COINBASE_PASSPHRASE=your_passphrase
COINBASE_TESTNET=true

# Kraken (https://www.kraken.com/u/settings/api)
KRAKEN_API_KEY=your_key
KRAKEN_PRIVATE_KEY=your_private_key
KRAKEN_TESTNET=true
```

### News & Data
```env
# Benzinga (https://www.benzinga.com/apis/)
BENZINGA_API_KEY=your_key
```

### Social Media (Optional)
```env
TWITTER_BEARER_TOKEN=your_token
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
```

## 📱 Mobile App Deployment

### Build for App Stores

```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Configure `app.json`
Update these fields before building:
- `ios.bundleIdentifier`
- `android.package`
- `extra.eas.projectId`
- `owner`

### Configure `eas.json`
Update submit credentials:
- `ios.appleId`
- `ios.ascAppId`
- `ios.appleTeamId`
- `android.serviceAccountKeyPath`

## 🧪 API Endpoints

### Market Data
- `GET /api/market/prices` - All prices
- `GET /api/market/{symbol}` - Single price
- `GET /api/market/{symbol}/history` - Price history

### Trading
- `POST /api/trades/execute` - Execute trade
- `GET /api/trades/history` - Trade history

### Exchange Management
- `GET /api/exchanges/status` - All exchange status
- `GET /api/exchanges/{exchange}/balance` - Get balance
- `POST /api/exchanges/{exchange}/order` - Place order
- `GET /api/exchanges/{exchange}/orders` - Get orders
- `DELETE /api/exchanges/{exchange}/order/{id}` - Cancel order

### ML Predictions
- `GET /api/ml/predict/comprehensive/{symbol}` - Full prediction
- `GET /api/ml/predict/direction/{symbol}` - Direction only
- `GET /api/ml/training/status` - Training status
- `POST /api/ml/training/train` - Train model

### News
- `GET /api/news/benzinga` - All news
- `GET /api/news/benzinga/crypto` - Crypto news
- `GET /api/news/benzinga/symbol/{symbol}` - Symbol news

### Competitions
- `GET /api/competition/active` - Active competitions
- `POST /api/competition/{id}/join` - Join competition
- `GET /api/competition/{id}/leaderboard` - Leaderboard

## 📦 Download Project

### Option 1: GitHub (Recommended)
Use the **"Save to GitHub"** button in the Emergent chat input to push the code to your repository.

### Option 2: Direct Download
Click the **Download** button in Emergent to get a ZIP file of the project.

## 🔒 Security Notes

1. **Never commit .env files** - Use .env.example as template
2. **Use Testnet first** - All exchanges default to testnet
3. **API Key Permissions** - Use read-only or trade-only permissions
4. **IP Whitelist** - Enable on exchanges when possible
5. **Mobile Security** - API keys encrypted with device security

## 📄 License

MIT License

---

Built with ❤️ using React, FastAPI, and Expo
