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
5. **Settings** - Exchange API key management with QR scanner

### Security Features

- **QR Code Scanner** - Import API keys by scanning Binance/Coinbase/Kraken QR codes
- **Biometric Auth** - Face ID / Fingerprint protection for sensitive operations
- **Secure Storage** - API keys encrypted using device-level security
- **Testnet Mode** - Safe paper trading by default

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
- EAS CLI for builds: `npm install -g eas-cli`

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

## Building for App Store / Play Store

### Prerequisites

1. **Apple Developer Account** ($99/year) - Required for iOS
2. **Google Play Console** ($25 one-time) - Required for Android
3. **EAS Account** - `eas login`

### Configure EAS

1. Update `eas.json` with your credentials
2. Update `app.json` with your Apple Team ID and project ID

### Build Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## API Configuration

The app connects to the same backend API as the web app:
- API URL: `https://smart-trade-app-10.preview.emergentagent.com/api`

### Exchange API Keys

The Settings screen allows users to configure:

1. **Binance** - HMAC (API Key + Secret Key) or Ed25519
2. **Coinbase** - API credentials
3. **Kraken** - API key/private key

**Import Methods:**
- Manual entry
- QR Code scanning (recommended)

**Security:**
- Keys stored using Expo SecureStore (device encryption)
- Biometric authentication for sensitive operations
- Testnet mode by default

## Project Structure

```
/app/mobile/
├── App.js                    # Main entry point
├── app.json                  # Expo config (App Store metadata)
├── eas.json                  # EAS Build config
├── package.json              # Dependencies
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── GlassCard.js   # Glassmorphism card
│   │   │   ├── NeonButton.js  # Glowing button
│   │   │   └── PriceCard.js   # Market price display
│   │   └── QRScanner.js       # API key QR scanner
│   ├── navigation/
│   │   └── AppNavigator.js   # Tab + Stack navigation
│   ├── screens/
│   │   ├── DashboardScreen.js
│   │   ├── MarketsScreen.js
│   │   ├── TradeScreen.js
│   │   ├── PortfolioScreen.js
│   │   └── SettingsScreen.js
│   ├── services/
│   │   ├── api.js            # API service layer
│   │   └── BiometricService.js # Biometric auth
│   └── theme.js              # Design tokens
├── assets/                   # App icons/images
└── README.md
```

## Environment Variables

Create a `.env` file (optional for custom API URL):

```env
API_BASE_URL=https://your-api-url.com/api
```

## App Store Submission Checklist

### iOS (App Store)
- [ ] App icon (1024x1024)
- [ ] Screenshots (6.5", 5.5", 12.9" iPad)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating
- [ ] Apple Developer account configured

### Android (Play Store)
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone, tablet)
- [ ] App description (short + full)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Google Play Console configured

## Troubleshooting

### QR Scanner not working
- Ensure camera permission is granted
- Check that the QR code contains valid JSON with `apiKey` and `secretKey` fields

### Biometrics not available
- Ensure device has Face ID/Touch ID or fingerprint enrolled
- Check device security settings

### API connection issues
- Verify network connectivity
- Check if backend URL is correct
- Ensure CORS is configured for mobile requests

---

*Part of the Cognitive Oracle Trading Platform*
