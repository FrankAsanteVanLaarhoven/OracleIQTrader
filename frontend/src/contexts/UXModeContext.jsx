import React, { createContext, useContext, useState, useEffect } from 'react';

// UX Mode Context for Simple/Pro toggle
const UXModeContext = createContext();

export const UX_MODES = {
  SIMPLE: 'simple',
  PRO: 'pro'
};

// Features available in each mode
export const MODE_FEATURES = {
  [UX_MODES.SIMPLE]: {
    name: 'Simple Mode',
    description: 'Streamlined for beginners',
    availableAssets: ['BTC', 'ETH', 'AAPL', 'TSLA', 'SPY'],
    features: {
      basicTrading: true,
      priceAlerts: true,
      portfolio: true,
      newsStream: true,
      leverage: false,
      options: false,
      futures: false,
      advancedCharts: false,
      apiAccess: false,
      riskDashboard: false,
      copyTrading: true,
      predictionMarkets: false,
      supplyChain: false,
      quantResearch: false,
      agentBuilder: false,
    },
    maxLeverage: 1,
    defaultOrderTypes: ['market', 'limit'],
  },
  [UX_MODES.PRO]: {
    name: 'Pro Mode',
    description: 'Full institutional depth',
    availableAssets: 'all',
    features: {
      basicTrading: true,
      priceAlerts: true,
      portfolio: true,
      newsStream: true,
      leverage: true,
      options: true,
      futures: true,
      advancedCharts: true,
      apiAccess: true,
      riskDashboard: true,
      copyTrading: true,
      predictionMarkets: true,
      supplyChain: true,
      quantResearch: true,
      agentBuilder: true,
    },
    maxLeverage: 10,
    defaultOrderTypes: ['market', 'limit', 'stop', 'stop-limit', 'trailing-stop', 'iceberg'],
  }
};

// Tabs available in each mode
export const MODE_TABS = {
  [UX_MODES.SIMPLE]: [
    'dashboard',
    'portfolio',
    'wallet',
    'copy-trading',
    'alerts',
    'bot',
  ],
  [UX_MODES.PRO]: [
    'dashboard',
    'agents',
    'agent-builder',
    'portfolio',
    'wallet',
    'copy-trading',
    'bot',
    'alerts',
    'orders',
    'pricing',
    'audit-trail',
    'risk',
    'playground',
    'prediction-markets',
    'supply-chain',
    'quantitative',
    'training',
    'ml-predictions',
    'tournament',
    'competitions',
    'avatar',
    'crawler',
    'journal',
    'leaderboard',
    'sentiment',
    'benzinga',
    'settings',
  ]
};

export const UXModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('uxMode');
    return saved || UX_MODES.SIMPLE;
  });

  useEffect(() => {
    localStorage.setItem('uxMode', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(prev => prev === UX_MODES.SIMPLE ? UX_MODES.PRO : UX_MODES.SIMPLE);
  };

  const isFeatureEnabled = (feature) => {
    return MODE_FEATURES[mode].features[feature] ?? false;
  };

  const isTabAvailable = (tabId) => {
    return MODE_TABS[mode].includes(tabId);
  };

  const getAvailableTabs = () => {
    return MODE_TABS[mode];
  };

  const getModeConfig = () => {
    return MODE_FEATURES[mode];
  };

  return (
    <UXModeContext.Provider value={{
      mode,
      setMode,
      toggleMode,
      isSimpleMode: mode === UX_MODES.SIMPLE,
      isProMode: mode === UX_MODES.PRO,
      isFeatureEnabled,
      isTabAvailable,
      getAvailableTabs,
      getModeConfig,
      modeConfig: MODE_FEATURES[mode],
    }}>
      {children}
    </UXModeContext.Provider>
  );
};

export const useUXMode = () => {
  const context = useContext(UXModeContext);
  if (!context) {
    throw new Error('useUXMode must be used within UXModeProvider');
  }
  return context;
};

export default UXModeContext;
