import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const requester = await getCurrentUser();
  if (!isAdmin(requester)) {
    return NextResponse.json({ error: "Only an admin can view this." }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json({ users });
}
