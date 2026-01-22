// Widget Configuration for iOS and Android Home Screen Widgets
// Note: Actual widget implementation requires native code
// This file provides the data layer and configuration

import AsyncStorage from '@react-native-async-storage/async-storage';

const WIDGET_DATA_KEY = 'widget_data';
const WIDGET_CONFIG_KEY = 'widget_config';

// Widget types available
export const WIDGET_TYPES = {
  PRICE_SINGLE: 'price_single',      // Single coin price
  PRICE_MULTI: 'price_multi',        // Multiple coins
  PORTFOLIO_SUMMARY: 'portfolio',     // Portfolio value
  WATCHLIST: 'watchlist',            // Watchlist prices
  MARKET_OVERVIEW: 'market',         // Market summary
};

// Widget sizes
export const WIDGET_SIZES = {
  SMALL: 'small',   // 2x2
  MEDIUM: 'medium', // 4x2
  LARGE: 'large',   // 4x4
};

// Default widget configurations
const DEFAULT_WIDGET_CONFIGS = {
  [WIDGET_TYPES.PRICE_SINGLE]: {
    symbol: 'BTC',
    showChange: true,
    showChart: false,
    refreshInterval: 60, // seconds
  },
  [WIDGET_TYPES.PRICE_MULTI]: {
    symbols: ['BTC', 'ETH', 'SOL'],
    showChange: true,
    maxSymbols: 4,
    refreshInterval: 60,
  },
  [WIDGET_TYPES.PORTFOLIO_SUMMARY]: {
    showPositions: true,
    showChange: true,
    refreshInterval: 300,
  },
  [WIDGET_TYPES.WATCHLIST]: {
    symbols: ['BTC', 'ETH', 'SOL', 'XRP'],
    sortBy: 'change', // 'change', 'price', 'name'
    refreshInterval: 60,
  },
  [WIDGET_TYPES.MARKET_OVERVIEW]: {
    showTopGainers: true,
    showTopLosers: true,
    showVolume: true,
    refreshInterval: 300,
  },
};

export const WidgetService = {
  // Get widget configuration
  async getConfig(widgetType) {
    try {
      const stored = await AsyncStorage.getItem(WIDGET_CONFIG_KEY);
      const configs = stored ? JSON.parse(stored) : {};
      return configs[widgetType] || DEFAULT_WIDGET_CONFIGS[widgetType];
    } catch {
      return DEFAULT_WIDGET_CONFIGS[widgetType];
    }
  },

  // Save widget configuration
  async saveConfig(widgetType, config) {
    try {
      const stored = await AsyncStorage.getItem(WIDGET_CONFIG_KEY);
      const configs = stored ? JSON.parse(stored) : {};
      configs[widgetType] = { ...DEFAULT_WIDGET_CONFIGS[widgetType], ...config };
      await AsyncStorage.setItem(WIDGET_CONFIG_KEY, JSON.stringify(configs));
      
      // Trigger widget refresh
      await this.triggerWidgetRefresh(widgetType);
      return true;
    } catch (error) {
      console.error('Failed to save widget config:', error);
      return false;
    }
  },

  // Update widget data (called periodically)
  async updateWidgetData(data) {
    try {
      const widgetData = {
        prices: data.prices || {},
        portfolio: data.portfolio || null,
        lastUpdate: Date.now(),
      };
      await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));
      
      // In a real implementation, this would use native modules to update widgets
      // iOS: WidgetKit reloadTimelines
      // Android: AppWidgetManager updateAppWidget
      
      return true;
    } catch (error) {
      console.error('Failed to update widget data:', error);
      return false;
    }
  },

  // Get widget data
  async getWidgetData() {
    try {
      const stored = await AsyncStorage.getItem(WIDGET_DATA_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // Trigger widget refresh (native implementation needed)
  async triggerWidgetRefresh(widgetType = null) {
    // This is a placeholder for native module calls
    // In production, you would use:
    // iOS: expo-widgets or react-native-widget-extension
    // Android: Native module with AppWidgetProvider
    
    console.log('Widget refresh triggered:', widgetType || 'all');
    return true;
  },

  // Format data for widget display
  formatPriceForWidget(price) {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}K`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  },

  formatChangeForWidget(change) {
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(2)}%`;
  },

  formatPortfolioForWidget(value) {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  },

  // Generate widget preview data
  getPreviewData(widgetType) {
    switch (widgetType) {
      case WIDGET_TYPES.PRICE_SINGLE:
        return {
          symbol: 'BTC',
          price: '$98,432.50',
          change: '+2.34%',
          isPositive: true,
        };
      case WIDGET_TYPES.PRICE_MULTI:
        return {
          prices: [
            { symbol: 'BTC', price: '$98,432', change: '+2.3%', isPositive: true },
            { symbol: 'ETH', price: '$3,245', change: '-1.2%', isPositive: false },
            { symbol: 'SOL', price: '$187.50', change: '+5.8%', isPositive: true },
          ],
        };
      case WIDGET_TYPES.PORTFOLIO_SUMMARY:
        return {
          totalValue: '$125,432.50',
          change: '+$2,340.50',
          changePercent: '+1.9%',
          isPositive: true,
        };
      default:
        return {};
    }
  },
};

// Widget setup instructions for native implementation
export const WIDGET_SETUP_INSTRUCTIONS = {
  ios: `
## iOS Widget Setup (requires Xcode)

1. Open the iOS project in Xcode
2. Add a Widget Extension target
3. Create widget views using SwiftUI
4. Use App Groups to share data between app and widget
5. Implement WidgetKit timeline provider

### Files to create:
- OracleTradingWidget.swift (Widget definition)
- PriceWidgetView.swift (UI)
- PortfolioWidgetView.swift (UI)
- WidgetDataProvider.swift (Data fetching)

### Info.plist additions:
- NSWidgetWantsLocation (if using location)
- App Groups entitlement
`,
  android: `
## Android Widget Setup

1. Create AppWidgetProvider class
2. Add widget layout XML files
3. Register in AndroidManifest.xml
4. Create widget configuration activity

### Files to create:
- PriceWidgetProvider.kt
- PortfolioWidgetProvider.kt
- widget_price.xml (layout)
- widget_portfolio.xml (layout)
- widget_info.xml (metadata)

### AndroidManifest.xml additions:
<receiver android:name=".widgets.PriceWidgetProvider">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_price_info" />
</receiver>
`,
};

export default WidgetService;
