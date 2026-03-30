# Documentación del Frontend (Aplicación Cliente)

El Frontend de **Agent Platform** es una _Single Page Application_ (SPA) desarrollada robustamente sobre React y empaquetada con Vite para un rendimiento extremadamente rápido y Hot Module Replacement nativo.

## 📦 Tecnologías y Dependencias Principales

*   **React (v19.x)**: Biblioteca central para la orquestación e inyección reactiva de la interfaz de usuario.
*   **Vite**: Construcción veloz y entorno de despliegue ultrarrápido (servidor en puerto 3000).
*   **React Router DOM (v7.x)**: Enrutador del lado del cliente utilizado en el `<App/>`, dividiendo lógicamente los paneles en páginas (Ej. Modelos, Agentes, Knowledge Bases).
*   **Axios**: Cliente HTTP para consumos centralizados hacia endpoints en la misma red de Docker (`/api/models`, `/api/agents`). Facilita el manejo de excepciones mediante `.catch`.
*   **Lucide-React**: Colección robusta de íconos inyectados para una Experiencia de Usuario prolija.

---

## 🧭 Enrutamiento y Estructura Base (`src/App.jsx`)

La estructura de vistas de la plataforma se compone típicamente de componentes modulares ubicados en `src/pages/`. La aplicación asume una navegación estructurada:

*   **`/agents` (`Agents.jsx`)**: El panel maestro del desarrollador/administrador donde configura las asignaciones de herramientas (LLMs y Embeddings) creadas en perfiles lógicos antes de su envío dinámico a Flowise.
*   **`/llms` (`LLMs.jsx`)**: Área de configuración de modelos de Lenguaje principal. Aquí los clientes pueden administrar sus llaves maestras e insertar sus claves API de OpenAI y/o Google, seleccionando su modelo preferido (Ej: `gpt-4o`, `gemini-1.5-flash`).
*   **`/embeddings` (`EmbeddingModels.jsx`)**: Gestión espejo a la de LLMs pero especializada en motor de Vectores. Configura qué servicio procesará y comparará el conocimiento del cliente.
*   **`/knowledge` (`KnowledgeBases.jsx`)**: Portal de almacenamiento para archivos, enfocada en la ingesta del sistema RAG. Procesa documentos, PDFs o textos que serán inyectados como conocimiento empresarial en Flowise.

---

## 🔄 Componentes Reutilizables y Modales (`ModelModal.jsx`)

El gran pilar interactivo de los paneles son los "Componentes Controlados", siendo **`ModelModal.jsx`** el principal gestor criptográfico a los ojos del frontend. 
Se encarga de procesar la intención del usuario a nivel visual:

1. **Gestión de Sesión UI**: Aparece condicionalmente (`display: block` visualmente hablando) al agregar o editar un ítem en las grillas UI principales. Reutilizable tanto para LLMs como Embeddings.
2. **Formularios Dinámicos Controlados**: Mapea los `inputs` hacia un estado (`useState`). Evalúa en tiempo real si el cliente eligió *OpenAI* o *Google* en el campo de `Provider`, reaccionando nativamente a la elección mostrando u ocultando opciones de modelo contextualizadas (`gpt4o` vs `gemini-pro`).
3. **Ofuscación de Keys en Memoria**: Permite ingresar y sobreescribir API Keys (`geminiApiKey`/`openAIApiKey`), pero la comunicación hacia el backend se encarga de empaquetar en cuerpo `payload` toda la clave sin quemar nada en el cliente local.
4. **Sincronización (`handleSubmit`)**: Al salvar, intercepta el `onSubmit`. Usa Axios para procesar un POST / PUT e invocar indirectamente todo el motor Flowise del Backend. Retorna un feedback visual en la grilla usando modales y re-fetching de los estados de la base de datos (Ej: `fetchModels()`).

---

## 🎨 Lógica de Diseño y Componentización

*   **Gestión de Estado**: Todos los grids en `pages/` (ej. `[models, setModels] = useState([])`) inicializan sus listados de datos consumiendo un `GET /api` nativo contenido dentro de un `useEffect` que corre únicamente al montar la interfaz.
*   **Modularidad**: Los componentes no mezclan lógica de negocios (como transformaciones de nodos) dentro del JSX. Todo lo respectivo a inyecciones a Flowise, el cifrado AES de contraseñas, o manipulación de "edges" del canvas Graph, fue delegado en su totalidad a los controllers del Backend Express.
*   **Experiencia de Usuario**: Incorpora patrones visuales de tabla, botones de alerta en iconos (Lucide React) para acciones destructivas (`Trash2`), opciones de edición rápida (`Edit2`), y transiciones al abrir/cerrar los Modals que se alimentan de TailwindCSS o Vanilla CSS (el cual maneja la opacidad de los fondos Overlay).
