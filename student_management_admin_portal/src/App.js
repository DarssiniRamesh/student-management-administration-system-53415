import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import './App.css';
import Layout from './components/Layout';

// Placeholder page components for the initial scaffold
function OperatorsPage() {
  return (
    <section>
      <h2>Operators</h2>
      <p>Placeholder for managing operators.</p>
    </section>
  );
}
function SystemParamsPage() {
  return (
    <section>
      <h2>System Parameters</h2>
      <p>Placeholder for backend configuration parameters.</p>
    </section>
  );
}
function StatusPage() {
  return (
    <section>
      <h2>Status</h2>
      <p>Placeholder for status dashboard.</p>
    </section>
  );
}

/**
 * PUBLIC_INTERFACE
 * Main application - handles theme and routing
 */
function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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

    return (
      <Layout activePath={location.pathname} onNavigate={handleNavigate}>
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <Routes>
          <Route path="/operators" element={<OperatorsPage />} />
          <Route path="/system-params" element={<SystemParamsPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="*" element={<OperatorsPage />} /> {/* Default route */}
        </Routes>
      </Layout>
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
