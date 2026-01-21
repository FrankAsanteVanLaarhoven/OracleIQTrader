// API Service for Oracle Trading Mobile App
import axios from 'axios';

// Backend API URL - same as web app
const API_BASE_URL = 'https://smart-oracle-trade.preview.emergentagent.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Market Data
export const marketService = {
  getPrices: () => api.get('/market/prices'),
  getPrice: (symbol) => api.get(`/market/${symbol}`),
  getPriceHistory: (symbol, periods = 50) => 
    api.get(`/market/${symbol}/history?periods=${periods}`),
};

// Portfolio
export const portfolioService = {
  getSummary: () => api.get('/portfolio/summary'),
};

// Trading
export const tradingService = {
  executeTrade: (action, symbol, quantity) => 
    api.post(`/trades/execute?action=${action}&symbol=${symbol}&quantity=${quantity}`),
  getHistory: (limit = 20) => api.get(`/trades/history?limit=${limit}`),
};

// Playground (Paper Trading)
export const playgroundService = {
  createAccount: (data) => api.post('/playground/account', data),
  getAccount: (accountId) => api.get(`/playground/account/${accountId}`),
  placeOrder: (data) => api.post('/playground/order', data),
  resetAccount: (accountId) => api.post(`/playground/reset/${accountId}`),
  getLeaderboard: () => api.get('/playground/leaderboard'),
};

// ML Predictions
export const mlService = {
  getComprehensive: (symbol, horizon = '24h') => 
    api.get(`/ml/predict/comprehensive/${symbol}?horizon=${horizon}`),
  getDirection: (symbol, horizon = '24h') => 
    api.get(`/ml/predict/direction/${symbol}?horizon=${horizon}`),
  getVolatility: (symbol, horizon = '24h') => 
    api.get(`/ml/predict/volatility/${symbol}?horizon=${horizon}`),
  getAccuracy: () => api.get('/ml/accuracy'),
};

// Competitions
export const competitionService = {
  getActive: () => api.get('/competition/active'),
  getCompetition: (id) => api.get(`/competition/${id}`),
  join: (id) => api.post(`/competition/${id}/join`),
  getLeaderboard: (id) => api.get(`/competition/${id}/leaderboard`),
  getUserStats: () => api.get('/competition/user/stats'),
  getGlobalLeaderboard: () => api.get('/competition/global/leaderboard'),
};

// Alerts
export const alertService = {
  getAlerts: () => api.get('/alerts'),
  createAlert: (data) => api.post('/alerts', data),
  deleteAlert: (id) => api.delete(`/alerts/${id}`),
};

// Crawler Signals
export const signalService = {
  getSignals: (limit = 50) => api.get(`/crawler/signals?limit=${limit}`),
  getWhales: (limit = 20) => api.get(`/crawler/whales?limit=${limit}`),
  getNews: (limit = 20) => api.get(`/crawler/news?limit=${limit}`),
};

// Bot
export const botService = {
  create: (data) => api.post('/bot/create', data),
  get: (id) => api.get(`/bot/${id}`),
  setMode: (id, mode) => api.post(`/bot/${id}/mode?mode=${mode}`),
  analyze: (id) => api.post(`/bot/${id}/analyze`),
  getPerformance: (id) => api.get(`/bot/${id}/performance`),
  getSignals: (id) => api.get(`/bot/${id}/signals`),
};

export default api;
