import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ 
          padding: '1rem 2rem', 
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Platform Overview</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>v0.1.0-dev</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#e2e8f0' }}></div>
          </div>
        </header>
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
