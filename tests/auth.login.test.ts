import { login } from "../src/handlers/auth";
import { httpEventV2, mockContext } from "./__utils__/lambda";

jest.mock("jose", () => {
  class SignJWT {
    constructor(_: any) {}
    setProtectedHeader() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    async sign() {
      return "mocked.jwt.token";
    }
  }
  return {
    SignJWT,
    // si verificas tokens en otros tests, ya te deja pasar
    jwtVerify: jest.fn(async () => ({
      payload: { sub: "admin", roles: ["user"] },
    })),
  };
});

describe("POST /auth/login", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      AUTH_USERNAME: "admin",
      AUTH_PASSWORD: "devpass",
      JWT_SECRET: "this-is-a-long-dev-secret-32bytes-min",
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("200 y devuelve access_token con credenciales válidas", async () => {
    const event = httpEventV2({
      body: JSON.stringify({ username: "admin", password: "devpass" }),
    });
    const res = await login(event, mockContext());
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
    const json = JSON.parse(res.body!);
    expect(json).toHaveProperty("access_token");
    expect(json).toHaveProperty("token_type", "Bearer");
  });

  it("401 con credenciales inválidas", async () => {
    const event = httpEventV2({
      body: JSON.stringify({ username: "admin", password: "bad" }),
    });
    const res = await login(event, mockContext());
    expect(res.statusCode).toBe(401);
  });

  it("400 con body inválido", async () => {
    const event = httpEventV2({ body: JSON.stringify({}) });
    const res = await login(event, mockContext());
    expect(res.statusCode).toBe(400);
  });
});
