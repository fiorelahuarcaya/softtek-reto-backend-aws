import { buildOpenApi } from "../src/docs/openapi";

describe("OpenAPI spec", () => {
  it("inyecta server basePath correcto", () => {
    expect(buildOpenApi("/dev").servers[0].url).toBe("/dev");
    expect(buildOpenApi("").servers[0].url).toBe("");
  });

  it("incluye paths clave", () => {
    const spec = buildOpenApi("/dev");
    expect(spec.paths["/fusionados"]).toBeTruthy();
    expect(spec.paths["/almacenar"]).toBeTruthy();
    expect(spec.paths["/historial"]).toBeTruthy();
  });
});
