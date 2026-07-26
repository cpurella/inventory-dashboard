import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  getCurrentUser,
  isAdmin,
  ROLES,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are all required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const userCount = await prisma.user.count();
    const isBootstrap = userCount === 0;

    if (!isBootstrap) {
      // Every account after the very first one must be created by an admin.
      const requester = await getCurrentUser();
      if (!isAdmin(requester)) {
        return NextResponse.json(
          { error: "Only an admin can create new accounts. Ask an admin to add you from Settings." },
          { status: 403 }
        );
      }
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const requestedRole = ROLES.includes(role) ? role : "VIEWER";
    const finalRole = isBootstrap ? "ADMIN" : requestedRole;

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name: name.trim(), email: normalizedEmail, passwordHash, role: finalRole },
    });

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    // Only log the browser into the new account during first-time bootstrap.
    // When an admin creates a teammate's account, the admin's own session
    // must stay untouched.
    if (isBootstrap) {
      res.cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue(user.id), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: "/",
      });
    }

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
