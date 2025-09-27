// src/docs/openapi.ts
export type OpenAPIObject = Record<string, any>;

/** Construye el spec e inyecta el basePath del stage (/dev, '' si $default) */
export function buildOpenApi(basePath: string = "/"): OpenAPIObject {
  return {
    openapi: "3.0.3",
    info: {
      title: "Sofftek Reto Backend API",
      version: "1.0.0",
      description:
        "API RESTful del reto (Lambda + API Gateway). Fusiona SWAPI + Wikipedia, almacena items y lista historial.",
    },
    servers: [{ url: basePath }],
    tags: [
      { name: "fusion", description: "Combina SWAPI y Wikipedia" },
      { name: "storage", description: "Almacenamiento de datos" },
      { name: "history", description: "Historial de consultas" },
    ],
    paths: {
      "/fusionados": {
        get: {
          tags: ["fusion"],
          summary: "Fusiona datos de SWAPI y Wikipedia",
          parameters: [
            {
              name: "resource",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["people", "planets"] },
              description: "Tipo de recurso (por defecto people).",
            },
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Texto de búsqueda (nombre).",
            },
          ],
          responses: {
            "200": {
              description: "Resultado de la fusión",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FusionResult" },
                },
              },
            },
            "400": {
              description: "Falta parámetro q",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "No se encontró el recurso en SWAPI",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FusionResult" },
                },
              },
            },
          },
        },
      },
      "/almacenar": {
        post: {
          tags: ["storage"],
          summary: "Valida y almacena un ítem",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StorageInput" },
              },
            },
          },
          responses: {
            "201": {
              description: "Ítem creado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/StorageItem" },
                },
              },
            },
            "400": {
              description: "Body inválido",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Error al guardar",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/historial": {
        get: {
          tags: ["history"],
          summary: "Lista entradas del historial",
          parameters: [
            {
              name: "limit",
              in: "query",
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
              schema: { type: "string" },
              description: "sk del último ítem (paginación)",
            },
          ],
          responses: {
            "200": {
              description: "Página de historial",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: { $ref: "#/components/schemas/HistoryItem" },
                      },
                      nextCursor: { type: "string", nullable: true },
                    },
                  },
                },
              },
            },
            "500": {
              description: "Error interno",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
        WikiSummary: {
          type: "object",
          properties: {
            title: { type: "string" },
            extract: { type: "string" },
            url: { type: "string", nullable: true },
            thumbnail: { type: "string", nullable: true },
          },
        },
        SWPerson: {
          type: "object",
          properties: {
            name: { type: "string" },
            height: { type: "string" },
            mass: { type: "string" },
            hair_color: { type: "string" },
            skin_color: { type: "string" },
            eye_color: { type: "string" },
            birth_year: { type: "string" },
            gender: { type: "string" },
            homeworld: { type: "string" },
            films: { type: "array", items: { type: "string" } },
            species: { type: "array", items: { type: "string" } },
            vehicles: { type: "array", items: { type: "string" } },
            starships: { type: "array", items: { type: "string" } },
            created: { type: "string" },
            edited: { type: "string" },
            url: { type: "string" },
          },
        },
        SWPlanet: {
          type: "object",
          properties: {
            name: { type: "string" },
            rotation_period: { type: "string" },
            orbital_period: { type: "string" },
            diameter: { type: "string" },
            climate: { type: "string" },
            gravity: { type: "string" },
            terrain: { type: "string" },
            surface_water: { type: "string" },
            population: { type: "string" },
            residents: { type: "array", items: { type: "string" } },
            films: { type: "array", items: { type: "string" } },
            created: { type: "string" },
            edited: { type: "string" },
            url: { type: "string" },
          },
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
            wiki: { $ref: "#/components/schemas/WikiSummary" },
            fetchedAt: { type: "string", format: "date-time" },
          },
        },
        StorageInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            notes: { type: "string", maxLength: 2000 },
          },
        },
        StorageItem: {
          allOf: [
            { $ref: "#/components/schemas/StorageInput" },
            {
              type: "object",
              properties: {
                id: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          ],
        },
        HistoryItem: {
          type: "object",
          properties: {
            pk: { type: "string" },
            sk: { type: "string" },
            resource: { type: "string" },
            q: { type: "string" },
            hasBase: { type: "boolean" },
            hasWiki: { type: "boolean" },
            durationMs: { type: "number" },
          },
        },
      },
    },
  };
}
