jest.mock("@aws-sdk/lib-dynamodb", () => ({
  PutCommand: class {
    constructor(public input: any) {}
  },
}));
jest.mock("../src/core/db", () => ({
  ddb: { send: jest.fn(async (_: any) => ({})) },
  Tables: { storage: "table-dev" },
}));

import { handler } from "../src/handlers/almacenar";
import { ddb } from "../src/core/db";

describe("POST /almacenar", () => {
  it("201 si body válido", async () => {
    const res = await handler({
      body: JSON.stringify({ name: "Fiore", email: "f@ex.com" }),
    });
    expect(res.statusCode).toBe(201);
    const json = JSON.parse(res.body);
    expect(json).toHaveProperty("id");
    expect(json.name).toBe("Fiore");
    expect((ddb.send as any).mock.calls.length).toBe(1);
  });

  it("400 si body inválido", async () => {
    const res = await handler({ body: JSON.stringify({}) });
    expect(res.statusCode).toBe(400);
  });
});
