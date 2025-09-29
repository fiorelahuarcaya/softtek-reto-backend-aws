import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { verifyJwt } from "../core/auth";

export interface AuthSuccess {
  ok: true;
  claims: Awaited<ReturnType<typeof verifyJwt>>;
}

export interface AuthFailure {
  ok: false;
  statusCode: number;
  body: { message: string };
}

export type AuthResult = AuthSuccess | AuthFailure;

export async function requireAuth(
  event: APIGatewayProxyEventV2
): Promise<AuthResult> {
  const headers = event?.headers ?? {};
  const auth = headers.authorization ?? headers.Authorization;

  if (!auth || !String(auth).startsWith("Bearer ")) {
    return {
      ok: false,
      statusCode: 401,
      body: { message: "Missing Bearer token" },
    };
  }

  const token = String(auth).slice(7);

  try {
    const claims = await verifyJwt(token);
    return { ok: true, claims };
  } catch {
    return {
      ok: false,
      statusCode: 401,
      body: { message: "Invalid or expired token" },
    };
  }
}
