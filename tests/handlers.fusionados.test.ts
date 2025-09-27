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
jest.mock("../src/core/cache", () => ({
  getCachedOrFetch: jest.fn(async (_k: string, fn: any) => fn()),
}));

import { handler } from "../src/handlers/fusionados";

describe("GET /fusionados", () => {
  it("200 con base y wiki", async () => {
    const res = await handler({
      queryStringParameters: { q: "Luke", resource: "people" },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.base?.name).toBe("Luke Skywalker");
    expect(body.wiki?.title).toBe("Luke Skywalker");
  });

  it("400 si falta q", async () => {
    const res = await handler({ queryStringParameters: {} });
    expect(res.statusCode).toBe(400);
  });
});
