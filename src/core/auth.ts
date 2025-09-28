import { SignJWT, jwtVerify } from "jose";

const enc = new TextEncoder();
const secret = () => enc.encode(process.env.JWT_SECRET || "dev-secret");

export type JwtPayload = { sub: string; roles?: string[] };

export async function signJwt(payload: JwtPayload, expiresIn = "2h") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret());
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, secret(), {
    algorithms: ["HS256"],
  });
  return payload as JwtPayload & { exp: number; iat: number };
}

export function isValidLogin(user?: string, pass?: string) {
  const U = process.env.AUTH_USERNAME;
  const P = process.env.AUTH_PASSWORD;
  // Comparación simple para el reto (en producción: hash y timing-safe compare)
  return !!user && !!pass && user === U && pass === P;
}
