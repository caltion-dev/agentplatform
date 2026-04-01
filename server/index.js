import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './db/index.js';
import { encrypt } from './utils/encryption.js';
import { FLOWISE_TEMPLATES } from './utils/flowiseTemplates.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    }
});

const ALLOWED_MIMES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/rtf',
    'text/html',
    'text/xml',
    'application/xml',
];

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Flowise Helper ---

const syncFlowiseCredential = async (name, type, providerName, apiKey, existingFlowiseId = null) => {
    const flowiseUrl = process.env.FLOWISE_API_URL;
    const flowiseKey = process.env.FLOWISE_API_KEY;

    if (!flowiseUrl || !flowiseKey) {
        console.warn('Flowise integration skipped: Missing FLOWISE_API_URL or FLOWISE_API_KEY in .env');
        return;
    }

    // Identificar el tipo para el nombre de la credencial en Flowise
    const suffix = type === 'llm' ? '_LLM_agentplatform' : '_Embedding_agentplatform';
    const flowiseName = `${name}${suffix}`;

    let credentialName = '';
    let payload = {
        name: flowiseName,
        plainDataObj: {}
    };

    // Mapeo según el proveedor
    const normalizedProvider = providerName.toLowerCase();
    if (normalizedProvider.includes('openai')) {
        credentialName = 'openAIApi';
        payload.plainDataObj = { openAIApiKey: apiKey };
    } else if (normalizedProvider.includes('google') || normalizedProvider.includes('gemini')) {
        credentialName = 'googleGenerativeAI';
        payload.plainDataObj = { geminiApiKey: apiKey };
    } else {
        console.warn(`Flowise integration skipped: Provider ${providerName} not supported yet.`);
        return;
    }

    payload.credentialName = credentialName;

    try {
        if (existingFlowiseId) {
            console.log(`Updating credential in Flowise: ${existingFlowiseId} (${flowiseName})`);
            // Para actualizar solo enviamos el name y plainDataObj según solicitado
            const updatePayload = {
                name: flowiseName,
                plainDataObj: payload.plainDataObj
            };
            const response = await axios.put(`${flowiseUrl}/api/v1/credentials/${existingFlowiseId}`, updatePayload, {
                headers: {
                    Authorization: `Bearer ${flowiseKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Flowise update response:', response.data);
            return existingFlowiseId;
        } else {
            console.log(`Creating credential in Flowise: ${flowiseName} (${credentialName})`);
            const response = await axios.post(`${flowiseUrl}/api/v1/credentials`, payload, {
                headers: {
                    Authorization: `Bearer ${flowiseKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Flowise create response:', response.data);
            return response.data.id;
        }
    } catch (err) {
        console.error('Error syncing to Flowise:', err.response?.data || err.message);
        throw new Error('Error al sincronizar credencial con Flowise: ' + (err.response?.data?.message || err.message));
    }
};

const deleteFlowiseCredential = async (flowiseId) => {
    const flowiseUrl = process.env.FLOWISE_API_URL;
    const flowiseKey = process.env.FLOWISE_API_KEY;

    if (!flowiseUrl || !flowiseKey || !flowiseId) return;

    try {
        console.log(`Deleting credential from Flowise: ${flowiseId}`);
        await axios.delete(`${flowiseUrl}/api/v1/credentials/${flowiseId}`, {
            headers: {
                Authorization: `Bearer ${flowiseKey}`
            }
        });
        console.log('Flowise credential deleted successfully');
    } catch (err) {
        console.error('Error deleting from Flowise:', err.response?.data || err.message);
        // No lanzamos error para no bloquear el borrado local, solo logueamos
    }
};

const transformNode = (node, type, providerName, modelIdentifier, credentialId, edges) => {
    if (!providerName) return;
    const provider = (providerName.toLowerCase().includes('google') || providerName.toLowerCase().includes('gemini')) ? 'google' : 'openai';
    const template = FLOWISE_TEMPLATES[type][provider];

    if (!template) return;

    console.log(`Transforming node ${node.data.id} (${node.data.type}) to ${template.type} using provider ${provider}`);

    const currentId = node.data.id;
    const oldInputs = node.data.inputs || {};

    // Clonar plantilla inyectando el ID actual para mantener coherencia interna de anclas
    const templateStr = JSON.stringify(template).replace(/{{NODE_ID}}/g, currentId);
    const newTemplate = JSON.parse(templateStr);

    const newInputs = { ...newTemplate.inputs };
    
    // Conservar cables entrantes conectados a variables (ej. cache="{{inMemoryCache_0.data.instance}}")
    Object.keys(oldInputs).forEach(key => {
        if (key in newInputs && typeof oldInputs[key] === 'string' && oldInputs[key].includes('{{')) {
            newInputs[key] = oldInputs[key];
        }
    });

    node.data = {
        ...newTemplate,
        id: currentId,
        inputs: {
            ...newInputs,
            modelName: modelIdentifier
        },
        credential: credentialId
    };

    // Flowise espera que la envoltura superior sea customNode
    node.type = 'customNode';

    // Asegurar que si el nodo mutado tiene otro ID de ancla de salida, los cables apunten hacia dicho ID
    if (edges && Array.isArray(edges) && newTemplate.outputAnchors && newTemplate.outputAnchors.length > 0) {
        const newOutputAnchorId = newTemplate.outputAnchors[0].id;
        edges.forEach(edge => {
            if (edge.source === currentId) {
                edge.sourceHandle = newOutputAnchorId;
            }
        });
    }
};

const syncFlowiseChatflow = async (agentId) => {
    const flowiseUrl = process.env.FLOWISE_API_URL;
    const flowiseKey = process.env.FLOWISE_API_KEY;

    if (!flowiseUrl || !flowiseKey) return;

    try {
        console.log(`Syncing Flowise Chatflow for agent: ${agentId}`);

        // 1. Obtener datos del agente y sus modelos (completos con credenciales)
        const agentRes = await db.query(`
            SELECT a.name, a.is_active, a.llm_model_id, a.embedding_model_id,
                   llm.model_identifier as llm_id, p_llm.flowise_credential_id as llm_cred, p_llm.name as llm_provider,
                   emb.model_identifier as emb_id, p_emb.flowise_credential_id as emb_cred, p_emb.name as emb_provider
            FROM desarrollo.agents a
            LEFT JOIN desarrollo.models llm ON a.llm_model_id = llm.id
            LEFT JOIN desarrollo.providers p_llm ON llm.provider_id = p_llm.id
            LEFT JOIN desarrollo.models emb ON a.embedding_model_id = emb.id
            LEFT JOIN desarrollo.providers p_emb ON emb.provider_id = p_emb.id
            WHERE a.id = $1
        `, [agentId]);

        if (agentRes.rows.length === 0) return;
        const agent = agentRes.rows[0];

        // 2. Identificar el Chatflow ID en .env
        const envVarName = `FLOWISE_CHATFLOW_ID_${agent.name.toUpperCase().replace(/\s+/g, '_')}`;
        const chatflowId = process.env[envVarName];

        if (!chatflowId) {
            console.warn(`Sync skipped: No chatflow ID found in .env for agent name "${agent.name}" (Variable expected: ${envVarName})`);
            return;
        }

        // 3. Obtener el Chatflow actual de Flowise
        const flowRes = await axios.get(`${flowiseUrl}/api/v1/chatflows/${chatflowId}`, {
            headers: { Authorization: `Bearer ${flowiseKey}` }
        });

        // 4. Parsear flowData (puede venir como string o como objeto)
        let flowData = flowRes.data.flowData;
        let flowObj = typeof flowData === 'string' ? JSON.parse(flowData) : flowData;

        // 5. Actualizar nodos de forma robusta
        if (flowObj && flowObj.nodes) {
            flowObj.nodes.forEach(node => {
                const category = node.data?.category;
                const nodeName = node.data?.name || '';
                const nodeType = node.data?.type || '';
                
                // Actualizar LLM (Chat Models)
                // Detectamos por categoría o por nombres comunes
                if (agent.llm_id && (
                    category === 'Chat Models' || 
                    nodeType.includes('ChatOpenAI') || 
                    nodeType.includes('ChatGoogleGenerativeAI') ||
                    nodeName.toLowerCase().includes('chat')
                )) {
                    transformNode(node, 'llm', agent.llm_provider, agent.llm_id, agent.llm_cred, flowObj.edges);
                }

                // Actualizar Embedding
                if (agent.emb_id && (
                    category === 'Embeddings' || 
                    nodeType.includes('OpenAIEmbeddings') || 
                    nodeType.includes('GoogleGenerativeAIEmbeddings') ||
                    nodeName.toLowerCase().includes('embedding')
                )) {
                    transformNode(node, 'embedding', agent.emb_provider, agent.emb_id, agent.emb_cred, flowObj.edges);
                }
            });
        }

        // 6. Volver a stringificar SIEMPRE, ya que la API de Flowise exige que flowData sea un string
        const updatedFlowData = JSON.stringify(flowObj);

        // 7. Configurar apiConfig de Flowise para apagar/encender la API del chatflow según is_active
        let apiConfigObj = flowRes.data.apiConfig 
            ? (typeof flowRes.data.apiConfig === 'string' ? JSON.parse(flowRes.data.apiConfig) : flowRes.data.apiConfig) 
            : {};
        
        if (!apiConfigObj.overrideConfig) apiConfigObj.overrideConfig = {};
        // Si is_active es false, status de Flowise será false (apaga la API)
        apiConfigObj.overrideConfig.status = agent.is_active === true;

        const updatePayload = {
            name: `agentplatform - ${agent.name}`,
            flowData: updatedFlowData,
            apiConfig: JSON.stringify(apiConfigObj),
            isPublic: agent.is_active === true
        };

        await axios.put(`${flowiseUrl}/api/v1/chatflows/${chatflowId}`, updatePayload, {
            headers: {
                Authorization: `Bearer ${flowiseKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Flowise Chatflow ${chatflowId} updated successfully for agent ${agent.name}`);

    } catch (err) {
        console.error('Error syncing Chatflow to Flowise:', err.response?.data || err.message);
    }
};

// --- API Routes ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// GET /api/models - Listar modelos con info del proveedor
app.get('/api/models', async (req, res) => {
    console.log('GET /api/models');
    try {
        const { rows } = await db.query(`
            SELECT m.id, m.name, m.model_identifier, m.type, m.is_active, p.name as provider_name 
            FROM desarrollo.models m 
            JOIN desarrollo.providers p ON m.provider_id = p.id 
            ORDER BY m.created_at DESC
        `, []);
        res.json(rows);
    } catch (err) {
        console.error('Error en GET /api/models:', err);
        res.status(500).json({ error: 'Error al obtener modelos' });
    }
});

app.post('/api/models', async (req, res) => {
    const { name, provider_name, model_identifier, type, api_key } = req.body;
    console.log('POST /api/models', { name, provider_name, model_identifier });
    
    try {
        // 1. Sincronizar con Flowise antes de guardar en DB local
        let flowiseCredentialId = null;
        let providerId = null;
        const providerRes = await db.query('SELECT id, flowise_credential_id FROM desarrollo.providers WHERE name = $1 AND type = $2', [provider_name, type]);
        
        if (providerRes.rows.length > 0) {
            providerId = providerRes.rows[0].id;
            flowiseCredentialId = providerRes.rows[0].flowise_credential_id;
        }

        try {
            // Si ya existe un flowise_credential_id en el proveedor, actualizamos en lugar de crear
            flowiseCredentialId = await syncFlowiseCredential(name, type, provider_name, api_key, flowiseCredentialId);
        } catch (flowiseErr) {
            console.error('Flowise Sync Failed:', flowiseErr.message);
            return res.status(500).json({ error: flowiseErr.message });
        }

        if (providerId) {
            // Actualizar el provider existente con el nuevo Flowise ID
            await db.query(
                'UPDATE desarrollo.providers SET api_key_encrypted = $1, flowise_credential_id = $2, updated_at = NOW() WHERE id = $3',
                [encrypt(api_key), flowiseCredentialId, providerId]
            );
        } else {
            console.log('Creating new provider:', provider_name, 'Type:', type);
            const newProvider = await db.query(
                'INSERT INTO desarrollo.providers (name, type, api_key_encrypted, flowise_credential_id) VALUES ($1, $2, $3, $4) RETURNING id',
                [provider_name, type, encrypt(api_key), flowiseCredentialId]
            );
            providerId = newProvider.rows[0].id;
        }

        const result = await db.query(
            'INSERT INTO desarrollo.models (provider_id, name, model_identifier, type) VALUES ($1, $2, $3, $4) RETURNING *',
            [providerId, name, model_identifier, type]
        );

        res.status(201).json({ ...result.rows[0], provider_name });
    } catch (err) {
        console.error('Error en POST /api/models:', err);
        res.status(500).json({ error: 'Error al crear el modelo' });
    }
});

// PUT /api/models/:id - Actualizar modelo
app.put('/api/models/:id', async (req, res) => {
    const { id } = req.params;
    const { name, provider_name, model_identifier, type, api_key } = req.body;
    console.log('PUT /api/models/' + id, { name, provider_name });

    try {
        // 0. Obtener el provider_id actual para limpieza posterior
        const oldModelRes = await db.query('SELECT provider_id FROM desarrollo.models WHERE id = $1', [id]);
        if (oldModelRes.rows.length === 0) return res.status(404).json({ error: 'Modelo no encontrado' });
        const oldProviderId = oldModelRes.rows[0].provider_id;

        // 1. Buscar o crear el proveedor para obtener su ID (Basado en nombre y TIPO)
        let providerId;
        const providerRes = await db.query('SELECT id FROM desarrollo.providers WHERE name = $1 AND type = $2', [provider_name, type]);
        
        if (providerRes.rows.length > 0) {
            providerId = providerRes.rows[0].id;
        } else {
            console.log('Creating replacement provider:', provider_name, 'Type:', type);
            if (!api_key || api_key === '••••••••••••••••') {
                return res.status(400).json({ error: 'Se requiere una API Key para el nuevo proveedor: ' + provider_name });
            }
            const encryptionKey = encrypt(api_key);
            const newProvider = await db.query(
                'INSERT INTO desarrollo.providers (name, type, api_key_encrypted) VALUES ($1, $2, $3) RETURNING id',
                [provider_name, type, encryptionKey]
            );
            providerId = newProvider.rows[0].id;
        }

        // 2. Actualizar el modelo incluyendo el provider_id
        const modelUpdate = await db.query(
            'UPDATE desarrollo.models SET name = $1, model_identifier = $2, type = $3, provider_id = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
            [name, model_identifier, type, providerId, id]
        );

        // 3. Si se proporciona una nueva API Key, actualizar el proveedor y Flowise
        if (api_key && api_key !== '••••••••••••••••') {
            console.log('Updating API Key for provider:', providerId);

            // Recuperar el Flowise ID actual del proveedor antes de editar
            const flowiseIdRes = await db.query('SELECT flowise_credential_id FROM desarrollo.providers WHERE id = $1', [providerId]);
            const existingFlowiseId = flowiseIdRes.rows[0]?.flowise_credential_id;

            // Sincronizar con Flowise (Update si existe ID)
            let flowiseCredentialId = null;
            try {
                flowiseCredentialId = await syncFlowiseCredential(name, type, provider_name, api_key, existingFlowiseId);
            } catch (flowiseErr) {
                console.error('Flowise Sync Failed:', flowiseErr.message);
                return res.status(500).json({ error: flowiseErr.message });
            }

            await db.query(
                'UPDATE desarrollo.providers SET api_key_encrypted = $1, flowise_credential_id = $2, updated_at = NOW() WHERE id = $3',
                [encrypt(api_key), flowiseCredentialId, providerId]
            );
        }

        // 4. LIMPIEZA: Si el proveedor cambió, verificar si el antiguo quedó huérfano
        console.log(`GC Check: oldProviderId=${oldProviderId}, newProviderId=${providerId}`);
        if (oldProviderId !== providerId) {
            const countRes = await db.query('SELECT COUNT(*) FROM desarrollo.models WHERE provider_id = $1', [oldProviderId]);
            console.log(`GC Check: count of remaining models for oldProviderId is ${countRes.rows[0].count}`);
            if (parseInt(countRes.rows[0].count) === 0) {
                console.log('Cleaning up orphaned provider:', oldProviderId);
                await db.query('DELETE FROM desarrollo.providers WHERE id = $1', [oldProviderId]);
            }
        }

        res.json({ ...modelUpdate.rows[0], provider_name });
    } catch (err) {
        console.error('Error en PUT /api/models:', err);
        res.status(500).json({ error: 'Error al actualizar el modelo' });
    }
});

// DELETE /api/models/:id - Borrar modelo
app.delete('/api/models/:id', async (req, res) => {
    const { id } = req.params;
    console.log('DELETE /api/models/' + id);
    try {
        // 0. Obtener provider_id antes de borrar
        const modelRes = await db.query('SELECT name, provider_id FROM desarrollo.models WHERE id = $1', [id]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'Modelo no encontrado' });
        const { name, provider_id: providerId } = modelRes.rows[0];

        // 0b. Verificar si el modelo está en uso por algún agente
        const usageRes = await db.query(`
            SELECT COUNT(*) FROM desarrollo.agents 
            WHERE llm_model_id = $1 OR embedding_model_id = $1
        `, [id]);
        
        if (parseInt(usageRes.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: `No se puede eliminar el modelo "${name}" porque está asignado a ${usageRes.rows[0].count} agente(s).` 
            });
        }

        // 1. Borrar el modelo
        const result = await db.query('DELETE FROM desarrollo.models WHERE id = $1 RETURNING *', [id]);
        
        // 2. Limpiar proveedor si quedó huérfano
        const countRes = await db.query('SELECT COUNT(*) FROM desarrollo.models WHERE provider_id = $1', [providerId]);
        if (parseInt(countRes.rows[0].count) === 0) {
            console.log('Cleaning up orphaned provider after deletion:', providerId);
            
            // Obtener el Flowise ID antes de borrar el proveedor
            const flowiseRes = await db.query('SELECT flowise_credential_id FROM desarrollo.providers WHERE id = $1', [providerId]);
            const flowiseId = flowiseRes.rows[0]?.flowise_credential_id;

            // Borrar de Flowise
            if (flowiseId) {
                await deleteFlowiseCredential(flowiseId);
            }

            await db.query('DELETE FROM desarrollo.providers WHERE id = $1', [providerId]);
        }

        console.log('Deleted model:', result.rows[0].name);
        res.json({ message: 'Modelo eliminado correctamente' });
    } catch (err) {
        console.error('Error en DELETE /api/models:', err);
        res.status(500).json({ error: 'Error al eliminar el modelo' });
    }
});

// ==========================================
// RUTAS PARA AGENTES
// ==========================================

// GET /api/agents - Listar agentes con LLM y Embedding asignados
app.get('/api/agents', async (req, res) => {
    console.log('GET /api/agents');
    try {
        const { rows } = await db.query(`
            SELECT a.id, a.name, a.description, a.system_prompt, a.config, a.is_active,
                   a.llm_model_id, llm.name as llm_model_name, llm.model_identifier,
                   a.embedding_model_id, emb.name as embedding_model_name, emb.model_identifier as embedding_model_identifier
            FROM desarrollo.agents a
            LEFT JOIN desarrollo.models llm ON a.llm_model_id = llm.id
            LEFT JOIN desarrollo.models emb ON a.embedding_model_id = emb.id
            ORDER BY a.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error en GET /api/agents:', err);
        res.status(500).json({ error: 'Error al obtener agentes' });
    }
});

// PUT /api/agents/:id - Actualizar la configuración del agente (LLM + Embedding)
app.put('/api/agents/:id', async (req, res) => {
    const { id } = req.params;
    const { llm_model_id, embedding_model_id, system_prompt } = req.body;
    console.log(`PUT /api/agents/${id}`, { llm_model_id, embedding_model_id, system_prompt: !!system_prompt });

    try {
        const result = await db.query(
            `UPDATE desarrollo.agents 
             SET llm_model_id = $1, embedding_model_id = $2, system_prompt = $3, updated_at = NOW() 
             WHERE id = $4 RETURNING *`,
            [llm_model_id || null, embedding_model_id || null, system_prompt || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Agente no encontrado' });
        }

        const { rows } = await db.query(`
            SELECT a.id, a.name, a.description, a.system_prompt, a.config, a.is_active,
                   a.llm_model_id, llm.name as llm_model_name, llm.model_identifier,
                   a.embedding_model_id, emb.name as embedding_model_name, emb.model_identifier as embedding_model_identifier
            FROM desarrollo.agents a
            LEFT JOIN desarrollo.models llm ON a.llm_model_id = llm.id
            LEFT JOIN desarrollo.models emb ON a.embedding_model_id = emb.id
            WHERE a.id = $1
        `, [id]);

        res.json(rows[0]);

        // 3. Sincronizar en segundo plano con Flowise
        syncFlowiseChatflow(id).catch(console.error);
    } catch (err) {
        console.error('Error en PUT /api/agents:', err);
        res.status(500).json({ error: 'Error al actualizar el agente' });
    }
});

// PUT /api/agents/:id/toggle - Encender o Apagar el agente
app.put('/api/agents/:id/toggle', async (req, res) => {
    const { id } = req.params;
    console.log(`PUT /api/agents/${id}/toggle`);

    try {
        const result = await db.query(
            `UPDATE desarrollo.agents 
             SET is_active = NOT COALESCE(is_active, true), updated_at = NOW() 
             WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Agente no encontrado' });
        }

        const { rows } = await db.query(`
            SELECT a.id, a.name, a.description, a.system_prompt, a.config, a.is_active,
                   a.llm_model_id, llm.name as llm_model_name, llm.model_identifier,
                   a.embedding_model_id, emb.name as embedding_model_name, emb.model_identifier as embedding_model_identifier
            FROM desarrollo.agents a
            LEFT JOIN desarrollo.models llm ON a.llm_model_id = llm.id
            LEFT JOIN desarrollo.models emb ON a.embedding_model_id = emb.id
            WHERE a.id = $1
        `, [id]);

        const agent = rows[0];
        res.json(agent);

        // Disparar sincronización para apagar/prender el chatflow
        syncFlowiseChatflow(id).catch(console.error);
    } catch (err) {
        console.error('Error en PUT /api/agents/:id/toggle:', err);
        res.status(500).json({ error: 'Error al cambiar estado del agente' });
    }
});

// ==========================================
// RUTAS PARA DOCUMENTOS (KNOWLEDGE BASES)
// ==========================================

// GET /api/documents - Listar todos los documentos subidos
app.get('/api/documents', async (req, res) => {
    console.log('GET /api/documents');
    try {
        const { rows } = await db.query('SELECT * FROM desarrollo.documents ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('Error en GET /api/documents:', err);
        res.status(500).json({ error: 'Error al obtener documentos' });
    }
});

// POST /api/documents - Subir un nuevo documento
app.post('/api/documents', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    console.log('POST /api/documents', req.file.originalname);
    try {
        const { filename, originalname, mimetype, size, path: filePath } = req.file;
        const { rows } = await db.query(
            `INSERT INTO desarrollo.documents (filename, original_name, mime_type, size, file_path)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [filename, originalname, mimetype, size, filePath]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error en POST /api/documents:', err);
        // Limpiar el archivo si falla el insert
        if (req.file) fs.unlink(req.file.path, () => {});
        res.status(500).json({ error: 'Error al guardar el documento' });
    }
});

// DELETE /api/documents/:id - Eliminar un documento
app.delete('/api/documents/:id', async (req, res) => {
    const { id } = req.params;
    console.log('DELETE /api/documents/' + id);
    try {
        const docRes = await db.query('SELECT file_path FROM desarrollo.documents WHERE id = $1', [id]);
        if (docRes.rows.length === 0) return res.status(404).json({ error: 'Documento no encontrado' });
        const filePath = docRes.rows[0].file_path;

        await db.query('DELETE FROM desarrollo.documents WHERE id = $1', [id]);

        // Intentar borrar el archivo físico
        fs.unlink(filePath, (err) => {
            if (err) console.warn('No se pudo borrar el archivo físico:', err.message);
        });

        res.json({ message: 'Documento eliminado correctamente' });
    } catch (err) {
        console.error('Error en DELETE /api/documents:', err);
        res.status(500).json({ error: 'Error al eliminar el documento' });
    }
});

// GET /api/documents/:id/download - Descargar un documento
app.get('/api/documents/:id/download', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM desarrollo.documents WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Documento no encontrado' });
        const doc = rows[0];
        res.download(doc.file_path, doc.original_name);
    } catch (err) {
        console.error('Error en GET /api/documents/:id/download:', err);
        res.status(500).json({ error: 'Error al descargar el documento' });
    }
});

// ==========================================
// RUTAS PARA CHAT (PERSISTENCIA)
// ==========================================

// GET /api/chat/sessions - Listar sesiones de chat
app.get('/api/chat/sessions', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM desarrollo.chat_sessions ORDER BY last_message_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('Error en GET /api/chat/sessions:', err);
        res.status(500).json({ error: 'Error al obtener sesiones' });
    }
});

// POST /api/chat/sessions - Crear una nueva sesión
app.post('/api/chat/sessions', async (req, res) => {
    const { agent_id, title } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO desarrollo.chat_sessions (agent_id, title) VALUES ($1, $2) RETURNING *',
            [agent_id, title || 'Nueva Conversación']
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error en POST /api/chat/sessions:', err);
        res.status(500).json({ error: 'Error al crear sesión' });
    }
});

// GET /api/chat/messages/:sessionId - Obtener historia de una sesión
app.get('/api/chat/messages/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
        const { rows } = await db.query(
            'SELECT * FROM desarrollo.chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
            [sessionId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Error en GET /api/chat/messages:', err);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
});

// POST /api/chat/messages - Guardar un mensaje
app.post('/api/chat/messages', async (req, res) => {
    const { session_id, role, content, metadata } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO desarrollo.chat_messages (session_id, role, content, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
            [session_id, role, content, metadata || {}]
        );
        
        // Actualizar el timestamp de la sesión
        await db.query('UPDATE desarrollo.chat_sessions SET last_message_at = NOW() WHERE id = $1', [session_id]);
        
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error en POST /api/chat/messages:', err);
        res.status(500).json({ error: 'Error al guardar mensaje' });
    }
});

// ==========================================
// RUTAS PARA SAP (MOCK) & LOGS
// ==========================================

// GET /api/sap/open-items - Consultar partidas abiertas (Filtro BSCHL 01/11)
app.get('/api/sap/open-items', async (req, res) => {
    const { bukrs } = req.query;
    console.log('GET /api/sap/open-items', { bukrs });
    try {
        // Filtro estricto: BSCHL IN ('01', '11') => Facturas y NC
        const queryText = bukrs 
            ? 'SELECT kunnr, bukrs, belnr, bldat, faedt, dmbtr, waers, augbl, zterm, bschl FROM desarrollo.sap_bsid WHERE bukrs = $1 AND augbl = \'\' AND bschl IN (\'01\', \'11\')' 
            : 'SELECT kunnr, bukrs, belnr, bldat, faedt, dmbtr, waers, augbl, zterm, bschl FROM desarrollo.sap_bsid WHERE augbl = \'\' AND bschl IN (\'01\', \'11\')';
        const params = bukrs ? [bukrs] : [];
        const { rows } = await db.query(queryText, params);
        res.json(rows);
    } catch (err) {
        console.error('Error en GET /api/sap/open-items:', err);
        res.status(500).json({ error: 'Error al obtener partidas abiertas' });
    }
});

// GET /api/sap/customer-contact/:kunnr - Consultar contacto de cliente
app.get('/api/sap/customer-contact/:kunnr', async (req, res) => {
    const { kunnr } = req.params;
    console.log('GET /api/sap/customer-contact/' + kunnr);
    try {
        const { rows: customerRows } = await db.query('SELECT * FROM desarrollo.sap_kna1 WHERE kunnr = $1', [kunnr]);
        const { rows: contactRows } = await db.query('SELECT * FROM desarrollo.sap_knvk WHERE kunnr = $1 ORDER BY pafkt DESC', [kunnr]);
        
        if (customerRows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        
        res.json({
            master: customerRows[0],
            contacts: contactRows
        });
    } catch (err) {
        console.error('Error en GET /api/sap/customer-contact:', err);
        res.status(500).json({ error: 'Error al obtener contacto' });
    }
});

// POST /api/agent/logs - Registrar actividad de ejecución
app.post('/api/agent/logs', async (req, res) => {
    const { agent_name, kunnr, action, status, detail } = req.body;
    console.log('POST /api/agent/logs', { agent_name, kunnr, action, status });
    try {
        // Aseguramos que la tabla exista (just-in-time migration)
        await db.query(`
            CREATE TABLE IF NOT EXISTS desarrollo.agent_logs (
                id SERIAL PRIMARY KEY,
                agent_name VARCHAR(100),
                kunnr VARCHAR(10),
                action VARCHAR(50),
                status VARCHAR(20),
                detail TEXT,
                timestamp TIMESTAMP DEFAULT NOW()
            )
        `);

        const { rows } = await db.query(
            `INSERT INTO desarrollo.agent_logs (agent_name, kunnr, action, status, detail)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [agent_name, kunnr, action, status, detail]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error en POST /api/agent/logs:', err);
        res.status(500).json({ error: 'Error al guardar log' });
    }
});

// ==========================================
// RUTAS PARA ESTADÍSTICAS
// ==========================================

// GET /api/stats - Obtener estadísticas globales
app.get('/api/stats', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT key, value FROM desarrollo.platform_stats');
        // Convertir array de filas a un objeto llave-valor para facilitar su uso en React
        const statsObj = rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {});
        res.json(statsObj);
    } catch (err) {
        console.error('Error en GET /api/stats:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// POST /api/stats/increment - Incrementar un contador
app.post('/api/stats/increment', async (req, res) => {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'Se requiere una key para incrementar' });
    
    try {
        const { rows } = await db.query(
            `UPDATE desarrollo.platform_stats 
             SET value = value + 1, updated_at = NOW() 
             WHERE key = $1 RETURNING *`,
            [key]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Estadística no encontrada' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error en POST /api/stats/increment:', err);
        res.status(500).json({ error: 'Error al incrementar estadística' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
