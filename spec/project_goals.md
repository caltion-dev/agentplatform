# Finalidad del Proyecto: Agent Platform

Este documento detalla la visión, objetivos y funcionalidades clave de la plataforma.

## 1. Centralización de Modelos (Agregador)
Crear un panel de administración donde se puedan dar de alta y gestionar distintos **LLMs** (GPT-4, Claude, Gemini) y **modelos de Embeddings**.
- Almacenamiento seguro de configuraciones y API Keys.
- Interfaz unificada para la gestión de proveedores.

## 2. Abstracción de IA
Permitir el cambio de modelos "en caliente" (hot-swapping).
- Cambiar el cerebro de un agente con un solo clic desde el panel.
- Flexibilidad para alternar entre modelos comerciales (OpenAI) y modelos locales (Ollama) sin modificar el código fuente.

## 3. Agentes Especializados por Tareas
Desarrollo de agentes con capacidades específicas:
- **Agentes de Consulta/Análisis**: Conectividad con bases de datos (vía n8n o consulta directa) para procesar información estructurada (ej. reportes de ventas).
- **Agentes Conversacionales (Chat)**: Atención al cliente o soporte técnico utilizando **RAG** (Retrieval-Augmented Generation) para memoria técnica.

## 4. Doble Interfaz
- **Panel de Admin**: Gestión de infraestructura ("fierros"), configuración de modelos, llaves y prompts base.
- **Panel de Usuario**: Interfaz simplificada para el cliente final, enfocada en la ejecución y resultados de sus agentes sin la complejidad técnica subyacente.

## 5. Flexibilidad de Despliegue (PoC para Ventas)
Diseñado para adaptarse a diferentes escenarios comerciales:
- **SaaS**: Gestionado centralmente.
- **On-Premise**: Instalación en servidores del cliente para máxima privacidad de datos sensibles (SAP, Ventas, etc.).
