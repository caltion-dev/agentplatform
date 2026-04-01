# Documentación Técnica: Integración SAP FI-AR (Mock)

Esta especificación describe los endpoints de la API de SAP simulada para el **CollectionsNotifyAgent**. Estos endpoints están diseñados para ser consumidos por **n8n** en los procesos de notificación de cobranzas.

## 1. Consultar Partidas Abiertas (BSID)

Obtiene el listado técnico de documentos contables pendientes de pago para una sociedad específica.

- **Endpoint**: `GET /api/sap/open-items`
- **Parámetros de Consulta**:
    - `bukrs`: (Opcional) Código de sociedad SAP (ej: `1000`).
- **Finalidad**: Identificar qué clientes tienen deudas acumuladas y qué facturas específicas deben ser notificadas.
- **Lógica de Negocio (Filtros)**:
    - `AUGBL = ''`: Solo partidas no compensadas.
    - `BSCHL IN ('01', '11')`: Solo facturas (01) y notas de crédito (11).
- **Nota**: Se excluyen las partidas "Pago de Deudores" (BSCHL = '15').

### Ejemplo de Respuesta:
/api/sap/open-items

/api/sap/open-items?bukrs=2000

```json
[
  {
    kunnr: "10000001",
    bukrs: "2000",
    belnr: "18000011",
    bldat: "2025-03-05T03:00:00.000Z",
    faedt: "2025-03-05T03:00:00.000Z",
    dmbtr: "-250.00",
    waers: "USD",
    augbl: "",
    zterm: "NT30",
    bschl: "11"
  }
]
```

## 2. Consultar Contacto del Cliente (Tablas KNA1 / KNVK)

Obtiene los datos maestros generales del deudor y sus personas de contacto registradas para cobranzas (Campo KUNNR).

- **Endpoint**: `GET /api/sap/customer-contact/:kunnr`
- **Parámetros de Ruta**:
    - `:kunnr`: Número de identificación del cliente SAP (10 dígitos).
- **Finalidad**: Obtener el nombre legal, idioma y correo electrónico de la persona encargada de los pagos para el envío del mail.

### Ejemplo de Respuesta:

/api/sap/customer-contact/10000001

```json
{
  "master": {
    "kunnr": "10000001",
    "name1": "Tech Solutions S.A.",
    "smtp_addr": "facturacion@techsolutions.cl",
    "spras": "S",
    "land1": "CL"
  },
  "contacts": [
    {
      "pafkt": "AP",
      "namev": "Juan",
      "name1": "Perez",
      "smtp_addr": "jperez@techsolutions.cl"
    }
  ]
}
```

## 3. Registro de Log de Actividad (Auditoría)

Registra el resultado de cada acción automatizada realizada por n8n en nombre del agente.

- **Endpoint**: `POST /api/agent/logs`
- **Cuerpo (JSON)**:
    - `agent_name`: Nombre del agente (ej: `CollectionsNotifyAgent`).
    - `kunnr`: Número de cliente afectado.
    - `action`: Acción realizada (ej: `SEND_EMAIL`).
    - `status`: Estado del resultado (`SUCCESS`, `FAILED`, `PENDING`).
    - `detail`: Descripción textual del evento.
- **Finalidad**: Proporcionar trazabilidad histórica y auditoría para controlar que el sistema esté enviando las notificaciones correctamente.

### Ejemplo de Envío (n8n):
```json
{
  "agent_name": "CollectionsNotifyAgent",
  "kunnr": "10000001",
  "action": "SEND_EMAIL",
  "status": "SUCCESS",
  "detail": "Factura 18000010 notificada con éxito a Juan Perez."
}
```

---
**Nota Técnica**: El host actual del proyecto es `dev.agentplatform.erpconsultingsap.com`.
