-- Tabla para persistir contadores y configuraciones globales de la plataforma
CREATE TABLE IF NOT EXISTS desarrollo.platform_stats (
    key VARCHAR(50) PRIMARY KEY,
    value INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inicializar el contador de n8n si no existe
INSERT INTO desarrollo.platform_stats (key, value)
VALUES ('n8n_executions', 0)
ON CONFLICT (key) DO NOTHING;
