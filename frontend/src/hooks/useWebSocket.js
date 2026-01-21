import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  const { 
    onMessage, 
    onConnect, 
    onDisconnect, 
    reconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 3000
  } = options;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Convert HTTP URL to WebSocket URL
      const wsUrl = url.replace('https://', 'wss://').replace('http://', 'ws://');
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
          onMessage?.(parsed);
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      };

      wsRef.current.onerror = (event) => {
        setError('WebSocket connection error');
        console.error('WebSocket error:', event);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();

        // Attempt reconnection
        if (reconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (err) {
      setError(err.message);
    }
  }, [url, onConnect, onDisconnect, onMessage, reconnect, maxReconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    sendMessage,
    connect,
    disconnect
  };
};

export default useWebSocket;
