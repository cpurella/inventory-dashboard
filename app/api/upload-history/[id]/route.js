import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  try {
    const requester = await getCurrentUser();
    if (!isAdmin(requester)) {
      return NextResponse.json({ error: "Only an admin can do this." }, { status: 403 });
    }
    const id = Number(params.id);
    await prisma.uploadLog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not delete this log entry." }, { status: 500 });
  }
}
