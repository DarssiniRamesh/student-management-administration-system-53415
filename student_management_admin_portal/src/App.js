import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import './App.css';
import Layout from './components/Layout';
import Login from './components/Login';
import { login, logout, getToken, getUser, isAuthenticated, isTokenExpired, addSessionListeners, getTokenExpiry } from './components/auth';

import OperatorsPage from "./components/OperatorsPage";
import SystemParamsPage from "./components/SystemParamsPage";
import SystemStatusPage from "./components/SystemStatusPage";

// PUBLIC_INTERFACE
// Simple protected-route wrapper for dashboard section
function RequireAuth({ children }) {
  if (!isAuthenticated()) {
    // Not logged in -- show login screen
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * PUBLIC_INTERFACE
 * Main application - handles theme, routing and authentication state
 */
function App() {
  const [theme, setTheme] = useState('light');
  const [authToken, setAuthToken] = useState(getToken());
  const [authUser, setAuthUser] = useState(getUser());
  const [loginError, setLoginError] = useState(null);
  const [expiryNotice, setExpiryNotice] = useState(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-logout on token expiry (interval timer)
  useEffect(() => {
    let intervalId = null;
    function checkExpiry() {
      const tok = getToken();
      if (tok && isTokenExpired(tok)) {
        setExpiryNotice("Session expired. Please log in again.");
        handleLogout();
      }
    }
    // Check expiry every 10 seconds
    if (authToken) {
      intervalId = setInterval(checkExpiry, 10000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
    // eslint-disable-next-line
  }, [authToken]);

  // Storage event to sync sessions (logout in all tabs)
  useEffect(() => {
    addSessionListeners(() => {
      setAuthToken(null);
      setAuthUser(null);
      setExpiryNotice("You were logged out in another tab. Please log in again.");
    });
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Only show login if not authenticated
  // On login, save token/user to memory and localStorage
  const handleLogin = (token, user, errMsg = null) => {
    if (token) {
      login(token, user);
      setAuthToken(token);
      setAuthUser(user);
      setLoginError(null);
      setExpiryNotice(null);
    } else {
      setLoginError(errMsg || "Login failed");
      setAuthToken(null);
      setAuthUser(null);
      setExpiryNotice(null);
      logout();
    }
  };

  // Session logout handler
  const handleLogout = () => {
    logout();
    setAuthToken(null);
    setAuthUser(null);
  };

  // React Router context-aware handler
  function AppWithRouter() {
    const location = useLocation();
    const navigate = useNavigate();

    // Sidebar navigation callback
    const handleNavigate = useCallback(
      (path) => { if (path !== location.pathname) navigate(path); },
      [navigate, location.pathname]
    );

    // Custom topbar: shows logout/user if authenticated
    const renderTopbar = () => (
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        marginBottom: 8, gap: 10
      }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        {isAuthenticated() &&
          <button
            style={{
              background: '#ff9800',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 15,
              padding: '8px 20px',
              cursor: 'pointer',
              marginLeft: 20
            }}
            onClick={handleLogout}
            aria-label="Logout"
            data-testid="logout-btn"
          >
            Log out
          </button>
        }
        {isAuthenticated() && (
          <span style={{
            color: '#1976d2',
            fontWeight: 500,
            fontSize: 15,
            marginLeft: 14
          }}>
            {authUser?.email}
            {/* Session expiry display */}
            <span style={{
              marginLeft: 14,
              color: "#888",
              fontSize: 13,
              fontWeight: 400
            }}>
              {authToken && getTokenExpiry(authToken)
                ? `Expires in ${Math.max(0, Math.floor(getTokenExpiry(authToken) - Date.now() / 1000))}s`
                : null}
            </span>
          </span>
        )}
      </div>
    );

    // Auth routes: /login is public, everything else protected
    return (
      <>
        {/* Expiry or session alert */}
        {expiryNotice && (
          <div style={{
            background: "#fffbe8",
            border: "1.5px solid #ff9800",
            color: "#6d4800",
            fontWeight: 600,
            fontSize: 15,
            padding: "12px 25px",
            borderRadius: 7,
            textAlign: "center",
            maxWidth: 440,
            margin: "24px auto 8px auto"
          }}>
            {expiryNotice}
          </div>
        )}
        <Routes>
          <Route path="/login"
            element={
              isAuthenticated()
                ? <Navigate to="/operators" replace />
                : <Login onLogin={handleLogin} error={loginError} />
            }
          />
          <Route
            path="*"
            element={
              <RequireAuth>
                <Layout activePath={location.pathname} onNavigate={handleNavigate}>
                  {renderTopbar()}
                  <Routes>
                    <Route path="/operators" element={<OperatorsPage />} />
                    <Route path="/system-params" element={<SystemParamsPage />} />
                    <Route path="/status" element={<SystemStatusPage />} />
                    <Route path="*" element={<OperatorsPage />} /> {/* Default route */}
                  </Routes>
                </Layout>
              </RequireAuth>
            }
          />
        </Routes>
      </>
    );
  }

  return (
    <div className="App">
      <Router>
        <AppWithRouter />
      </Router>
    </div>
  );
}

export default App;
