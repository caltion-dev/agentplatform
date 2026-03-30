# Documentación del Backend (Express.js & BBDD)

El servidor central Node.js es el componente fundamental para proveer persistencia local (PostgreSQL) y operar como **Middleware Orquestador "en la sombra" (Shadow Proxy)** para Flowise API.

## 🛠️ Tecnologías del Core
*   **Node.js & Express.js (v5.x)**: Capa de microservicios HTTP.
*   **Axios**: Puente y manipulador de webhooks/REST requests dirigidos hacia el host interno de Flowise.
*   **`pg` (node-postgres)**: Driver robusto para consultas manuales SQL seguras e inyecciones preparadas (`$1`, `$2`) que impiden ataques de SQL Injection sobre la capa `desarrollo.*`.
*   **Multer**: Analizador de solicitudes `multipart/form-data` usado para subir e interceptar archivos en el punto final de Base de Conocimientos (Knowledge).
*   **Crypto (Nativo Node)**: Invocado a través de `utils/encryption.js` garantizando la encriptación homomórfica del ecosistema secreto (Cifrado AES-256-CBC de credenciales).

---

## 🧠 Estructura de Módulos (Directorio `server/`)

### 1. `server/index.js` (Punto Principal)
Este es el plano neurológico del sistema de Agentes. Inicializa:
- Configuración y validadores de CORS.
- Configuración de Multer `Storage` creando un repositorio local `/uploads` que formatea automáticamente PDFs, Docs, etc., validando MimeTypes (máx 50MB por payload).

### 2. Motor de Sincronización Automática (Hot-Swapping)
La lógica maestra para que un cliente configure un modelo de IA en el panel de React y automáticamente el grafo gigante de Flowise se reescriba sin que colapse.
Las rutinas (`syncFlowiseCredential`, `syncFlowiseChatflow`, `transformNode`) operan meticulosamente de esta forma:

#### `transformNode(node, type, providerName, modelIdentifier, credentialId, edges)`
1. **Identifica** cual de las enormes plantillas JSON pre-compiladas utilizará invocando `FLOWISE_TEMPLATES` (Ubicado en `utils/flowiseTemplates.js`).
2. **Reemplaza Identidades** (`{{NODE_ID}}` a un Regex que inyecta la referencia ID actual).
3. **Conserva Variables** como `{{inMemoryCache_0...}}` para que los eslabones intermedios de los componentes UI Flowise no pierdan propiedades previas.
4. **Re-suelda las Ramificaciones (Edges)**: Al mutar de `ChatOpenAI` a `ChatGoogleGenerativeAI`, el Output Anchor resultante es completamente distinto. `transformNode` interviene el arreglo en memoria de los Cables/Dibujs de React Flow (`flowObj.edges`) actualizando de facto la variable `sourceHandle` de las cadenas aledañas al nuevo ID exportado.

#### `syncFlowiseChatflow(agentId)`
Realiza consultas a PostgreSQL, extrayendo las referencias combinadas: "Dado mi agente $1, extraerme sus modelos mapeados de LLM local y de Embedding local, así como su UUID secreto proveniente de la tabla Credenciales". Luego se descarga el chatflow masivo desde Flowise apuntando el `$API_KEY`, inyecta los Edges a la lupa, muta los nodos asíncronamente y vuelve a publicar (hace `PUT /chatflows/{id}`).

### 3. Sistema Criptográfico (`server/utils/encryption.js`)
Provee la seguridad para nunca almacenar API Keys (OpenAI, Gemini) expuestas como string en texto claro en la base de datos `models` de Postgres.
Utiliza funciones nativas de Criptografía de Node: `crypto.createCipheriv` y `crypto.createDecipheriv` mediante el patrón AES-256-CBC, combinando una llave maestra de entorno (`ENCRYPTION_KEY`) que hace el rebanado (slicing) a 32 bytes y un vector de inicialización de salt (IV) a 16 bytes adherido al principio de la cadena codificada final.

### 4. Controlador de Base de Datos (`server/db/index.js`)
Configuración de `pg.Pool` conectado a variables globales de Traefik (Docker) tales como `DB_HOST`, `DB_PORT`, `DB_USER` estableciendo canales persistentes sin fuga de memoria ni sobrecarga de listeners.

---

## 🔌 API Routes
Las interacciones del motor exponen rutas de alto nivel bajo `/api/*`:

*   **`GET /api/models` y `POST /api/models`**: Orquesta la carga de plantillas que inician la invocación interna a `syncFlowiseCredential`.
*   **`GET /api/agents` y `PUT /api/agents/:id`**: Acciones exclusivas del desarrollador para enlazar qué herramientas (Model IDs) y embbedings se insertan bajo los Agent Slots, levantando finalmente `syncFlowiseChatflow()`.
*   **`POST /api/knowledge`**: Uploading system (Sube los archivos PDF a `./uploads` con Multer).
*   **`DELETE /api/models/:id`**: Purga de BBDD que también se encarga de ir tras el UUID de Flowise y fulminar sus bóvedas para prevenir recursos zombies en nube.
