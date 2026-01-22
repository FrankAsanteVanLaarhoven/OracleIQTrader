// WebSocket Service for Real-time Price Updates
import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WS_URL = 'wss://smart-oracle-trade.preview.emergentagent.com/ws/prices';
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

// Price cache for offline mode
const PRICE_CACHE_KEY = 'cached_prices';
const PRICE_CACHE_TIMESTAMP_KEY = 'cached_prices_timestamp';

export class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.prices = {};
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyListeners('connection', { connected: true });
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'prices') {
            this.prices = data.prices;
            this.notifyListeners('prices', data.prices);
            
            // Cache prices for offline mode
            await this.cachePrices(data.prices);
          } else if (data.type === 'price_update') {
            this.prices[data.symbol] = data.price;
            this.notifyListeners('price_update', { symbol: data.symbol, price: data.price });
          } else if (data.type === 'alert') {
            this.notifyListeners('alert', data);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyListeners('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.notifyListeners('connection', { connected: false });
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
    
    setTimeout(() => {
      this.connect();
    }, RECONNECT_INTERVAL);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  async cachePrices(prices) {
    try {
      await AsyncStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(prices));
      await AsyncStorage.setItem(PRICE_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to cache prices:', error);
    }
  }

  async getCachedPrices() {
    try {
      const cached = await AsyncStorage.getItem(PRICE_CACHE_KEY);
      const timestamp = await AsyncStorage.getItem(PRICE_CACHE_TIMESTAMP_KEY);
      
      if (cached) {
        return {
          prices: JSON.parse(cached),
          timestamp: timestamp ? parseInt(timestamp) : null,
          isCached: true,
        };
      }
    } catch (error) {
      console.error('Failed to get cached prices:', error);
    }
    return null;
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // Subscribe to specific symbols
  subscribeToSymbols(symbols) {
    this.send({ type: 'subscribe', symbols });
  }

  // Unsubscribe from symbols
  unsubscribeFromSymbols(symbols) {
    this.send({ type: 'unsubscribe', symbols });
  }
}

// Singleton instance
export const wsService = new WebSocketService();

// React Hook for WebSocket prices
export function useWebSocketPrices(symbols = []) {
  const [prices, setPrices] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    // Load cached prices first
    wsService.getCachedPrices().then(cached => {
      if (cached) {
        setPrices(cached.prices);
        setLastUpdate(cached.timestamp);
        setIsCached(true);
      }
    });

    // Connect to WebSocket
    wsService.connect();

    // Subscribe to events
    const unsubPrices = wsService.subscribe('prices', (newPrices) => {
      setPrices(newPrices);
      setLastUpdate(Date.now());
      setIsCached(false);
    });

    const unsubUpdate = wsService.subscribe('price_update', ({ symbol, price }) => {
      setPrices(prev => ({ ...prev, [symbol]: price }));
      setLastUpdate(Date.now());
      setIsCached(false);
    });

    const unsubConnection = wsService.subscribe('connection', ({ connected }) => {
      setIsConnected(connected);
    });

    // Subscribe to specific symbols if provided
    if (symbols.length > 0) {
      wsService.subscribeToSymbols(symbols);
    }

    return () => {
      unsubPrices();
      unsubUpdate();
      unsubConnection();
    };
  }, [symbols.join(',')]);

  return { prices, isConnected, lastUpdate, isCached };
}

export default wsService;
