// Expo app configuration with environment variables
export default {
  expo: {
    name: "OracleIQTrader",
    slug: "oracleiq-trader",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#050505"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.oracleiqtrader.app",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to scan QR codes for API key import.",
        NSFaceIDUsageDescription: "This app uses Face ID for secure authentication.",
        UIBackgroundModes: ["fetch", "remote-notification"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#050505"
      },
      package: "com.oracleiqtrader.app",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-camera",
      "expo-local-authentication",
      "expo-secure-store"
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_BACKEND_URL || "https://smart-trade-agents-1.preview.emergentagent.com/api",
      wsUrl: process.env.EXPO_PUBLIC_WS_URL || "wss://oracleiq-trader.preview.emergentagent.com"
    }
  }
};
