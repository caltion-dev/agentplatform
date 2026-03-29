SET search_path TO desarrollo;

CREATE TABLE IF NOT EXISTS desarrollo.documents (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_documents_modtime ON desarrollo.documents;
CREATE TRIGGER update_documents_modtime BEFORE UPDATE ON desarrollo.documents FOR EACH ROW EXECUTE PROCEDURE desarrollo.update_updated_at_column();
