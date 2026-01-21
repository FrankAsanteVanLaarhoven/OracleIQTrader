# Oracle Trading Mobile App

React Native mobile application for the Cognitive Oracle Trading Platform.

## Tech Stack

- **Framework:** React Native with Expo
- **Navigation:** React Navigation (Bottom Tabs + Stack)
- **UI:** Custom glassmorphism components matching web app
- **Storage:** Expo SecureStore for API keys
- **API:** Connects to same backend as web app

## Features

### Core Screens

1. **Dashboard** - Portfolio overview, quick actions, market summary
2. **Markets** - Live crypto & stock prices with search/filter
3. **Trade** - Buy/Sell interface with order execution
4. **Portfolio** - Holdings, positions, trade history
5. **Settings** - Exchange API key management (Binance, Coinbase, Kraken)

### Design System

- Dark theme matching web app
- Teal accent color (#14B8A6)
- Glassmorphism cards and buttons
- Binance-inspired API key management UI

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on iOS/Android device

### Installation

```bash
cd /app/mobile
yarn install
```

### Running

```bash
# Start Expo development server
yarn start

# Or run on specific platform
yarn android
yarn ios
```

### API Configuration

The app connects to the same backend API as the web app:
- API URL: `https://smart-oracle-trade.preview.emergentagent.com/api`

### Exchange API Keys

The Settings screen allows users to configure:

1. **Binance** - Uses HMAC (API Key + Secret Key)
2. **Coinbase** - API credentials
3. **Kraken** - API credentials

Keys are stored securely using Expo SecureStore (device encryption).

**Testnet Mode:** Enabled by default for safe testing.

## Project Structure

```
/app/mobile/
├── App.js                    # Main entry point
├── app.json                  # Expo config
├── package.json              # Dependencies
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── GlassCard.js   # Glassmorphism card
│   │       ├── NeonButton.js  # Glowing button
│   │       └── PriceCard.js   # Market price display
│   ├── navigation/
│   │   └── AppNavigator.js   # Tab + Stack navigation
│   ├── screens/
│   │   ├── DashboardScreen.js
│   │   ├── MarketsScreen.js
│   │   ├── TradeScreen.js
│   │   ├── PortfolioScreen.js
│   │   └── SettingsScreen.js
│   ├── services/
│   │   └── api.js            # API service layer
│   └── theme.js              # Design tokens
└── assets/                   # App icons/images
```

## Future Enhancements

- [ ] Push notifications for price alerts
- [ ] Biometric authentication
- [ ] ML Predictions screen
- [ ] Trading competitions
- [ ] Real-time WebSocket for prices
- [ ] Offline support

## Building for Production

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

---

*Part of the Cognitive Oracle Trading Platform*
