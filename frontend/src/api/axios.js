import axios from 'axios';
import { emitUnauthorized } from '../utils/authEvents';

// Build-time env var set in Render's Static Site environment settings.
// Never hardcode localhost here.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  // Render free-tier backends sleep after inactivity; first request after
  // a cold start can take 20-30s to wake up. Give it real room.
  timeout: 35000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyboard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only treat a genuine "your session is invalid" (401) as a logout signal.
    // A 403 (e.g. "only the room creator can do this") is a permission error
    // on an otherwise valid session and must NOT log the user out.
    if (error.response?.status === 401) {
      localStorage.removeItem('studyboard_token');
      localStorage.removeItem('studyboard_user');
      emitUnauthorized(); // tells AuthContext to sync its in-memory user state to null
    }
    return Promise.reject(error);
  }
);

export default api;