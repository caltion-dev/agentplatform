# Manual de Sincronización de Credenciales (n8n & Flowise)

Este documento detalla el funcionamiento técnico de la gestión de credenciales en la plataforma y cómo se sincronizan automáticamente con los orquestadores externos.

## 1. Flujo Automatizado

Cada vez que realizas una acción en el panel de **"Models"**, la plataforma dispara eventos de sincronización:

- **Alta (POST)**: Se crea la credencial en Flowise y n8n. Los IDs resultantes se guardan en la tabla `desarrollo.providers`.
- **Modificación (PUT)**: Se actualiza la API Key en ambos orquestadores. Si la credencial no existe (error 404), el sistema la **re-crea** automáticamente.
- **Baja (DELETE)**: Se eliminan las credenciales de n8n y Flowise para evitar acumulación de basura técnica.

## 2. Mapeo de Proveedores

Para garantizar la compatibilidad, el sistema traduce los nombres de proveedores a los tipos internos requeridos:

| Proveedor | Tipo n8n | Tipo Flowise |
| :--- | :--- | :--- |
| **OpenAI** | `openAiApi` | `openAIApi` |
| **Google Gemini** | `googlePalmApi` | `googleGenerativeAI` |

> [!IMPORTANT]
> Para Gemini en n8n, el sistema inyecta automáticamente el host `generativelanguage.googleapis.com`.

## 3. Sincronización Manual (Recuperación)

Si una credencial se borra accidentalmente en n8n o Flowise pero sigue existiendo en la plataforma, tenés dos formas de recuperarla:

### A. Desde la Interfaz (Individual)
1.  Andá a **Models**.
2.  Buscá el modelo afectado y dale a **Edit**.
3.  Volvé a introducir la **API Key** y dale a **Save**.
4.  El sistema detectará que la credencial falta en el orquestador y la re-creará.

### B. Desde la Terminal (Masiva)
Hemos creado un script de mantenimiento que podés ejecutar para sincronizar **todos** los proveedores a la vez:

```bash
# Ejecutar desde la raíz del proyecto
node scripts/sync_all_credentials.js
```

## 4. Estructura de Datos (Base de Datos)

Las credenciales se almacenan en la tabla `desarrollo.providers`:
- `flowise_credential_id`: ID vinculado a Flowise.
- `n8n_credential_id`: ID vinculado a n8n.
- `api_key_encrypted`: La llave encriptada (AES-256).
