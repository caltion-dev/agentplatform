# Arquitectura y Entorno de Desarrollo (Docker)

La aplicación **Agent Platform** utiliza una arquitectura moderna basada en contenedores para garantizar que el entorno de desarrollo sea idéntico al de producción, integrándose fluidamente con un proxy inverso (Traefik) y herramientas de recarga en caliente (Hot Module Replacement - HMR) para el frontend.

---

## 🏗️ Topología del Sistema

El ecosistema está construido sobre los siguientes pilares:
1. **Frontend**: React + Vite (Puerto interno 3000)
2. **Backend**: Express.js + Node.js (Puerto interno 3001)
3. **Plataforma Externa/Motor**: Flowise (Desplegado en otra instancia, se nutre dinámicamente mediante la API de Agent Platform)
4. **Base de Datos**: PostgreSQL (`schema: desarrollo`), compartida u orquestada de forma independiente, persistiendo la metadata de agentes, credenciales y referencias de IA.

---

## 🐳 Estructura de Contenedores y Orquestación

El orquestador local en desarrollo gestiona el código a través de un único contenedor unificado (`app`) que empaqueta tanto el servidor frontend (Vite) como el servidor backend (Express).

### 1. `Dockerfile` (Node 24.8.0 Bookworm)
El contenedor se basa en Debian Bookworm corriendo Node 24.8.
- **Preparación**: Copia proactiva de los archivos `package.json` y `package-lock.json` para aprovechar la caché de capas de Docker.
- **Instalación de Dependencias**: Ejecuta `npm install` instalando tanto `dependencies` (Express, Axios, React) como `devDependencies` (Vite, Rollup). Es crítico en desarrollo usar `--include=dev` para permitir que los scripts de Webpack/Vite funcionen internamente.
- **Puertos**: Expone internamente el `3000` (React/Vite) y el `3001` (Node/Express).
- **Control de Arranque**: El Entrypoint se sobrescribe en desarrollo usando un script que lanza paralelamente Vite y Node:
  ```bash
  npm run start:server & npm run dev -- --port 3000 --host
  ```

### 2. `docker-compose.yml` (agentplatform-dev)
El compendio del contendor levanta el servicio llamado `app`. Define características potentes para una experiencia de desarrollo en vivo (Live Reloading).

* **Volumes (Live Sync)**: 
  Mapea de forma bidireccional la carpeta física `./code` al entorno virtual `/workspace`. Cualquier cambio que los desarrolladores guarden en su editor local se refleja casi a la velocidad de la luz dentro del contenedor.
* **Redes (Networks)**: 
  El proyecto se ancla a redes puente personalizadas (`caltion_network`, `net_prod`). Esto permite comunicación cifrada o interna con otros contenedores (por ejemplo, con instancias locales de Flowise o bases de datos sin exponerlas al localhost directamente).

### 3. Traefik (Proxy Inverso Dinámico y SSL)
El `docker-compose.yml` incluye meta-etiquetas (Labels) críticas del ecosistema **Traefik**. En lugar de asignar puertos estáticos (ej. `localhost:3000`), Traefik analiza dinámicamente el host entrante:
- **Regla Frontend**: Todo el tráfico HTTP/HTTPS a `dev.agentplatform.erpconsultingsap.com` es dirigido exclusivamente al entorno Vite (Puerto 3000).
- **Regla Backend (API)**: Si la ruta tiene el prefijo `/api` (ej. `dev...sap.com/api/models`), Traefik intercepta el paquete y lo enruta microscópicamente al puerto 3001 (Express).
- **Seguridad**: Configura redirecciones `websecure` y la resolución transparente de certificados SSL Let's Encrypt (`tls.certresolver=letsencrypt`).

## ⚙️ Flujo de Peticiones (Data Flow)

1. Cliente web navega a `dev.agentplatform.erpconsultingsap.com`
2. **Traefik** responde con el bundle de React empaquetado por Vite.
3. El frontend SPA inicia y el usuario realiza una modificación en la configuración de un LLM.
4. El Axios interactivo de React envía un POST a `dev.agentplatform.erpconsultingsap.com/api/models`.
5. **Traefik** detecta `/api`, intercepta, y manda el request al contenedor pero ahora al hilo del backend en el puerto 3001.
6. **Backend (Express)** procesa:
   - Sincroniza configuraciones secretas con **Flowise** (POST `https://flowise.../api/v1/...`).
   - Modifica los **Flowise Edges/Nodos** (nuestro innovador Hot-Swapping dinámico).
   - Registra de forma segura los AES keys en **PostgreSQL**.
7. Backend responde HTTPS 200 al Frontend.
