# Finalidad del Proyecto: Agent Platform

Este documento detalla la visión, objetivos, funcionalidades clave y arquitectura subyacente de la plataforma.

## 1. Visión Core: Orquestador de Roles Separados

La idea central del proyecto es funcionar como un **orquestador de agentes delegados**. Esto permite una clara separación de responsabilidades entre proveedor y cliente:

1. **Gestión de IA (Responsabilidad del Cliente):** El cliente tiene control directo sobre sus costos y su privacidad. En el panel proveído, el cliente es el encargado de dar de alta sus propias *API Keys* (OpenAI, Gemini), así como configurar qué **Modelos de Lenguaje (LLMs)** y qué **Modelos de Embeddings** (si son necesarios) va a utilizar.
2. **Desarrollo de Agentes (Responsabilidad del Equipo de Desarrollo):** El equipo de desarrollo se encarga de definir, programar y administrar la lógica de los Agentes. Estos agentes realizan tareas automáticas específicas previamente solicitadas por el cliente. El cliente se desentiende de la complejidad de cómo funciona el agente internamente, limitándose únicamente a configurarle su motor cognitivo ("el cerebro").

## 2. Cómo Funciona el Código y la Arquitectura

Para lograr esta desconexión sin problemas técnicos, el código fuente cuenta con una arquitectura diseñada para abstraer las complejidades:

- **Panel de Control (Frontend en React/Vite):** Posee secciones intuitivas para que el cliente configure sus LLMs, Embeddings y Knowledge Bases (Bases de Conocimiento via archivos). Tiene también un panel de **Agentes** donde se le asigna el LLM al agente correspondiente en un solo clic.
- **Servidor Orchestrador (Backend Node/Express):**  Hace el trabajo pesado de sincronización. Las API Keys del cliente **jamás se guardan en texto plano**, pasan por una función de cifrado (AES-256) en una base de datos PostgreSQL (`server/utils/encryption.js`) y simultáneamente se inyectan a la bóveda de credenciales de **Flowise** mediante su API.
- **Integración Transparente con Flowise (Hot-Swapping):** Cuando un Agente es modificado en el Panel para usar un nuevo modelo de lenguaje, el Backend intercepta el pipeline del chatbot en Flowise en tiempo real. Reescribe la estructura interna del JSON del flujo para empalmar la nueva configuración y llaves del cliente. Así logramos un **"Hot-Swap"** total sin necesidad de redeploy ni tocar código.

## 3. Capacidades de los Agentes Especializados

Estos agentes (desarrollados a medida por el equipo) pueden dividirse según su enfoque operativo:
- **Agentes de Consulta/Análisis**: Conectividad con bases de datos internas (vía n8n o consulta directa) para procesar información estructurada (ej. reportes de ventas, facturación).
- **Agentes Conversacionales (Chat)**: Atención al cliente en tiempo real o soporte técnico, utilizando **RAG** (Retrieval-Augmented Generation) para leer los documentos subidos por el cliente en su interfaz.

## 4. Flexibilidad Comercial de Despliegue

La plataforma está diseñada para satisfacer necesidades rigurosas de seguridad en el ámbito B2B:
- **SaaS**: Uso en la nube alojado centralmente.
- **On-Premise**: Instalación completamente delegada a servidores del cliente para el máximo resguardo de datos sensibles e industriales (ej. integraciones de SAP, Recursos Humanos y Finanzas).
