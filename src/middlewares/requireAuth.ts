import { verifyJwt } from "../core/auth";

export async function requireAuth(event: any) {
  const h = event?.headers || {};
  const auth = h.authorization || h.Authorization;
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
