import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
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
