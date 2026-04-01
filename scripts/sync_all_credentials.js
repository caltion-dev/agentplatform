import dotenv from 'dotenv';
import axios from 'axios';
import db from '../server/db/index.js';
import { decrypt } from '../server/utils/encryption.js';

dotenv.config();

const syncFlowise = async (name, type, providerName, apiKey, existingId) => {
    const url = process.env.FLOWISE_API_URL;
    const key = process.env.FLOWISE_API_KEY;
    if (!url || !key) return existingId;

    const suffix = type === 'llm' ? '_LLM_agentplatform' : '_Embedding_agentplatform';
    const flowiseName = `${name}${suffix}`;
    
    let credentialName = '';
    let plainDataObj = {};
    const normalized = providerName.toLowerCase();

    if (normalized.includes('openai')) {
        credentialName = 'openAIApi';
        plainDataObj = { openAIApiKey: apiKey };
    } else if (normalized.includes('google') || normalized.includes('gemini')) {
        credentialName = 'googleGenerativeAI';
        plainDataObj = { geminiApiKey: apiKey };
    } else {
        return existingId;
    }

    try {
        if (existingId) {
            try {
                await axios.put(`${url}/api/v1/credentials/${existingId}`, { name: flowiseName, plainDataObj }, {
                    headers: { Authorization: `Bearer ${key}` }
                });
                return existingId;
            } catch (err) {
                if (err.response?.status !== 404) throw err;
            }
        }
        const res = await axios.post(`${url}/api/v1/credentials`, { name: flowiseName, credentialName, plainDataObj }, {
            headers: { Authorization: `Bearer ${key}` }
        });
        return res.data.id;
    } catch (err) {
        console.error(`  [Flowise Error] ${name}:`, err.message);
        return existingId;
    }
};

const syncN8n = async (name, type, providerName, apiKey, existingId) => {
    const url = process.env.N8N_API_URL;
    const key = process.env.N8N_API_KEY;
    if (!url || !key) return existingId;

    const suffix = type === 'llm' ? '_LLM_agentplatform' : '_Embedding_agentplatform';
    const n8nName = `${name}${suffix}`;
    let credentialType = '';
    const normalized = providerName.toLowerCase();
    
    if (normalized.includes('openai')) {
        credentialType = 'openAiApi';
    } else if (normalized.includes('google') || normalized.includes('gemini')) {
        credentialType = 'googlePalmApi';
    } else {
        return existingId;
    }

    const payload = {
        name: n8nName,
        type: credentialType,
        data: { apiKey }
    };

    if (credentialType === 'openAiApi') {
        payload.data.headerName = "Authorization";
        payload.data.headerValue = "Bearer";
    } else if (credentialType === 'googlePalmApi') {
        payload.data = {
            apiKey: apiKey,
            host: "https://generativelanguage.googleapis.com"
        };
    }

    try {
        if (existingId) {
            try {
                await axios.patch(`${url}/credentials/${existingId}`, payload, {
                    headers: { 'X-N8N-API-KEY': key }
                });
                return existingId;
            } catch (err) {
                if (err.response?.status !== 404) throw err;
            }
        }
        const res = await axios.post(`${url}/credentials`, payload, {
            headers: { 'X-N8N-API-KEY': key }
        });
        return res.data.id;
    } catch (err) {
        console.error(`  [n8n Error] ${name}:`, err.message);
        return existingId;
    }
};

async function run() {
    console.log('🚀 Iniciando Sincronización Masiva de Credenciales...');
    
    try {
        const { rows: providers } = await db.query('SELECT * FROM desarrollo.providers');
        console.log(`📦 Encontrados ${providers.length} proveedores para procesar.\n`);

        for (const p of providers) {
            console.log(`🔄 Procesando: ${p.name} (${p.type})...`);
            
            const apiKey = decrypt(p.api_key_encrypted);
            
            const newFlowiseId = await syncFlowise(p.name, p.type, p.name, apiKey, p.flowise_credential_id);
            const newN8nId = await syncN8n(p.name, p.type, p.name, apiKey, p.n8n_credential_id);

            if (newFlowiseId !== p.flowise_credential_id || newN8nId !== p.n8n_credential_id) {
                await db.query(
                    'UPDATE desarrollo.providers SET flowise_credential_id = $1, n8n_credential_id = $2, updated_at = NOW() WHERE id = $3',
                    [newFlowiseId, newN8nId, p.id]
                );
                console.log(`  ✅ IDs actualizados en DB.`);
            } else {
                console.log(`  ✨ Sin cambios (ya sincronizado).`);
            }
        }

        console.log('\n✅ Sincronización finalizada con éxito.');
    } catch (err) {
        console.error('\n❌ Error fatal durante la sincronización:', err.message);
    } finally {
        process.exit(0);
    }
}

run();
