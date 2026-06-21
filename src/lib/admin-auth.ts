import { jwtVerify, SignJWT } from "jose";

const cookieName = "mats2004_admin";

function secretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export function adminCookieName() {
  return cookieName;
}

export function tokenFromCookieHeader(header: string | null) {
  return header?.includes(cookieName) ? header.split(`${cookieName}=`)[1]?.split(";")[0] : null;
}

export async function isAdminPassword(password: string) {
  return password === process.env.ADMIN_PASSWORD;
}

export async function createAdminToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey());
}

export async function requireAdmin(token: string | null | undefined) {
  if (!token) {
    throw new Error("Admin authentication required");
  }
  const verified = await jwtVerify(token, secretKey());
  if (verified.payload.role !== "admin") {
    throw new Error("Admin authentication required");
  }
}
