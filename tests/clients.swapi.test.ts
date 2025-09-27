import { fetchSWPeople, fetchSWPlanets } from "../src/clients/swapi";

const originalFetch = global.fetch;
function mockResponse(status: number, payload: any) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response);
}

beforeEach(() => {
  global.fetch = jest.fn() as any;
});
afterEach(() => {
  (global.fetch as any).mockReset?.();
  global.fetch = originalFetch;
});

it("fetchSWPeople devuelve el primer result", async () => {
  (global.fetch as jest.Mock).mockImplementationOnce(() =>
    mockResponse(200, { results: [{ name: "Luke Skywalker" }] })
  );
  const p = await fetchSWPeople("Luke");
  expect(p?.name).toBe("Luke Skywalker");
});

it("fetchSWPlanets devuelve null si no hay resultados", async () => {
  (global.fetch as jest.Mock).mockImplementationOnce(() =>
    mockResponse(200, { results: [] })
  );
  const pl = await fetchSWPlanets("Xyz");
  expect(pl).toBeNull();
});
