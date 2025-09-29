# Sofftek Reto Backend — AWS Serverless (Node.js 20)

> API RESTful desplegable en AWS Lambda con Serverless Framework. Integra **SWAPI** + **Wikipedia** para entregar datos “fusionados”, guarda historial, permite almacenar recursos propios y expone documentación OpenAPI/Swagger. Incluye **cache**, **rate‑limit**, **JWT** para endpoints protegidos, **logs estructurados** y **trazado X‑Ray**.

---

## 📦 Tech Stack

- **Runtime:** Node.js 20 (TS)
- **Framework:** Serverless Framework v3 + serverless‑offline + esbuild
- **AWS:** Lambda, API Gateway (HTTP API), DynamoDB (3 tablas), CloudWatch Logs, X‑Ray
- **Auth:** JWT (HS256)
- **Testing:** Jest
- **Lint/Format:** ESLint + Prettier
- **Docs:** OpenAPI JSON + Swagger UI

---

## 🧭 Arquitectura (alto nivel)

```
Client → API Gateway (HTTP API)
   → Lambda handlers (TypeScript)
      → SWAPI + Wikipedia (fetch)
      → Cache (DynamoDB: CacheTable, TTL 30 min)
      → Historial (DynamoDB: HistoryTable)
      → Almacenamiento custom (DynamoDB: StorageTable)
Observabilidad → CloudWatch (logs pino) + AWS X‑Ray (tracing)
Seguridad → JWT (POST /almacenar, GET /historial)
Protección → Rate limiting por IP/clave en /fusionados (DynamoDB atomic counter)
```

---

## 📁 Estructura de carpetas (resumen)

```
src/
 ├─ clients/                 # Integraciones externas (SWAPI, Wikipedia)
 ├─ core/                    # auth, cache, db, logger
 ├─ handlers/                # Lambdas HTTP (fusionados, almacenar, historial, auth, docs)
 ├─ middlewares/             # requireAuth, rateLimit
 ├─ models/                  # tipos TS de dominio (fusion.types.ts)
 ├─ utils/                   # helpers HTTP, wrappers (withJson)
 └─ docs/                    # openapi builder + UI
tests/                       # Jest (unit/integration)
serverless.yml               # Infra (Lambda + API GW + Dynamo + IAM)
package.json                 # scripts y dependencias
```

---

## 🔌 Endpoints

| Método | Path            |  Auth  | Descripción                                                                                      |
| -----: | --------------- | :----: | ------------------------------------------------------------------------------------------------ |
|    GET | `/fusionados`   |   No   | Consulta SWAPI + Wikipedia, fusiona datos, usa **cache** (30 min) y **rate‑limit** configurable. |
|   POST | `/almacenar`    | Bearer | Guarda un recurso propio `{ name, email?, notes? }` en **StorageTable**.                         |
|    GET | `/historial`    | Bearer | Lista histórico de llamadas a `/fusionados` (paginado/desc).                                     |
|   POST | `/auth/login`   |   No   | Retorna **JWT** (usar en `Authorization: Bearer <token>`).                                       |
|    GET | `/openapi.json` |   No   | Especificación OpenAPI.                                                                          |
|    GET | `/docs`         |   No   | Swagger UI servido estáticamente.                                                                |

### Parámetros y ejemplos

**GET `/fusionados`**  
Query:

- `q` (**requerido**) — nombre a buscar.
- `resource` (opcional) — `people` (default) ó `planets`.

Ejemplos:

```bash
# Personas (por defecto)
curl "http://localhost:3000/fusionados?q=Luke%20Skywalker"

# Planetas
curl "http://localhost:3000/fusionados?q=Tatooine&resource=planets"
```

Respuesta (200 / 404):

```json
{
  "base": {
    /* SWAPI person|planet */
  },
  "wiki": {
    /* resumen de Wikipedia */
  },
  "fetchedAt": "2025-09-28T12:34:56.000Z",
  "_cache": "HIT|MISS"
}
```

**POST `/auth/login`**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"S0fftek!"}'
# → { "access_token":"...", "token_type":"Bearer", "expires_in":7200 }
```

**POST `/almacenar`** (protegido)

```bash
TOKEN="..."
curl -X POST http://localhost:3000/almacenar \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","notes":"first programmer"}'
# → 201 { "id":"<uuid>", "name":"...", "createdAt":"..." }
```

**GET `/historial?limit=10&cursor=<sk>`** (protegido)  
Retorna `{ items: [...], nextCursor }` ordenado desc (por `sk`).

---

## ⚙️ Variables de entorno

Estas se definen en `serverless.yml` y pueden sobreescribirse por `env`:

| Variable        | Default (dev)                  | Uso                                                  |
| --------------- | ------------------------------ | ---------------------------------------------------- |
| `LOG_LEVEL`     | `debug`                        | Nivel de logs pino.                                  |
| `JWT_SECRET`    | `dev-change-me-please-32bytes` | Secreto HS256 para firmar JWT. **Cambiar en prod.**  |
| `AUTH_USERNAME` | `admin`                        | Usuario demo para `/auth/login`.                     |
| `AUTH_PASSWORD` | `S0fftek!`                     | Password demo para `/auth/login`.                    |
| `RL_FUSIONADOS` | `5`                            | Límite de requests por ventana en `/fusionados`.     |
| `RL_WINDOW`     | `60`                           | Ventana (segundos) del rate‑limit.                   |
| `CACHE_TABLE`   | `${service}-${stage}-cache`    | DynamoDB (TTL en `expiresAt`).                       |
| `HISTORY_TABLE` | `${service}-${stage}-history`  | DynamoDB historial (pk=`fusionados`, sk=`ISO#uuid`). |
| `STORAGE_TABLE` | `${service}-${stage}-storage`  | DynamoDB para recursos propios.                      |

