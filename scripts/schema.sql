-- ==========================================
-- Agent Platform - PostgreSQL Schema
-- ==========================================

-- 1. Creación de la Base de Datos (Si es necesario ejecutarlo por separado)
-- CREATE DATABASE agent_platform;

-- 2. Creación de Esquemas para entornos
--CREATE SCHEMA IF NOT EXISTS desarrollo;
--CREATE SCHEMA IF NOT EXISTS produccion;

-- Establecer el esquema de trabajo por defecto
SET search_path TO desarrollo;

-- Extensiones necesarias (en el esquema public o desarrollo)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums para tipos de datos consistentes (en desarrollo)
CREATE TYPE desarrollo.user_role AS ENUM ('admin', 'user');
CREATE TYPE desarrollo.model_type AS ENUM ('llm', 'embedding');
CREATE TYPE desarrollo.message_role AS ENUM ('system', 'user', 'assistant', 'tool');
CREATE TYPE desarrollo.tool_type AS ENUM ('api', 'sql', 'n8n', 'custom');

-- 1. Tabla de Usuarios
CREATE TABLE desarrollo.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    role desarrollo.user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Proveedores de IA (OpenAI, Anthropic, Ollama, etc.)
CREATE TABLE desarrollo.providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    base_url TEXT,
    api_key_encrypted TEXT,
    config JSONB DEFAULT '{}',
    flowise_credential_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Modelos (LLMs y Embeddings)
CREATE TABLE desarrollo.models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES desarrollo.providers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    model_identifier VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    context_window INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Agentes
CREATE TABLE desarrollo.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    llm_model_id UUID REFERENCES desarrollo.models(id),
    embedding_model_id UUID REFERENCES desarrollo.models(id),
    creator_id UUID REFERENCES desarrollo.users(id),
    config JSONB DEFAULT '{
        "temperature": 0.7,
        "max_tokens": 1000,
        "top_p": 1.0
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Herramientas de Agentes (n8n, SQL, etc.)
CREATE TABLE desarrollo.agent_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES desarrollo.agents(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type desarrollo.tool_type NOT NULL,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Historial de Sesiones (Conversaciones)
CREATE TABLE desarrollo.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES desarrollo.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES desarrollo.agents(id) ON DELETE SET NULL,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Historial de Mensajes
CREATE TABLE desarrollo.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES desarrollo.chat_sessions(id) ON DELETE CASCADE,
    role desarrollo.message_role NOT NULL,
    content TEXT NOT NULL,
    tokens_count INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- indices para optimización
CREATE INDEX idx_models_provider ON desarrollo.models(provider_id);
CREATE INDEX idx_agents_llm ON desarrollo.agents(llm_model_id);
CREATE INDEX idx_chat_messages_session ON desarrollo.chat_messages(session_id);
CREATE INDEX idx_chat_sessions_user ON desarrollo.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_agent ON desarrollo.chat_sessions(agent_id);

-- Trigger para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION desarrollo.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON desarrollo.users FOR EACH ROW EXECUTE PROCEDURE desarrollo.update_updated_at_column();
CREATE TRIGGER update_providers_modtime BEFORE UPDATE ON desarrollo.providers FOR EACH ROW EXECUTE PROCEDURE desarrollo.update_updated_at_column();
CREATE TRIGGER update_models_modtime BEFORE UPDATE ON desarrollo.models FOR EACH ROW EXECUTE PROCEDURE desarrollo.update_updated_at_column();
CREATE TRIGGER update_agents_modtime BEFORE UPDATE ON desarrollo.agents FOR EACH ROW EXECUTE PROCEDURE desarrollo.update_updated_at_column();

-- 8. Tabla de Documentos (Knowledge Bases)
CREATE TABLE desarrollo.documents (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_documents_modtime BEFORE UPDATE ON desarrollo.documents FOR EACH ROW EXECUTE PROCEDURE desarrollo.update_updated_at_column();
