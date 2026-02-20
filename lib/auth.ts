import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NAME = "meedya_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 24;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export async function validateAdminCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME?.trim();
  const rawHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedUser || !rawHash) return false;

  // Make env input resilient to common dashboard copy/paste issues.
  const expectedHash = rawHash
    .trim()
    .replace(/^['"(]+/, "")
    .replace(/['")]+$/, "")
    .replace(/\$\$/g, "$");

  if (username.trim() !== expectedUser) return false;
  return bcrypt.compare(password, expectedHash);
}

export async function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin:${expiresAt}`;
  const signature = sign(payload);
  const token = `${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = sign(payload);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return false;
  }

  const [role, expiresAt] = payload.split(":");
  if (role !== "admin") return false;
  if (!expiresAt || Number.isNaN(Number(expiresAt))) return false;
  if (Math.floor(Date.now() / 1000) > Number(expiresAt)) return false;

  return true;
}
