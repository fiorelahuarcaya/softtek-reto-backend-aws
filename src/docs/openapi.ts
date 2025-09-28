// src/docs/openapi.ts
export type OpenAPIObject = Record<string, any>;

/** Construye el spec e inyecta el basePath del stage (/dev, '' si $default) */
export function buildOpenApi(basePath: string = "/"): OpenAPIObject {
  return {
    openapi: "3.0.3",
    info: {
      title: "Reto Backend Node.js/AWS",
      version: "1.0.0",
      description:
        "API RESTful desplegada en AWS Lambda (HTTP API). Incluye autenticación JWT, endpoints protegidos y endpoint público con rate-limit y caché.",
    },
    servers: [
      {
        url: "https://{apiId}.execute-api.{region}.amazonaws.com",
        variables: {
          apiId: { default: "8q6zu647xl" },
          region: { default: "us-east-2" },
        },
      },
      { url: "http://localhost:3000" },
    ],
    paths: {
      "/auth/login": {
        post: {
          summary: "Login y obtención de JWT",
          operationId: "login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
                examples: {
                  ok: { value: { username: "demo", password: "secret" } },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Autenticación exitosa",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LoginResponse" },
                },
              },
            },
            "400": {
              description: "Body inválido",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Credenciales inválidas",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Fallo interno de login",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/almacenar": {
        post: {
          summary: "Almacenar item personalizado",
          operationId: "storeItem",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StoreItemRequest" },
                examples: {
                  ok: {
                    value: {
                      name: "Leia Organa",
                      email: "leia@rebellion.org",
                      notes: "Priority contact",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Creado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/StoreItemResponse" },
                },
              },
            },
            "400": {
              description: "Body inválido (Zod)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorWithIssues" },
                },
              },
            },
            "401": {
              description: "Token faltante o inválido",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Error al guardar",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/historial": {
        get: {
          summary: "Listar historial de consultas a /fusionados",
          operationId: "getHistory",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "limit",
              in: "query",
              description: "Máximo de ítems (1-100). Default 10.",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
              },
            },
            {
              name: "cursor",
              in: "query",
              description:
                "Cursor (LastEvaluatedKey.sk) para paginar hacia adelante",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HistoryResponse" },
                },
              },
            },
            "401": {
              description: "Token faltante o inválido",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Error en la consulta de historial",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/fusionados": {
        get: {
          summary: "Fusiona datos de SWAPI con Wikipedia",
          operationId: "getFusion",
          parameters: [
            {
              name: "resource",
              in: "query",
              description: "Recurso base a consultar en SWAPI",
              schema: {
                $ref: "#/components/schemas/FusionResource",
                default: "people",
              },
            },
            {
              name: "q",
              in: "query",
              required: true,
              description: "Término de búsqueda (nombre de persona o planeta)",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Encontrado (con o sin wiki)",
              headers: {
                "X-Cache": {
                  schema: { type: "string", enum: ["Hit", "Miss"] },
                  description: "Resultado servido desde caché interna o no",
                },
                "X-Cache-Source": {
                  schema: { type: "string" },
                  description: "Detalle de la fuente de caché",
                },
              },
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FusionResult" },
                },
              },
            },
            "404": {
              description: "No se encontró el recurso base en SWAPI",
              headers: {
                "X-Cache": {
                  schema: { type: "string", enum: ["Hit", "Miss"] },
                },
                "X-Cache-Source": { schema: { type: "string" } },
              },
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FusionResult" },
                },
              },
            },
            "400": {
              description: "Parámetro q faltante",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "429": {
              description: "Rate limit excedido",
              headers: {
                "Retry-After": {
                  schema: { type: "integer" },
                  description:
                    "Segundos a esperar antes de reintentar (si tu middleware lo incluye)",
                },
              },
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Error interno",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
          additionalProperties: false,
        },
        ErrorWithIssues: {
          type: "object",
          properties: {
            message: { type: "string" },
            issues: { type: "object", description: "Zod error format()" },
          },
          additionalProperties: true,
        },
        LoginRequest: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string" },
            password: { type: "string", format: "password" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            access_token: { type: "string" },
            token_type: { type: "string", example: "Bearer" },
            expires_in: { type: "integer", example: 7200 },
          },
          required: ["access_token", "token_type", "expires_in"],
        },
        StoreItemRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            notes: { type: "string", maxLength: 2000 },
          },
          additionalProperties: false,
        },
        StoreItemResponse: {
          allOf: [
            { $ref: "#/components/schemas/StoreItemRequest" },
            {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                createdAt: { type: "string", format: "date-time" },
              },
              required: ["id", "createdAt"],
            },
          ],
        },
        FusionResource: {
          type: "string",
          enum: ["people", "planets"],
        },
        WikiSummary: {
          type: "object",
          description:
            "Resumen de Wikipedia (estructura simplificada; puede contener más campos)",
          properties: {
            title: { type: "string" },
            extract: { type: "string" },
            lang: { type: "string" },
          },
          additionalProperties: true,
        },
        SWPerson: {
          type: "object",
          description: "Persona de SWAPI (parcial)",
          properties: {
            name: { type: "string" },
            height: { type: "string" },
            mass: { type: "string" },
            gender: { type: "string" },
            birth_year: { type: "string" },
            homeworld: { type: "string" },
          },
          additionalProperties: true,
        },
        SWPlanet: {
          type: "object",
          description: "Planeta de SWAPI (parcial)",
          properties: {
            name: { type: "string" },
            climate: { type: "string" },
            terrain: { type: "string" },
            population: { type: "string" },
          },
          additionalProperties: true,
        },
        FusionResult: {
          type: "object",
          properties: {
            base: {
              oneOf: [
                { $ref: "#/components/schemas/SWPerson" },
                { $ref: "#/components/schemas/SWPlanet" },
              ],
              nullable: true,
            },
            wiki: { $ref: "#/components/schemas/WikiSummary", nullable: true },
            fetchedAt: { type: "string", format: "date-time" },
            _cache: {
              type: "string",
              description: "Fuente de caché (p.ej. MISS/HIT)",
            },
          },
          required: ["fetchedAt"],
        },
        HistoryItem: {
          type: "object",
          properties: {
            pk: { type: "string", example: "fusionados" },
            sk: { type: "string", description: "timestamp#uuid" },
            resource: { $ref: "#/components/schemas/FusionResource" },
            q: { type: "string" },
            hasBase: { type: "boolean" },
            hasWiki: { type: "boolean" },
            cacheSource: { type: "string" },
            durationMs: { type: "integer" },
          },
          additionalProperties: true,
        },
        HistoryResponse: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/HistoryItem" },
            },
            nextCursor: { type: "string", nullable: true },
          },
          required: ["items"],
        },
      },
    },
  };
}
