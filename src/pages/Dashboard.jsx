import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [counts, setCounts] = useState({ agents: 0, llms: 0, tokens: '0' });
  const [executions, setExecutions] = useState(0);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar conteo de modelos
        const modRes = await fetch('/api/models');
        const mods = await modRes.json();
        
        // Cargar estadísticas globales (incluyendo n8n_executions)
        const statRes = await fetch('/api/stats');
        const stats = await statRes.json();
        
        setCounts(prev => ({ ...prev, llms: mods.length }));
        if (stats.n8n_executions !== undefined) {
          setExecutions(stats.n8n_executions);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // Inyección / Destrucción de la burbuja nativa del Chatbot de Flowise
  useEffect(() => {
    const manageChatbot = async () => {
      try {
        const agRes = await fetch('/api/agents');
        const agents = await agRes.json();
        // Seleccionamos el agente (prioridad al que se llama "Chat Flowise" o el primero de la lista)
        const targetAgent = agents.find(a => a.name === "Chat Flowise") || agents[0];
        
        const isBotActive = targetAgent && targetAgent.is_active !== false;
        const dynamicPrompt = targetAgent?.system_prompt || `Eres un asistente de IA útil y cordial.`;

        if (isBotActive) {
          if (!document.getElementById('flowise-bot-script')) {
            const script = document.createElement('script');
            script.id = 'flowise-bot-script';
            script.type = 'module';
            script.innerHTML = `
              import Chatbot from "https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js"
              Chatbot.init({
                  chatflowid: "b244aafa-1c35-4c3a-a5e2-01811679cb4c",
                  apiHost: "https://dev.flowise.erpconsultingsap.com",
                  chatflowConfig: {
                      responsePrompt: \`${dynamicPrompt.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`
                  }
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
    { title: 'Collector Status', value: 'Ready' },
    { title: 'API Status', value: 'Online' },
  ];

  const handleTriggerN8n = async () => {
    setIsTriggering(true);
    setTriggerStatus(null);
    try {
      const response = await fetch('https://dev.n8n.erpconsultingsap.com/webhook-test/54687376-60de-458f-99cd-7664025bc2cd', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const text = await response.text();
      
      if (text.includes("Workflow was started")) {
        // Incrementar el contador en la DB
        await fetch('/api/stats/increment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'n8n_executions' })
        });
        setExecutions(prev => prev + 1);
        setTriggerStatus({ type: 'success', message: 'Workflow iniciado con éxito.' });
      } else {
        setTriggerStatus({ type: 'error', message: 'Respuesta inesperada de n8n.' });
      }
    } catch (error) {
      console.error('Error disparando n8n:', error);
      setTriggerStatus({ type: 'error', message: 'Error al conectar con n8n.' });
    } finally {
      setIsTriggering(false);
      // Limpiar el mensaje de estado después de 5 segundos
      setTimeout(() => setTriggerStatus(null), 5000);
    }
  };

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
          minHeight: '200px', 
          backgroundColor: '#f8fafc', 
          borderRadius: '8px',
          border: '1px dashed #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Total Ejecuciones del Agente</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#1e293b' }}>{executions}</div>
          </div>

          <button 
            onClick={handleTriggerN8n}
            disabled={isTriggering}
            style={{ 
              backgroundColor: isTriggering ? '#94a3b8' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: isTriggering ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.2s ease'
            }}
          >
            {isTriggering ? 'Ejecutando...' : 'Ejecutar Agente de Cobranzas'}
          </button>

          {triggerStatus && (
            <div style={{ 
              marginTop: '1rem', 
              fontSize: '0.875rem', 
              color: triggerStatus.type === 'success' ? '#10b981' : '#ef4444',
              fontWeight: 500
            }}>
              {triggerStatus.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
