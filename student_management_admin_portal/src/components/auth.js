//
// PUBLIC_INTERFACE
// Authentication utility functions for managing user session and JWT token.
//
// Token is stored in localStorage as 'auth_token'.
// User info is stored in localStorage as 'auth_user'.
//
// Provides: login, logout, getToken, getUser, isAuthenticated, getTokenExpiry, isTokenExpired, addSessionListeners

// Utils for session keys
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// PUBLIC_INTERFACE
export function login(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// PUBLIC_INTERFACE
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// PUBLIC_INTERFACE
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// PUBLIC_INTERFACE
export function getUser() {
  const u = localStorage.getItem(USER_KEY);
  return u ? JSON.parse(u) : null;
}

// PUBLIC_INTERFACE
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  // Check expiry: if expired, log out
  if (isTokenExpired(token)) {
    logout();
    return false;
  }
  return true;
}

// PUBLIC_INTERFACE
// Parse JWT and return expiry (exp in epoch seconds) or null if bad token
export function getTokenExpiry(jwt) {
  if (!jwt) return null;
  try {
    // Split JWT: header.payload.sig
    const [, payload] = jwt.split(".");
    if (!payload) return null;
    // Decode (atob breaks on unicode, but backend tokens are ascii-safe)
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
// Return true if token is expired (expiry in past compared to now)
export function isTokenExpired(token) {
  if (!token) return true;
  const expiry = getTokenExpiry(token);
  if (!expiry) return false; // Malformed but not "expired"
  // exp is in seconds, Date.now in ms
  return expiry * 1000 <= Date.now();
}

// PUBLIC_INTERFACE
// Add session listeners for "storage" (logout from other tabs)
export function addSessionListeners(onLogout) {
  // Listen for storage events in all tabs (logout everywhere)
  window.addEventListener("storage", (e) => {
    if (e.key === TOKEN_KEY && !e.newValue) {
      if (onLogout) onLogout();
    }
  });
}
