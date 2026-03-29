import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, Database, Users, Box, BookOpen } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'LLMs', path: '/llms', icon: <Cpu size={20} /> },
    { name: 'Embedding Models', path: '/embeddings', icon: <Database size={20} /> },
    { name: 'Agents', path: '/agents', icon: <Users size={20} /> },
    { name: 'Knowledge Bases', path: '/knowledge', icon: <BookOpen size={20} /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Box size={24} color="#2563eb" />
        <span>AgentPlatform</span>
      </div>
      <nav>
        {navItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path} 
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
