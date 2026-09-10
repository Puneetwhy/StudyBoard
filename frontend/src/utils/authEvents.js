// Tiny event bus so the axios interceptor (a plain module, no React state)
// can tell AuthContext "the token was rejected" without them fighting over
// localStorage independently — that mismatch was causing the app to bounce
// back to the login page unexpectedly after actions like creating/joining a room.
const listeners = new Set();

export function onUnauthorized(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function emitUnauthorized() {
  listeners.forEach((cb) => cb());
}