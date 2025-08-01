import React from 'react';
import Sidebar from './Sidebar';

/**
 * PUBLIC_INTERFACE
 * Dashboard layout with Sidebar and main content.
 * @param {React.ReactNode} children - The routed page/content to render
 * @param {String} activePath - current route
 * @param {Function} onNavigate - navigation handler
 */
function Layout({ children, activePath, onNavigate }) {
  // Sidebar nav items
  const sidebarLinks = [
    { label: 'Operators', path: '/operators' },
    { label: 'System Params', path: '/system-params' },
    { label: 'Status', path: '/status' }
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar links={sidebarLinks} activePath={activePath} onNavigate={onNavigate} />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}

export default Layout;
