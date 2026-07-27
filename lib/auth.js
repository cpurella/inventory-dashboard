import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "thf_session";
const SESSION_DAYS = 30;

// Falls back to a fixed secret so this works out of the box without extra
// Vercel setup. For stronger security later, add an AUTH_SECRET env var --
// the code below picks it up automatically if present.
const SECRET = process.env.AUTH_SECRET || "thf-stock-inventory-dashboard-secret-2026";

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [data, hmac] = token.split(".");
  const expected = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  if (expected !== hmac) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function createSessionCookieValue(userId) {
  return sign({ uid: userId, exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

export const ROLES = ["ADMIN", "EDITOR", "VIEWER"];

let adminBootstrapped = false;

// The very first account ever created (lowest id) becomes ADMIN automatically,
// so there's always at least one admin without any manual DB step. Runs once
// per server instance and is a no-op once any admin already exists.
async function ensureAdminBootstrap() {
  if (adminBootstrapped) return;
  const anyAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!anyAdmin) {
    const earliest = await prisma.user.findFirst({ orderBy: { id: "asc" } });
    if (earliest) {
      await prisma.user.update({ where: { id: earliest.id }, data: { role: "ADMIN" } });
    }
  }
  adminBootstrapped = true;
}

// Server Component helper: returns the logged-in user (id, name, email, role) or null.
export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = verify(token);
  if (!payload) return null;
  await ensureAdminBootstrap();
  const user = await prisma.user.findUnique({
    where: { id: payload.uid },
    select: { id: true, name: true, email: true, role: true, avatarDataUrl: true },
  });
  return user;
}

export function isAdmin(user) {
  return user?.role === "ADMIN";
}

export function canEditInventory(user) {
  return user?.role === "ADMIN" || user?.role === "EDITOR";
}
