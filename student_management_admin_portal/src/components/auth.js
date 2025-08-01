//
// PUBLIC_INTERFACE
// Authentication utility functions for managing user session and JWT token.
//
// Token is stored in localStorage as 'auth_token'.
// User info is stored in localStorage as 'auth_user'.
//
// Provides: login, logout, getToken, getUser, isAuthenticated
//

// Save token and user in local storage
export function login(token, user) {
  if (token) localStorage.setItem("auth_token", token);
  if (user) localStorage.setItem("auth_user", JSON.stringify(user));
}

// Remove token/user from storage
export function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

// Get JWT token from local storage
export function getToken() {
  return localStorage.getItem("auth_token");
}

// Get user info from local storage (returns object or null)
export function getUser() {
  const u = localStorage.getItem("auth_user");
  return u ? JSON.parse(u) : null;
}

// Returns true if authenticated
export function isAuthenticated() {
  return !!getToken();
}
