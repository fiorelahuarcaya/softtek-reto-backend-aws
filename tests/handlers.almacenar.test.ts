jest.mock("@aws-sdk/lib-dynamodb", () => ({
  PutCommand: class {
    constructor(public input: any) {}
  },
}));

jest.mock("../src/core/db", () => ({
  ddb: { send: jest.fn(async (_: any) => ({})) },
  Tables: { storage: "table-dev" },
}));

jest.mock("../src/middlewares/requireAuth", () => ({
  requireAuth: jest.fn(async () => ({ ok: true, claims: { sub: "tester" } })),
}));

import { handler } from "../src/handlers/almacenar";
import { ddb } from "../src/core/db";
import { mockContext, httpEventV2 } from "./__utils__/lambda";

describe("POST /almacenar", () => {
  it("201 si body válido", async () => {
    const event = httpEventV2({
      rawPath: "/almacenar",
      headers: { authorization: "Bearer fake" },
      body: JSON.stringify({ name: "Fiore", email: "f@ex.com" }),
    });

    const res = await handler(event as any, mockContext());
    expect(res.statusCode).toBe(201);
    const json = JSON.parse(res.body);
    expect(json).toHaveProperty("id");
    expect(json.name).toBe("Fiore");
    expect((ddb.send as any).mock.calls.length).toBe(1);
    expect((res as any).headers?.["Content-Type"]).toContain(
      "application/json"
    );
  });

  it("400 si body inválido", async () => {
    const event = httpEventV2({
      rawPath: "/almacenar",
      headers: { authorization: "Bearer fake" },
      body: JSON.stringify({}),
    });

    const res = await handler(event as any, mockContext());
    expect(res.statusCode).toBe(400);
  });
});
