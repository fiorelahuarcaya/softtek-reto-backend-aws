import { z } from "zod";
import { createLogger } from "../core/logger";
import { isValidLogin, signJwt } from "../core/auth";

const Body = z.object({ username: z.string(), password: z.string() });

export const login = async (event: any) => {
  const log = createLogger({ component: "auth.login" });
  try {
    const body =
      typeof event.body === "string"
        ? JSON.parse(event.body || "{}")
        : event.body || {};
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid body" }),
      };
    }
    const { username, password } = parsed.data;
    if (!isValidLogin(username, password)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Bad credentials" }),
      };
    }
    const token = await signJwt({ sub: username, roles: ["user"] }, "2h");
    return {
      statusCode: 200,
      body: JSON.stringify({
        access_token: token,
        token_type: "Bearer",
        expires_in: 7200,
      }),
    };
  } catch (e: any) {
    log.error("LOGIN_FAILED", { error: e?.message });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Login failed" }),
    };
  }
};
export default login;
