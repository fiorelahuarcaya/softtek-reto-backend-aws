import { fetchWikiSummary } from "../src/clients/wikipedia";

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

describe("wikipedia client", () => {
  it("devuelve summary directo si 200", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      mockResponse(200, {
        title: "Luke Skywalker",
        extract: "Jedi Knight...",
        content_urls: {
          desktop: { page: "https://en.wikipedia.org/wiki/Luke_Skywalker" },
        },
        thumbnail: { source: "https://..." },
      })
    );

    const s = await fetchWikiSummary("Luke Skywalker");
    expect(s?.title).toBe("Luke Skywalker");
    expect(s?.url).toContain("wikipedia.org/wiki/");
  });

  it("hace fallback por búsqueda si el primero falla", async () => {
    (global.fetch as jest.Mock)
      // 1) summary directo falla
      .mockImplementationOnce(() => mockResponse(404, {}))
      // 2) búsqueda devuelve candidato
      .mockImplementationOnce(() =>
        mockResponse(200, { query: { search: [{ title: "Luke Skywalker" }] } })
      )
      // 3) summary del candidato
      .mockImplementationOnce(() =>
        mockResponse(200, { title: "Luke Skywalker", extract: "Jedi" })
      );

    const s = await fetchWikiSummary("Luke");
    expect(s?.title).toBe("Luke Skywalker");
  });
});
