import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { getWebSocketUrl } from '../utils/ws';

/**
 * Manages a single STOMP client connection per room. Subscriptions are
 * registered via subscribe() and torn down automatically on unmount.
 * Reconnects automatically (useful after a Render cold-start hiccup).
 */
export function useStompClient() {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const pendingSubs = useRef([]);

  useEffect(() => {
    const token = localStorage.getItem('studyboard_token');
    const client = new Client({
      brokerURL: getWebSocketUrl(),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        // Flush any subscriptions requested before the socket was ready.
        pendingSubs.current.forEach(({ destination, callback }) => {
          client.subscribe(destination, (message) => callback(JSON.parse(message.body)));
        });
        pendingSubs.current = [];
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers?.message, frame.body);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, []);

  const subscribe = useCallback((destination, callback) => {
    const client = clientRef.current;
    if (client && client.connected) {
      return client.subscribe(destination, (message) => callback(JSON.parse(message.body)));
    }
    // Queue it — onConnect will subscribe once the socket is ready.
    pendingSubs.current.push({ destination, callback });
    return null;
  }, []);

  const publish = useCallback((destination, body) => {
    const client = clientRef.current;
    if (client && client.connected) {
      client.publish({ destination, body: JSON.stringify(body) });
    }
  }, []);

  return { connected, subscribe, publish };
}
