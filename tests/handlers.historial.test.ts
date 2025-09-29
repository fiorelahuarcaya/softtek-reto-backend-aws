jest.mock("@aws-sdk/lib-dynamodb", () => ({
  QueryCommand: class {
    constructor(public input: any) {}
  },
}));

jest.mock("../src/core/db", () => ({
  ddb: {
    send: jest.fn(async (_: any) => ({
      Items: [{ pk: "fusionados", sk: "2025-01-01#id", q: "Luke" }],
      LastEvaluatedKey: { sk: "cursor-1" },
    })),
  },
  Tables: { history: "history-dev" },
}));

jest.mock("../src/middlewares/requireAuth", () => ({
  requireAuth: jest.fn(async () => ({ ok: true, claims: { sub: "tester" } })),
}));

import { handler } from "../src/handlers/historial";
import { ddb } from "../src/core/db";
import { mockContext, httpEventV2 } from "./__utils__/lambda";

it("200 devuelve items y nextCursor", async () => {
  const event = httpEventV2({
    rawPath: "/historial",
    headers: { authorization: "Bearer fake" },
    queryStringParameters: { limit: "1" },
  });

  const res = await handler(event, mockContext());
  expect(res.statusCode).toBe(200);
  expect(res.body).toBeDefined();
  const json = JSON.parse(res.body!);
  expect(json.items.length).toBe(1);
  expect(json.nextCursor).toBe("cursor-1");
  expect((ddb.send as any).mock.calls.length).toBe(1);
  expect(res.headers?.["Content-Type"]).toContain("application/json");
});
