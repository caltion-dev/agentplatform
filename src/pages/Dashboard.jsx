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

  // Inyección / Destrucción de la burbuja nativa del Chatbot de Flowise
  useEffect(() => {
    const manageChatbot = async () => {
      try {
        const agRes = await fetch('/api/agents');
        const agents = await agRes.json();
        // El usuario está apuntando a este chatflow ('Chat Flowise'), asumimos que buscamos este nodo
        const targetAgent = agents.find(a => a.name === "Chat Flowise") || agents[0];
        
        const isBotActive = targetAgent && targetAgent.is_active !== false;

        if (isBotActive) {
          // Si está encendido y el script no existe, inicializarlo de cero.
          if (!document.getElementById('flowise-bot-script')) {
            const script = document.createElement('script');
            script.id = 'flowise-bot-script';
            script.type = 'module';
            script.innerHTML = `
              import Chatbot from "https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js"
              Chatbot.init({
                  chatflowid: "b244aafa-1c35-4c3a-a5e2-01811679cb4c",
                  apiHost: "https://dev.flowise.erpconsultingsap.com",
              })
            `;
            document.body.appendChild(script);
          } else {
             // Si el script ya está inyectado de un montaje anterior, solo asegurarnos 
             // de encender la visibilidad DOM del elemento shadow <flowise-chatbot>
             const botNode = document.querySelector('flowise-chatbot');
             if (botNode) botNode.style.display = 'block';
          }
        } else {
          // Si el agente se apagó, forzamos la desaparición visual del DOM sin que explote.
          const botNode = document.querySelector('flowise-chatbot');
          if (botNode) botNode.style.display = 'none';
        }
      } catch (error) {
        console.error(error);
      }
    };

    manageChatbot();

    return () => {};
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
