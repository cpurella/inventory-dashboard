import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin, ROLES } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const requester = await getCurrentUser();
    if (!isAdmin(requester)) {
      return NextResponse.json({ error: "Only an admin can do this." }, { status: 403 });
    }

    const id = Number(params.id);
    const { role } = await request.json();
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (id === requester.id && role !== "ADMIN") {
      return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
    }

    const updated = await prisma.user.update({ where: { id }, data: { role } });
    return NextResponse.json({ ok: true, user: { id: updated.id, role: updated.role } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not update this user." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const requester = await getCurrentUser();
    if (!isAdmin(requester)) {
      return NextResponse.json({ error: "Only an admin can do this." }, { status: 403 });
    }

    const id = Number(params.id);
    if (id === requester.id) {
      return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (target?.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Can't remove the last remaining admin." }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not remove this user." }, { status: 500 });
  }
}
