import React from 'react';

// PUBLIC_INTERFACE
function Sidebar({ links = [], activePath, onNavigate }) {
  /**
   * Sidebar component for dashboard navigation
   * @param {Array} links - List of navigation links (label, route)
   * @param {String} activePath - currently active route path
   * @param {Function} onNavigate - navigation handler for click events
   */
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Admin Portal</span>
      </div>
      <ul className="sidebar-nav">
        {links.map(link => (
          <li 
            key={link.path}
            className={activePath === link.path ? "sidebar-link active" : "sidebar-link"}
            onClick={() => onNavigate(link.path)}
            tabIndex={0}
            aria-current={activePath === link.path ? "page" : undefined}
          >
            {link.label}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;
