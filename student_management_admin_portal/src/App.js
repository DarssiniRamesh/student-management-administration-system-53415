import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import './App.css';
import Layout from './components/Layout';
import Login from './components/Login';
import { login, logout, getToken, getUser, isAuthenticated } from './components/auth';

import OperatorsPage from "./components/OperatorsPage";
import SystemParamsPage from "./components/SystemParamsPage";
// Placeholder page components for the initial scaffold
function StatusPage() {
  return (
    <section>
      <h2>Status</h2>
      <p>Placeholder for status dashboard.</p>
    </section>
  );
}

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
    } else {
      setLoginError(errMsg || "Login failed");
      setAuthToken(null);
      setAuthUser(null);
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
          </span>
        )}
      </div>
    );

    // Auth routes: /login is public, everything else protected
    return (
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
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="*" element={<OperatorsPage />} /> {/* Default route */}
                </Routes>
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
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
