import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const requester = await getCurrentUser();
  if (!isAdmin(requester)) {
    return NextResponse.json({ error: "Only an admin can view this." }, { status: 403 });
  }
  const rows = await prisma.uploadLog.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    logs: rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      uploadedByName: r.uploadedByName,
      itemsUpdated: r.itemsUpdated,
      itemsAdded: r.itemsAdded,
      itemsUntouched: r.itemsUntouched,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
