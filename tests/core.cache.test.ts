import { getCachedOrFetch } from "../src/core/cache";

describe("cache", () => {
  it("usa fetcher la primera vez y cachea la segunda", async () => {
    let calls = 0;
    const fetcher = async () => (++calls, { value: Math.random() });
    const key = "cache#test#1";

    const a = await getCachedOrFetch(key, fetcher, 60);
    const b = await getCachedOrFetch(key, fetcher, 60);

    expect(calls).toBe(1);
    expect(b).toEqual(a);
  });
});
