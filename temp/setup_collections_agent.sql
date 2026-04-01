-- 1. Tablas SAP (Mock)
CREATE TABLE IF NOT EXISTS desarrollo.sap_bsid (
    id SERIAL PRIMARY KEY,
    bukrs VARCHAR(4),    -- Sociedad
    kunnr VARCHAR(10),   -- Cliente
    belnr VARCHAR(10),   -- Factura
    gjahr VARCHAR(4),    -- Ejercicio
    bldat DATE,          -- Fecha documento
    faedt DATE,          -- Vencimiento
    dmbtr DECIMAL(15,2), -- Importe
    waers VARCHAR(5),    -- Moneda
    augbl VARCHAR(10),   -- Compensado (vacío = abierta)
    bschl VARCHAR(2),    -- Clave (01=Factura)
    xblnr VARCHAR(16)    -- Referencia
);

CREATE TABLE IF NOT EXISTS desarrollo.sap_kna1 (
    kunnr VARCHAR(10) PRIMARY KEY,
    name1 VARCHAR(100),
    smtp_addr VARCHAR(100),
    spras VARCHAR(1),
    land1 VARCHAR(3)
);

CREATE TABLE IF NOT EXISTS desarrollo.sap_knvk (
    id SERIAL PRIMARY KEY,
    kunnr VARCHAR(10),
    pafkt VARCHAR(2), -- AP = Pago
    namev VARCHAR(50),
    name1 VARCHAR(50),
    smtp_addr VARCHAR(100)
);

-- 2. Datos de Prueba (Mock Data)
INSERT INTO desarrollo.sap_kna1 (kunnr, name1, smtp_addr, spras, land1) VALUES
('10000001', 'Tech Solutions S.A.', 'facturacion@techsolutions.cl', 'S', 'CL'),
('10000002', 'Global Logistics Ltd.', 'ap@global-log.com', 'E', 'US'),
('10000003', 'Alimentos del Sur', 'info@alimentosur.ar', 'S', 'AR')
ON CONFLICT DO NOTHING;

INSERT INTO desarrollo.sap_knvk (kunnr, pafkt, namev, name1, smtp_addr) VALUES
('10000001', 'AP', 'Juan', 'Perez', 'jperez@techsolutions.cl'),
('10000002', 'AP', 'Jane', 'Doe', 'jdoe@global-log.com')
ON CONFLICT DO NOTHING;

INSERT INTO desarrollo.sap_bsid (bukrs, kunnr, belnr, gjahr, bldat, faedt, dmbtr, waers, augbl, bschl, xblnr) VALUES
('1000', '10000001', '18000001', '2025', '2025-01-15', '2025-02-15', 1250.50, 'USD', '', '01', 'FAC-001'),
('1000', '10000001', '18000005', '2025', '2025-02-10', '2025-03-10', 450.00, 'USD', '', '01', 'FAC-002'),
('1000', '10000002', '18000002', '2025', '2025-01-20', '2025-02-20', 3200.00, 'USD', '', '01', 'LOG-991'),
('1000', '10000003', '18000003', '2025', '2024-12-01', '2025-01-01', 980.20, 'ARS', '', '01', 'S-4412')
ON CONFLICT DO NOTHING;

-- 3. Registro del Agente CollectionsNotifyAgent
-- Nota: Lo vinculamos al modelo OpenAI (primer ID encontrado) por defecto si Claude no está.
INSERT INTO desarrollo.agents (name, description, system_prompt, llm_model_id, embedding_model_id, is_active)
VALUES (
    'CollectionsNotifyAgent',
    'Automatización de notificación de facturas pendientes integrada con SAP FI-AR.',
    $$Eres CollectionsNotifyAgent, un agente especializado en gestión de cobranzas integrado con SAP FI-AR. Tu función es identificar clientes con facturas pendientes de pago y redactar correos electrónicos de notificación profesionales y personalizados.
 
IDENTIDAD Y ROL:
- Perteneces a CortexAgentHub (Caltion Consulting).
- Actúas como asistente del equipo de cobranzas, no como sistema automatizado impersonal.
- Tu tono es profesional, claro y cortés. Nunca amenazante ni condescendiente.
 
RESTRICCIONES:
- Nunca reveles datos internos de SAP (claves, sistemas, estructuras técnicas).
- Nunca tomes acciones en SAP que no sean de lectura (SELECT only).
- Si detectas datos inconsistentes o un cliente sin email registrado, reporta la incidencia y continúa con el siguiente cliente.
- No generes correos para facturas con estado "En disputa" (AUGBL <> '').
 
PROCESO:
1. Usa la herramienta get_open_items para obtener las partidas abiertas.
2. Agrupa por cliente (KUNNR).
3. Para cada cliente, usa get_customer_contact para obtener email de contacto.
4. Usa draft_collection_email para redactar el correo.
5. Usa send_email para enviar.
6. Usa log_activity para registrar resultado.
7. Al finalizar, devuelve un resumen estructurado.$$,
    (SELECT id FROM desarrollo.models WHERE name = 'OpenAi' LIMIT 1),
    (SELECT id FROM desarrollo.models WHERE name = 'OpenAi_Emb' LIMIT 1),
    true
) ON CONFLICT (name) DO UPDATE SET system_prompt = EXCLUDED.system_prompt;
