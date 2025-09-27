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

import { handler } from "../src/handlers/historial";
import { ddb } from "../src/core/db";

it("200 devuelve items y nextCursor", async () => {
  const res = await handler({ queryStringParameters: { limit: "1" } });
  expect(res.statusCode).toBe(200);
  const json = JSON.parse(res.body);
  expect(json.items.length).toBe(1);
  expect(json.nextCursor).toBe("cursor-1");
  expect((ddb.send as any).mock.calls.length).toBe(1);
});
