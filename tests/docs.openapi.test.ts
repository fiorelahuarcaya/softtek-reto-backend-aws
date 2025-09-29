import { buildOpenApi } from "../src/docs/openapi";

describe("OpenAPI spec", () => {
  it("incluye paths clave", () => {
    const spec = buildOpenApi("/dev");
    expect(spec.paths["/fusionados"]).toBeTruthy();
    expect(spec.paths["/almacenar"]).toBeTruthy();
    expect(spec.paths["/historial"]).toBeTruthy();
  });
});
