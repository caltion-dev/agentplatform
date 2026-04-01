import React, { useState, useEffect } from 'react';
import { User, Play, Square, Settings, RefreshCcw, Save, X } from 'lucide-react';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [llmModels, setLlmModels] = useState([]);
  const [embeddingModels, setEmbeddingModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState(null);
  const [selectedLlmId, setSelectedLlmId] = useState('');
  const [selectedEmbeddingId, setSelectedEmbeddingId] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'prompt'
  const [n8nWorkflowId, setN8nWorkflowId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsRes, modelsRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/models')
      ]);
      const agentsData = await agentsRes.json();
      const modelsData = await modelsRes.json();
      setAgents(agentsData);
      setLlmModels(modelsData.filter(m => m.type === 'llm'));
      setEmbeddingModels(modelsData.filter(m => m.type === 'embedding'));
    } catch (err) {
      console.error('Error fetching models or agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setSelectedLlmId(agent.llm_model_id || '');
    setSelectedEmbeddingId(agent.embedding_model_id || '');
    setSystemPrompt(agent.system_prompt || '');
    setN8nWorkflowId(agent.n8n_workflow_id || '');
    setActiveTab('general');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingAgent) return;
    try {
      const response = await fetch(`/api/agents/${editingAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          llm_model_id: selectedLlmId || null, 
          embedding_model_id: selectedEmbeddingId || null,
          system_prompt: systemPrompt,
          n8n_workflow_id: n8nWorkflowId || null
        })
      });
      if (response.ok) {
        const updatedAgent = await response.json();
        setAgents(agents.map(a => a.id === updatedAgent.id ? updatedAgent : a));
        setEditingAgent(null);
      } else {
        alert('Error al actualizar el agente');
      }
    } catch (err) {
      console.error('Error in agent PUT:', err);
    }
  };

  const handleToggleActive = async (agent) => {
    try {
      const response = await fetch(`/api/agents/${agent.id}/toggle`, {
        method: 'PUT',
      });
      if (response.ok) {
        const updatedAgent = await response.json();
        setAgents(agents.map(a => a.id === updatedAgent.id ? updatedAgent : a));
        
        // Si el agente acaba de apagarse, forzamos la recarga del DOM (Web Completa) 
        // para así despachar al 100% cualquier residuo de la burbuja de Flowise que haya en Memoria Root
        if (updatedAgent.is_active === false) {
          setTimeout(() => {
            window.location.reload();
          }, 400); // pequeña pausa para apreciar el refresh
        }
      } else {
        alert('Error al cambiar el estado del agente');
      }
    } catch (err) {
      console.error('Error en toggle agent:', err);
    }
  };



  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Agents</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Ver y configurar los agentes autónomos del sistema.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={fetchData}
            className="btn-secondary"
            title="Sincronizar"
            style={{ padding: '0.625rem' }}
          >
            <RefreshCcw size={18} className={loading && agents.length > 0 ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && agents.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          <div className="animate-pulse">Cargando orquestador...</div>
        </div>
      ) : agents.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
          <div style={{ background: '#eff6ff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
             <User size={32} color="#3b82f6" />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>No agents detected</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Los programadores deben inicializar los agentes en la base de datos.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem'
        }}>
          {agents.map((agent) => (
            <div key={agent.id} className="card model-card" style={{ 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: agent.is_active === false ? '#f1f5f9' : '#ffffff',
              border: agent.is_active === false ? '1px dashed #94a3b8' : '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <div className="model-header" style={{ marginBottom: '1rem', borderBottom: 'none' }}>
                <div style={{ width: 48, height: 48, backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} color="#3b82f6" />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleEdit(agent)}
                    title="Settings" 
                    className="btn-icon"
                    style={{ background: '#f8fafc' }}
                  >
                    <Settings size={16} />
                  </button>
                  <button 
                    title={agent.is_active === false ? "Start Agent" : "Stop Agent"} 
                    className="btn-icon"
                    onClick={() => handleToggleActive(agent)}
                    style={{ 
                      background: '#f8fafc', 
                      color: agent.is_active === false ? '#10b981' : '#ef4444' 
                    }}
                  >
                    {agent.is_active === false ? <Play size={16} /> : <Square size={16} fill="currentColor" />}
                  </button>
                </div>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: agent.is_active === false ? '#94a3b8' : '#0f172a', marginBottom: '0.25rem' }}>
                {agent.name} {agent.is_active === false && "(Detenido)"}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem', flex: 1 }}>{agent.description}</p>
              
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>LLM Model</p>
                  {agent.llm_model_name ? (
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 500 }}>{agent.llm_model_name} <span style={{ color: '#64748b', fontSize: '0.8rem' }}>({agent.model_identifier})</span></p>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#ef4444', fontStyle: 'italic' }}>Not assigned</p>
                  )}
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Embedding Model</p>
                  {agent.embedding_model_name ? (
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 500 }}>{agent.embedding_model_name} <span style={{ color: '#64748b', fontSize: '0.8rem' }}>({agent.embedding_model_identifier})</span></p>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#f59e0b', fontStyle: 'italic' }}>Not assigned</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings Modal */}
      {editingAgent && (
        <div className="modal-overlay fade-in" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div className="modal-content" style={{ width: '100%', maxWidth: '500px', background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Agent Configuration</h2>
              <button 
                onClick={() => setEditingAgent(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '1.5rem' }}>
                <button 
                    type="button"
                    onClick={() => setActiveTab('general')}
                    style={{ 
                        padding: '0.5rem 0',
                        fontSize: '0.875rem',
                        borderBottom: activeTab === 'general' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeTab === 'general' ? '#3b82f6' : '#64748b',
                        fontWeight: activeTab === 'general' ? 600 : 400,
                        background: 'transparent',
                        borderLeft: 'none', borderTop: 'none', borderRight: 'none',
                        cursor: 'pointer'
                    }}
                >
                    General
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab('prompt')}
                    style={{ 
                        padding: '0.5rem 0',
                        fontSize: '0.875rem',
                        borderBottom: activeTab === 'prompt' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeTab === 'prompt' ? '#3b82f6' : '#64748b',
                        fontWeight: activeTab === 'prompt' ? 600 : 400,
                        background: 'transparent',
                        borderLeft: 'none', borderTop: 'none', borderRight: 'none',
                        cursor: 'pointer'
                    }}
                >
                    System Prompt
                </button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {activeTab === 'general' ? (
                    <>
                        <div className="form-group">
                            <label>Agent Name</label>
                            <input type="text" className="form-control" value={editingAgent.name} disabled style={{ backgroundColor: '#f1f5f9', color: '#94a3b8' }} />
                        </div>
                        
                        <div className="form-group">
                            <label>LLM Model</label>
                            <select 
                                className="form-control" 
                                value={selectedLlmId} 
                                onChange={(e) => setSelectedLlmId(e.target.value)}
                            >
                                <option value="">— None —</option>
                                {llmModels.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.provider_name})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Embedding Model</label>
                            <select 
                                className="form-control" 
                                value={selectedEmbeddingId} 
                                onChange={(e) => setSelectedEmbeddingId(e.target.value)}
                            >
                                <option value="">— None —</option>
                                {embeddingModels.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.provider_name})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <RefreshCcw size={14} color="#3b82f6" /> 
                                n8n Workflow ID (Sincronización Dinámica)
                            </label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Ejem: BpHmP0I2FwtCcoK9"
                                value={n8nWorkflowId}
                                onChange={(e) => setN8nWorkflowId(e.target.value)}
                                style={{ fontSize: '0.875rem' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                                Si este campo tiene un ID, se actualizarán las credenciales de IA en n8n automáticamente al Guardar.
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="form-group">
                        <label>Instructions & Behavior</label>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                            Define aquí cómo debe comportarse el agente y qué reglas debe seguir.
                        </p>
                        <textarea 
                            className="form-control" 
                            style={{ minHeight: '260px', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.5' }}
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Escribe el system prompt aquí..."
                        ></textarea>
                    </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn-secondary" onClick={() => setEditingAgent(null)}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