> **Nota:** `serverless-offline` respeta `process.env`. Puedes usar `cross-env` o `.env.local` en tu terminal antes de ejecutar.

---

## 🧪 Tests

- Ejecutar: `npm test`
- Ubicación: `tests/**`
- Se incluyen pruebas unitarias de handlers y clientes (mock de AWS SDK y fetch externos).

---

## 💻 Ejecución local

1. Instalar dependencias:

```bash
npm ci
```

2. Arrancar en local (serverless‑offline):

```bash
npm run dev
# ➜ http://localhost:3000/docs  y  http://localhost:3000/openapi.json
```

3. Flujo típico en local:

- `POST /auth/login` → copiar `access_token`
- `GET /fusionados?q=...` (ver `X-Cache` headers)
- `POST /almacenar` con `Authorization: Bearer <token>`
- `GET /historial` con token
- Navegar la documentación en `/docs`

---

## ☁️ Despliegue en AWS

**Pre‑requisitos**

- AWS CLI v2 autenticado
- Crear un **perfil** (escoge **uno** y úsalo consistente):
  - `aws configure --profile sofftek` **o** `aws configure --profile dev`
- Permisos: crear/actualizar CloudFormation, Lambda, API GW y DynamoDB

**Deploy**

```bash
# Si usas el perfil 'sofftek' (recomendado, coincide con --aws-profile):
AWS_PROFILE=sofftek AWS_SDK_LOAD_CONFIG=1 npx serverless deploy --stage dev --aws-profile sofftek

# O con npm script (ajusta el perfil si cambiaste el nombre):
npm run deploy:dev
```

**Eliminar (teardown)**

```bash
npm run remove:dev
```

> 💡 Si ves `AWS profile "dev" doesn't seem to be configured`, verifica que el perfil que pasas en `AWS_PROFILE` y `--aws-profile` exista y sea el **mismo nombre** (evita mezclar `dev` y `sofftek`).

---

## 🗃️ Modelo de datos (DynamoDB)

- **CacheTable**
  - `pk` (HASH) → `cache#<resource>#<q>`
  - `expiresAt` (TTL) → auto‑purga (~30 min por defecto)
  - `payload` → resultado serializado

- **HistoryTable**
  - `pk` (HASH) → `"fusionados"`
  - `sk` (RANGE) → `ISO-8601#uuid` (orden descendente para consulta reciente)
  - Atributos: `resource`, `q`, `hasBase`, `hasWiki`, `cacheSource`, `durationMs`

- **StorageTable**
  - `pk` (HASH) → `item#<uuid>`
  - Atributos: `id`, `name`, `email?`, `notes?`, `createdAt`

---

## 🔒 Autenticación y autorización

- `POST /auth/login` valida `AUTH_USERNAME`/`AUTH_PASSWORD` y entrega JWT.
- En endpoints protegidos enviar `Authorization: Bearer <token>`.
- Firma HS256 con `JWT_SECRET`. **Usa un secreto robusto en producción.**

---

## 🛡️ Rate limiting

- Middleware `enforceRateLimit` guarda un contador por ventana en `CacheTable` con `UpdateItem` atómico.
- Configurable con `RL_FUSIONADOS` (p.ej. `5`) y `RL_WINDOW` (p.ej. `60` segundos).
- Respuestas 429 cuando se supera el límite.

---

## 📈 Observabilidad

- **Logs**: Pino JSON (contexto → `component`, `reqId`, `path`…), visibles en CloudWatch y en consola local.
- **Trazas**: `tracing.lambda` y `tracing.apiGateway` activados (X‑Ray).

---

## 🧰 Comandos útiles

```bash
# Formatear/Lint
npm run format
npm run lint
npm run lint:fix

# Empaquetar sin desplegar
npm run build
```

---

## 🗺️ Importar a Postman/Insomnia

- Importa `http://localhost:3000/openapi.json` (o la URL en AWS) para generar la colección automáticamente.
- Explora `/docs` con Swagger UI para probar endpoints desde el navegador.

---

## 🚀 Roadmap (ideas de mejora)

- Secrets en **AWS Secrets Manager** / SSM Parameter Store.
- Pruebas E2E/nube (con `serverless` y `@aws-sdk` real).
- Healthcheck público y métricas (p99 latencias).
- Alertas en CloudWatch (errores, throttling, 4xx/5xx).
- Cache con **DAX** o Redis (ElastiCache) si aplica.
- CI/CD (GitHub Actions) con despliegues por rama/etiqueta.

---

## ⚖️ Licencia

Uso educativo y de evaluación técnica. © 2025
