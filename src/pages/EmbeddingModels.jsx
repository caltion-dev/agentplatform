import React, { useState, useEffect } from 'react';
import { Plus, RefreshCcw, Edit2, Trash2, Database, Layers, Settings, ShieldCheck } from 'lucide-react';
import ModelModal from '../components/ModelModal';

const EmbeddingModels = () => {
  const [models, setModels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      setModels(data.filter(m => m.type === 'embedding'));
    } catch (err) {
      console.error('Error fetching models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleModelSaved = (savedModel) => {
    if (editingModel) {
      setModels(models.map(m => m.id === savedModel.id ? savedModel : m));
    } else {
      setModels([savedModel, ...models]);
    }
    setEditingModel(null);
  };

  const handleEdit = (model) => {
    setEditingModel(model);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/models/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setModels(models.filter(m => m.id !== id));
        setConfirmDeleteId(null);
      } else {
        const errData = await response.json();
        alert(errData.error || 'Error al eliminar el modelo: ' + response.statusText);
      }
    } catch (err) {
      console.error('Error in handleDelete:', err);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Embeddings</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Knowledge base vectorization engines.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={fetchModels}
            className="btn-secondary"
            style={{ padding: '0.625rem' }}
          >
            <RefreshCcw size={18} className={loading && models.length > 0 ? 'animate-spin' : ''} />
          </button>
          <button 
            className="btn-primary" 
            onClick={() => { setEditingModel(null); setIsModalOpen(true); }}
          >
            <Plus size={18} strokeWidth={2.5} /> Add Embedding
          </button>
        </div>
      </div>

      {loading && models.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
           <div className="animate-pulse">Loading vectors...</div>
        </div>
      ) : models.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
            <div style={{ background: '#f0fdf4', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Database size={32} color="#22c55e" />
            </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>No vector models found</h3>
          <p style={{ color: '#64748b', marginBottom: '2rem', marginTop: '0.5rem' }}>Connect an embedding model to enable knowledge retrieval.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus size={18} /> Initialize Embedding
          </button>
        </div>
      ) : (
        <div className="models-container">
          {models.map((model) => (
            <div key={model.id} className="model-card" style={{ borderLeft: '4px solid #22c55e' }}>
              <div className="model-header">
                <div className="model-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                     <ShieldCheck size={14} color="#22c55e" />
                     <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{model.provider_name}</span>
                  </div>
                  <h3>{model.name}</h3>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                 <div style={{ backgroundColor: '#f1f5f9', padding: '0.4rem 0.6rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={14} color="#64748b" />
                    <code style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 600 }}>{model.model_identifier}</code>
                 </div>
              </div>

              <div className="model-actions" style={{ border: 'none', background: '#f8fafc', margin: '0 -1.5rem -1.5rem', padding: '1rem 1.5rem', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button 
                  className="btn-icon" 
                  onClick={() => handleEdit(model)}
                  title="Configurar"
                  style={{ background: 'white' }}
                >
                  <Settings size={16} />
                </button>
                <button 
                  className="btn-icon delete" 
                  onClick={() => setConfirmDeleteId(model.id)}
                  title="Eliminar"
                  style={{ background: 'white' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ background: '#fee2e2', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Trash2 size={24} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Eliminar Embedding</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                ¿Estás seguro de que deseas eliminar este modelo de embedding?
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 1, backgroundColor: '#ef4444', backgroundImage: 'none' }} onClick={() => handleDelete(confirmDeleteId)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <ModelModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingModel(null); }} 
        onModelSaved={handleModelSaved}
        initialType="embedding"
        editingModel={editingModel}
      />
    </div>
  );
};

export default EmbeddingModels;
