import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "og_session";
export const SESSION_DAYS = 30;

export interface SessionPayload {
  uid: number;
  role: "student" | "admin" | "guest";
  sv: number; // session version; bumps on password change to log out other devices
}

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(p: SessionPayload): Promise<string> {
  return new SignJWT({ ...p })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "number" || typeof payload.sv !== "number") return null;
    if (payload.role !== "student" && payload.role !== "admin" && payload.role !== "guest") return null;
    return { uid: payload.uid, role: payload.role, sv: payload.sv };
  } catch {
    return null;
  }
}
