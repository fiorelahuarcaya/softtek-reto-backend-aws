// --- Mocks de clientes externos ---
jest.mock("../src/clients/swapi", () => ({
  fetchSWPeople: jest.fn(async () => ({ name: "Luke Skywalker" })),
  fetchSWPlanets: jest.fn(async () => null),
}));
jest.mock("../src/clients/wikipedia", () => ({
  fetchWikiSummary: jest.fn(async () => ({
    title: "Luke Skywalker",
    extract: "Jedi",
  })),
}));

// --- Cache: mockea la versión *Meta* que usa tu handler ---
jest.mock("../src/core/cache", () => ({
  getCachedOrFetchMeta: jest.fn(async (_k: string, fn: any) => ({
    payload: await fn(),
    source: "MISS",
  })),
}));

// --- Rate limit: deja pasar ---
jest.mock("../src/middlewares/rateLimit", () => ({
  enforceRateLimit: jest.fn(async () => ({ ok: true })),
}));

// --- DynamoDB: mockea la escritura de historial ---
jest.mock("../src/core/db", () => ({
  ddb: { send: jest.fn(async (_: any) => ({})) },
  Tables: { history: "history-dev", cache: "cache-dev" },
}));

// jest.mock("../src/core/tracing", () => ({
//   withSubsegment: async (_: string, fn: any) => await fn(),
// }));

import { handler } from "../src/handlers/fusionados";
import { httpEventV2, mockContext } from "./__utils__/lambda";

describe("GET /fusionados", () => {
  it("200 con base y wiki", async () => {
    const event = httpEventV2({
      rawPath: "/fusionados",
      queryStringParameters: { q: "Luke", resource: "people" },
    });

    const res = await handler(event as any, mockContext());
    // console.log(res.statusCode, res.body); // útil si vuelve a fallar

    expect(res.statusCode).toBe(200);
    expect(res.headers?.["Content-Type"]).toContain("application/json");

    const body = JSON.parse(res.body);
    expect(body.base?.name).toBe("Luke Skywalker");
    expect(body.wiki?.title).toBe("Luke Skywalker");
    // y puedes verificar que guardó historial si quieres:
    // const { ddb } = require("../src/core/db");
    // expect((ddb.send as any).mock.calls.length).toBeGreaterThan(0);
  });

  it("400 si falta q", async () => {
    const event = httpEventV2({
      rawPath: "/fusionados",
      queryStringParameters: {},
    });

    const res = await handler(event as any, mockContext());
    expect(res.statusCode).toBe(400);
    expect(res.headers?.["Content-Type"]).toContain("application/json");
  });

  it("429 si se supera el rate limit", async () => {
    const { enforceRateLimit } = require("../src/middlewares/rateLimit");
    enforceRateLimit.mockImplementationOnce(async () => ({
      ok: false,
      statusCode: 429,
      body: { message: "Rate limit exceeded" },
    }));

    const event = httpEventV2({
      rawPath: "/fusionados",
      queryStringParameters: { q: "Luke", resource: "people" },
    });

    const res = await handler(event as any, mockContext());
    expect(res.statusCode).toBe(429);
    expect(res.headers?.["Content-Type"]).toContain("application/json");
  });
});
