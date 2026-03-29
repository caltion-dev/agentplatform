-- ==========================================
-- Tabla: document_chunks (Vector Store)
-- Almacena fragmentos de texto de documentos
-- con sus embeddings usando pgvector.
-- Soporta múltiples dimensiones (768, 1536, etc.)
-- mediante índices HNSW parciales.
-- ==========================================

SET search_path TO desarrollo;

-- Activar la extensión (ya instalada)
CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;

-- Tabla principal de chunks
CREATE TABLE IF NOT EXISTS desarrollo.document_chunks (
    id            UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    document_id   UUID NOT NULL REFERENCES desarrollo.documents(id) ON DELETE CASCADE,
    agent_id      UUID REFERENCES desarrollo.agents(id) ON DELETE SET NULL,
    chunk_index   INTEGER NOT NULL DEFAULT 0,         -- posición del chunk dentro del documento
    content       TEXT NOT NULL,                      -- texto del fragmento
    metadata      JSONB DEFAULT '{}',                 -- metadatos adicionales (página, sección, etc.)
    embedding     public.vector,                      -- vector sin dimensión fija (flexible)
    embedding_dim INTEGER,                            -- dimensión real del vector (768, 1536, etc.)
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ÍNDICES DE BÚSQUEDA VECTORIAL (HNSW)
-- Dos índices parciales: uno por dimensión.
-- HNSW es el preferido para búsqueda aproximada
-- de alta velocidad (ANN).
-- ==========================================

-- Índice para modelos de 768 dimensiones
-- (ej. nomic-embed-text, all-MiniLM-L6-v2, text-embedding-ada-002)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_768
    ON desarrollo.document_chunks
    USING hnsw ((embedding::public.vector(768)) public.vector_cosine_ops)
    WHERE embedding_dim = 768;

-- Índice para modelos de 1536 dimensiones
-- (ej. text-embedding-3-small, text-embedding-3-large)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_1536
    ON desarrollo.document_chunks
    USING hnsw ((embedding::public.vector(1536)) public.vector_cosine_ops)
    WHERE embedding_dim = 1536;

-- Índice estándar para filtrar por documento y agente
CREATE INDEX IF NOT EXISTS idx_chunks_document
    ON desarrollo.document_chunks (document_id);

CREATE INDEX IF NOT EXISTS idx_chunks_agent
    ON desarrollo.document_chunks (agent_id);

-- Trigger para llenar embedding_dim automáticamente
CREATE OR REPLACE FUNCTION desarrollo.set_embedding_dim()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.embedding IS NOT NULL THEN
        NEW.embedding_dim := public.vector_dims(NEW.embedding);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_embedding_dim ON desarrollo.document_chunks;
CREATE TRIGGER trg_set_embedding_dim
    BEFORE INSERT OR UPDATE ON desarrollo.document_chunks
    FOR EACH ROW
    EXECUTE FUNCTION desarrollo.set_embedding_dim();
