import React, { useState, useEffect, useMemo } from 'react';
import { X, Shield, Cpu, Layers, Info, ChevronDown } from 'lucide-react';

const PREDEFINED_MODELS = {
  OpenAI: {
    llm: [
      { id: 'gpt-4-0613', name: 'GPT-4 0613' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini' },
      { id: 'gpt-5.4', name: 'GPT-5.4' },
      { id: 'gpt-5.4-nano-2026-03-17', name: 'GPT-5.4 Nano (2026-03-17)' },
      { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano' },
      { id: 'gpt-5.4-mini-2026-03-17', name: 'GPT-5.4 Mini (2026-03-17)' },
      { id: 'davinci-002', name: 'Davinci 002' },
      { id: 'babbage-002', name: 'Babbage 002' },
      { id: 'gpt-3.5-turbo-instruct', name: 'GPT-3.5 Turbo Instruct' },
      { id: 'gpt-3.5-turbo-instruct-0914', name: 'GPT-3.5 Turbo Instruct 0914' },
      { id: 'gpt-3.5-turbo-1106', name: 'GPT-3.5 Turbo 1106' },
      { id: 'gpt-3.5-turbo-0125', name: 'GPT-3.5 Turbo 0125' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-4-turbo-2024-04-09', name: 'GPT-4 Turbo (2024-04-09)' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-2024-05-13', name: 'GPT-4o (2024-05-13)' },
      { id: 'gpt-4o-mini-2024-07-18', name: 'GPT-4o Mini (2024-07-18)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o-2024-08-06', name: 'GPT-4o (2024-08-06)' },
      { id: 'gpt-4o-2024-11-20', name: 'GPT-4o (2024-11-20)' },
      { id: 'o1-2024-12-17', name: 'o1 (2024-12-17)' },
      { id: 'o1', name: 'o1' },
      { id: 'o3-mini', name: 'o3 Mini' },
      { id: 'o3-mini-2025-01-31', name: 'o3 Mini (2025-01-31)' },
      { id: 'o1-pro-2025-03-19', name: 'o1 Pro (2025-03-19)' },
      { id: 'o1-pro', name: 'o1 Pro' },
      { id: 'o3-2025-04-16', name: 'o3 (2025-04-16)' },
      { id: 'o4-mini-2025-04-16', name: 'o4 Mini (2025-04-16)' },
      { id: 'o3', name: 'o3' },
      { id: 'o4-mini', name: 'o4 Mini' },
      { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1 (2025-04-14)' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
      { id: 'o4-mini-deep-research', name: 'o4 Mini Deep Research' },
      { id: 'gpt-5-chat-latest', name: 'GPT-5 Chat Latest' },
      { id: 'gpt-5', name: 'GPT-5' },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
      { id: 'gpt-5-nano', name: 'GPT-5 Nano' },
      { id: 'gpt-5-pro', name: 'GPT-5 Pro' },
      { id: 'gpt-5.1', name: 'GPT-5.1' },
      { id: 'gpt-5.2', name: 'GPT-5.2' },
      { id: 'gpt-5.3-chat-latest', name: 'GPT-5.3 Chat Latest' },
      { id: 'gpt-5.4-pro', name: 'GPT-5.4 Pro' },
      { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16k' }
    ],
    embedding: [
      { id: 'text-embedding-3-small', name: 'Text Embedding 3 Small' },
      { id: 'text-embedding-3-large', name: 'Text Embedding 3 Large' },
      { id: 'text-embedding-ada-002', name: 'Text Embedding Ada 002' }
    ]
  },
  Google: {
    llm: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-001', name: 'Gemini 2.0 Flash 001' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite' },
      { id: 'gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Flash-Lite 001' },
      { id: 'gemma-3-1b-it', name: 'Gemma 3 1B' },
      { id: 'gemma-3-4b-it', name: 'Gemma 3 4B' },
      { id: 'gemma-3-12b-it', name: 'Gemma 3 12B' },
      { id: 'gemma-3-27b-it', name: 'Gemma 3 27B' },
      { id: 'gemma-3n-e2b-it', name: 'Gemma 3n E2B' },
      { id: 'gemma-3n-e4b-it', name: 'Gemma 3n E4B' },
      { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' },
      { id: 'gemini-flash-lite-latest', name: 'Gemini Flash-Lite Latest' },
      { id: 'gemini-pro-latest', name: 'Gemini Pro Latest' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
      { id: 'gemini-2.5-flash-lite-preview-09-2025', name: 'Gemini 2.5 Flash-Lite Preview Sep 2025' },
      { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview' },
      { id: 'gemini-3.1-pro-preview-customtools', name: 'Gemini 3.1 Pro Preview Custom Tools' },
      { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite Preview' },
      { id: 'deep-research-pro-preview-12-2025', name: 'Deep Research Pro Preview' },
      { id: 'aqa', name: 'Attributed Question Answering' }
    ],
    embedding: [
      { id: 'gemini-embedding-001', name: 'Gemini Embedding 001' },
      { id: 'gemini-embedding-2-preview', name: 'Gemini Embedding 2 Preview' }
    ]
  }
};

const ModelModal = ({ isOpen, onClose, onModelSaved, initialType = 'llm', editingModel = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    provider_name: 'OpenAI',
    model_identifier: '',
    type: initialType,
    api_key: '••••••••••••••••' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editingModel) {
      setFormData({
        name: editingModel.name || '',
        provider_name: editingModel.provider_name || 'OpenAI',
        model_identifier: editingModel.model_identifier || '',
        type: editingModel.type || initialType,
        api_key: '••••••••••••••••' 
      });
    } else {
      setFormData({
        name: '',
        provider_name: 'OpenAI',
        model_identifier: '',
        type: initialType,
        api_key: ''
      });
    }
  }, [editingModel, isOpen, initialType]);

  const handleProviderChange = (newProvider) => {
    const isOriginalProvider = editingModel && editingModel.provider_name === newProvider;
    setFormData({
      ...formData,
      provider_name: newProvider,
      model_identifier: '', // Reset identifier on provider change
      // Si el proveedor cambia y no es el original, borramos el "mask" de la API key
      api_key: isOriginalProvider ? '••••••••••••••••' : ''
    });
  };

  const handleIdentifierChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
        setFormData({ ...formData, model_identifier: '' });
        return;
    }

    // Buscar el nombre descriptivo para autocompletar el display name
    const list = PREDEFINED_MODELS[formData.provider_name]?.[formData.type] || [];
    const selectedModel = list.find(m => m.id === val);
    
    setFormData({
        ...formData,
        model_identifier: val,
        // Solo autocompletar nombre si está vacío o si es un 'modelo deploy' nuevo
        name: (!formData.name && selectedModel) ? selectedModel.name : formData.name
    });
  };

  const modelOptions = useMemo(() => {
    return PREDEFINED_MODELS[formData.provider_name]?.[formData.type] || [];
  }, [formData.provider_name, formData.type]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = editingModel ? `/api/models/${editingModel.id}` : '/api/models';
    const method = editingModel ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al guardar el modelo');

      const savedModel = await response.json();
      onModelSaved(savedModel);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      padding: '1rem'
    }}>
      <div className="card fade-in" style={{ 
        width: '100%', 
        maxWidth: '520px', 
        position: 'relative', 
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        borderRadius: '16px'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', border: 'none', background: '#f1f5f9', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex' }}
        >
          <X size={18} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--primary-vibrant)', padding: '0.6rem', borderRadius: '10px', color: 'white' }}>
                {formData.type === 'llm' ? <Cpu size={24} /> : <Layers size={24} />}
            </div>
            <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                  {editingModel ? 'Edit Intelligence' : 'Deploy New Model'}
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Configure your model parameters and security.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Model Display Name</label>
            <input 
              type="text" 
              required
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. GPT-4o Production"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Provider</label>
              <select 
                className="form-control"
                value={formData.provider_name}
                onChange={(e) => handleProviderChange(e.target.value)}
              >
                <option value="OpenAI">OpenAI</option>
                <option value="Google">Google (Gemini)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Architecture</label>
              <select 
                className="form-control"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="llm">Chat / Completion</option>
                <option value="embedding">Vector / Embedding</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Model Selection</label>
            <div style={{ position: 'relative' }}>
                <select 
                  className="form-control"
                  style={{ appearance: 'none', paddingRight: '2.5rem' }}
                  value={modelOptions.some(m => m.id === formData.model_identifier) ? formData.model_identifier : (formData.model_identifier ? 'custom' : '')}
                  onChange={handleIdentifierChange}
                >
                  <option value="" disabled>Select a model...</option>
                  {modelOptions.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                  <option value="custom">-- Custom Identifier --</option>
                </select>
                <ChevronDown size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} />
            </div>
          </div>

          { (modelOptions.every(m => m.id !== formData.model_identifier) || formData.model_identifier === '') && (
            <div className="form-group fade-in">
                <label className="form-label">Custom Model Identifier (API ID)</label>
                <input 
                  type="text" 
                  required
                  className="form-control"
                  value={formData.model_identifier}
                  onChange={(e) => setFormData({...formData, model_identifier: e.target.value})}
                  placeholder="e.g. gpt-4o-custom"
                />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={14} color="#10b981" /> Secret API Key
            </label>
            <input 
              type="password" 
              required
              className="form-control"
              value={formData.api_key}
              onChange={(e) => setFormData({...formData, api_key: e.target.value})}
              placeholder={(!editingModel || (editingModel && formData.provider_name !== editingModel.provider_name)) ? "Enter new API key" : "••••••••••••••••"}
              style={{
                borderColor: (formData.api_key === '' && (!editingModel || (editingModel && formData.provider_name !== editingModel.provider_name))) ? '#ef4444' : 'var(--border-color)'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: '#64748b' }}>
                <Info size={12} />
                <span style={{ fontSize: '0.7rem' }}>
                  {formData.api_key === '' ? 
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>Nueva API Key requerida para este proveedor.</span> : 
                    "Stored using AES-256-CBC industrial-grade encryption."
                  }
                </span>
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || (formData.api_key === '' && (!editingModel || (editingModel && formData.provider_name !== editingModel.provider_name)))}
              className="btn-primary"
              style={{ 
                flex: 1, 
                justifyContent: 'center',
                opacity: (loading || (formData.api_key === '' && (!editingModel || (editingModel && formData.provider_name !== editingModel.provider_name)))) ? 0.6 : 1
              }}
            >
              {loading ? 'Processing...' : (editingModel ? 'Save Changes' : 'Deploy Model')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModelModal;
