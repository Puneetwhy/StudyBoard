import { API_BASE_URL } from '../api/axios';

/**
 * Builds the WebSocket URL for the STOMP endpoint from the configured API
 * base URL, swapping http(s) -> ws(s). Render terminates TLS automatically,
 * so in production this naturally resolves to wss://<backend>.onrender.com/ws
 * without any hardcoded scheme or host.
 */
export function getWebSocketUrl() {
  try {
    const url = new URL(API_BASE_URL);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${url.host}/ws`;
  } catch {
    // Fallback: derive from the current page location if API_BASE_URL is relative.
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}/ws`;
  }
}
