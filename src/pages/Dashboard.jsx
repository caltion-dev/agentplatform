import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [counts, setCounts] = useState({ agents: 0, llms: 0, tokens: '0' });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/models');
        const data = await res.json();
        setCounts(prev => ({ ...prev, llms: data.length }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchCounts();
  }, []);

  const stats = [
    { title: 'Total Agents', value: counts.agents.toString() },
    { title: 'Models Configured', value: counts.llms.toString() },
    { title: 'Storage Schema', value: 'Desarrollo' },
    { title: 'API Status', value: 'Online' },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 700 }}>Dashboard</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {stats.map((stat) => (
          <div key={stat.title} className="card">
            <div className="card-title">{stat.title}</div>
            <div className="card-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ minHeight: '300px' }}>
        <div style={{ marginBottom: '1rem', fontWeight: 600 }}>Platform Activity</div>
        <div style={{ 
          width: '100%', 
          height: '240px', 
          backgroundColor: '#f1f5f9', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8'
        }}>
          [ Chart Placeholder ]
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
