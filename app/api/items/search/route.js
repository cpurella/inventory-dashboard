import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { ensureSeeded } from "../../../../lib/ensure-seeded";

export const dynamic = "force-dynamic";

export async function GET(request) {
  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ items: [] });

  const items = await prisma.item.findMany({
    where: {
      OR: [
        { description: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, code: true, description: true, category: true, uom: true, currentStock: true },
    take: 20,
    orderBy: { description: "asc" },
  });
  return NextResponse.json({ items });
}
