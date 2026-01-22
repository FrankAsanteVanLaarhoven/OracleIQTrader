// Offline Cache Service - Local data persistence for offline mode
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Cache keys
const CACHE_KEYS = {
  PRICES: 'cache_prices',
  PORTFOLIO: 'cache_portfolio',
  TRADES: 'cache_trades',
  ALERTS: 'cache_alerts',
  COMPETITIONS: 'cache_competitions',
  USER_SETTINGS: 'cache_user_settings',
  LAST_SYNC: 'cache_last_sync',
};

// Cache expiry times (in milliseconds)
const CACHE_EXPIRY = {
  PRICES: 5 * 60 * 1000,        // 5 minutes
  PORTFOLIO: 10 * 60 * 1000,    // 10 minutes
  TRADES: 30 * 60 * 1000,       // 30 minutes
  ALERTS: 60 * 60 * 1000,       // 1 hour
  COMPETITIONS: 15 * 60 * 1000, // 15 minutes
  USER_SETTINGS: 24 * 60 * 60 * 1000, // 24 hours
};

export const OfflineCacheService = {
  // Network state
  isOnline: true,
  networkListeners: new Set(),

  // Initialize network monitoring
  async init() {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected;

    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected;

      // Notify listeners of connectivity change
      this.networkListeners.forEach(listener => {
        listener({ isOnline: this.isOnline, wasOnline });
      });

      // Sync data when coming back online
      if (!wasOnline && this.isOnline) {
        this.syncPendingData();
      }
    });
  },

  // Subscribe to network changes
  onNetworkChange(callback) {
    this.networkListeners.add(callback);
    return () => this.networkListeners.delete(callback);
  },

  // Generic cache set with timestamp
  async setCache(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error(`Failed to cache ${key}:`, error);
      return false;
    }
  },

  // Generic cache get with expiry check
  async getCache(key, maxAge = null) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Check if expired
      if (maxAge && Date.now() - timestamp > maxAge) {
        return { data, timestamp, expired: true };
      }

      return { data, timestamp, expired: false };
    } catch (error) {
      console.error(`Failed to get cache ${key}:`, error);
      return null;
    }
  },

  // Clear specific cache
  async clearCache(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to clear cache ${key}:`, error);
      return false;
    }
  },

  // Clear all caches
  async clearAllCaches() {
    try {
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Failed to clear all caches:', error);
      return false;
    }
  },

  // ============ PRICE CACHING ============
  async cachePrices(prices) {
    return this.setCache(CACHE_KEYS.PRICES, prices);
  },

  async getCachedPrices() {
    return this.getCache(CACHE_KEYS.PRICES, CACHE_EXPIRY.PRICES);
  },

  // ============ PORTFOLIO CACHING ============
  async cachePortfolio(portfolio) {
    return this.setCache(CACHE_KEYS.PORTFOLIO, portfolio);
  },

  async getCachedPortfolio() {
    return this.getCache(CACHE_KEYS.PORTFOLIO, CACHE_EXPIRY.PORTFOLIO);
  },

  // ============ TRADES CACHING ============
  async cacheTrades(trades) {
    return this.setCache(CACHE_KEYS.TRADES, trades);
  },

  async getCachedTrades() {
    return this.getCache(CACHE_KEYS.TRADES, CACHE_EXPIRY.TRADES);
  },

  // ============ PENDING OPERATIONS ============
  // Store operations made while offline to sync later
  async addPendingOperation(operation) {
    try {
      const pending = await AsyncStorage.getItem('pending_operations');
      const operations = pending ? JSON.parse(pending) : [];
      operations.push({
        ...operation,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem('pending_operations', JSON.stringify(operations));
      return true;
    } catch (error) {
      console.error('Failed to add pending operation:', error);
      return false;
    }
  },

  async getPendingOperations() {
    try {
      const pending = await AsyncStorage.getItem('pending_operations');
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      return [];
    }
  },

  async clearPendingOperation(id) {
    try {
      const pending = await this.getPendingOperations();
      const filtered = pending.filter(op => op.id !== id);
      await AsyncStorage.setItem('pending_operations', JSON.stringify(filtered));
      return true;
    } catch (error) {
      return false;
    }
  },

  // Sync pending operations when back online
  async syncPendingData() {
    if (!this.isOnline) return;

    const pending = await this.getPendingOperations();
    console.log(`Syncing ${pending.length} pending operations...`);

    for (const operation of pending) {
      try {
        // Execute the pending operation
        // This would call your API service
        console.log(`Syncing operation: ${operation.type}`, operation);
        
        // If successful, remove from pending
        await this.clearPendingOperation(operation.id);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
      }
    }
  },

  // ============ CACHE INFO ============
  async getCacheInfo() {
    const info = {};
    
    for (const [name, key] of Object.entries(CACHE_KEYS)) {
      const cached = await this.getCache(key);
      if (cached) {
        info[name] = {
          exists: true,
          timestamp: cached.timestamp,
          age: Date.now() - cached.timestamp,
          expired: cached.expired,
        };
      } else {
        info[name] = { exists: false };
      }
    }

    const pending = await this.getPendingOperations();
    info.pendingOperations = pending.length;
    info.isOnline = this.isOnline;

    return info;
  },
};

// React Hook for offline-aware data fetching
export function useOfflineData(fetchFn, cacheKey, maxAge) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [isOffline, setIsOffline] = useState(!OfflineCacheService.isOnline);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    // Try to get cached data first
    if (!force) {
      const cached = await OfflineCacheService.getCache(cacheKey, maxAge);
      if (cached && !cached.expired) {
        setData(cached.data);
        setIsStale(false);
        setLoading(false);
        return;
      } else if (cached) {
        // Show stale data while fetching fresh
        setData(cached.data);
        setIsStale(true);
      }
    }

    // Try to fetch fresh data if online
    if (OfflineCacheService.isOnline) {
      try {
        const freshData = await fetchFn();
        setData(freshData);
        setIsStale(false);
        await OfflineCacheService.setCache(cacheKey, freshData);
      } catch (err) {
        setError(err);
        // Keep showing stale data on error
      }
    } else {
      setIsOffline(true);
    }

    setLoading(false);
  }, [fetchFn, cacheKey, maxAge]);

  useEffect(() => {
    refresh();

    // Listen for network changes
    const unsubscribe = OfflineCacheService.onNetworkChange(({ isOnline }) => {
      setIsOffline(!isOnline);
      if (isOnline) {
        refresh(true);
      }
    });

    return unsubscribe;
  }, [refresh]);

  return { data, loading, error, isStale, isOffline, refresh };
}

export default OfflineCacheService;
