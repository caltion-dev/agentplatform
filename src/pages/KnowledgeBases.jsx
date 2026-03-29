import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, UploadCloud, FileText, Trash2, Download, RefreshCcw, X } from 'lucide-react';

const ACCEPTED_TYPES = ['.pdf', '.doc', '.docx', '.txt', '.text', '.csv', '.md', '.rtf', '.html', '.xml'];
const ICON_MAP = {
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'text/plain': '📃',
  'text/csv': '📊',
  'text/markdown': '📋',
  'application/rtf': '📝',
  'text/html': '🌐',
  'text/xml': '🗂️',
  'application/xml': '🗂️',
};

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

const KnowledgeBases = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const uploadFile = async (file) => {
    setUploadError(null);
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      setUploadError(`Tipo de archivo no permitido: ${ext}. Formatos aceptados: ${ACCEPTED_TYPES.join(', ')}`);
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      if (res.ok) {
        const newDoc = await res.json();
        setDocuments(prev => [newDoc, ...prev]);
      } else {
        const err = await res.json();
        setUploadError(err.error || 'Error al subir el archivo');
      }
    } catch (err) {
      setUploadError('Error de red al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(uploadFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        setConfirmDeleteId(null);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Knowledge Bases</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>Gestiona los documentos que alimentan a tus agentes.</p>
        </div>
        <button onClick={fetchDocuments} className="btn-secondary" title="Sincronizar" style={{ padding: '0.625rem' }}>
          <RefreshCcw size={18} className={loading && documents.length > 0 ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#2563eb' : '#cbd5e1'}`,
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(37,99,235,0.05)' : '#f8fafc',
          transition: 'all 0.2s ease',
          marginBottom: '2rem',
          position: 'relative',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: dragOver ? '#2563eb' : '#eff6ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
          transition: 'all 0.2s ease'
        }}>
          <UploadCloud size={28} color={dragOver ? 'white' : '#2563eb'} />
        </div>
        {uploading ? (
          <p style={{ color: '#2563eb', fontWeight: 600, fontSize: '1rem' }}>Subiendo archivo...</p>
        ) : (
          <>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b', marginBottom: '0.25rem' }}>
              Arrastra y suelta tus documentos aquí
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              o haz clic para seleccionar archivos
            </p>
            <p style={{ color: '#cbd5e1', fontSize: '0.8rem', marginTop: '0.75rem' }}>
              Formatos: {ACCEPTED_TYPES.join(' · ')} · Máx. 50 MB
            </p>
          </>
        )}
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px',
          padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#b91c1c'
        }}>
          <span style={{ flex: 1, fontSize: '0.875rem' }}>{uploadError}</span>
          <button onClick={() => setUploadError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Document List */}
      {loading && documents.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          <div className="animate-pulse">Cargando documentos...</div>
        </div>
      ) : documents.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
          <div style={{ background: '#eff6ff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <BookOpen size={32} color="#3b82f6" />
          </div>
          <h3 style={{ fontWeight: 600, color: '#1e293b' }}>Sin documentos aún</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.9rem' }}>Sube tu primer documento usando la zona de arriba.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Documento</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tipo</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tamaño</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Subido</th>
                <th style={{ padding: '0.875rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, idx) => (
                <tr
                  key={doc.id}
                  style={{
                    borderBottom: idx < documents.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{ICON_MAP[doc.mime_type] || '📄'}</span>
                      <div>
                        <p style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem', marginBottom: '0.15rem' }}>{doc.original_name}</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>{doc.filename}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500 }}>
                      {doc.mime_type?.split('/').pop()?.toUpperCase() || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>{formatBytes(doc.size)}</td>
                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>{formatDate(doc.created_at)}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        download
                        className="btn-icon"
                        title="Descargar"
                        style={{ background: '#f8fafc', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Download size={16} />
                      </a>
                      <button
                        className="btn-icon delete"
                        title="Eliminar"
                        style={{ background: '#f8fafc' }}
                        onClick={() => setConfirmDeleteId(doc.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Eliminar Documento</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              ¿Estás seguro? Se eliminará el archivo del servidor. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: '#ef4444', backgroundImage: 'none' }} onClick={() => handleDelete(confirmDeleteId)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBases;
