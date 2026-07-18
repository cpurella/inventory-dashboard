import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import seedItems from "../../../data/inventory.json";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.confirm !== "YES") {
      return NextResponse.json(
        { error: "Confirmation required. This will erase all logged GRN/Usage/Damage entries." },
        { status: 400 }
      );
    }

    await prisma.transaction.deleteMany({});
    await prisma.monthlyMovement.deleteMany({});
    await prisma.item.deleteMany({});

    await prisma.item.createMany({
      data: seedItems.map((it) => ({
        code: it.code,
        description: it.description,
        category: it.category || "Uncategorized",
        uom: it.uom,
        packingSize: it.packingSize || null,
        currentStock: it.currentStock || 0,
        avgPerDay: it.avgPerDay || 0,
        runoutDays: it.runoutDays,
        runoutDate: it.runoutDate,
        discontinued: !!it.discontinued,
      })),
    });

    const createdItems = await prisma.item.findMany({ orderBy: { id: "asc" } });

    const monthRows = [];
    createdItems.forEach((dbItem, idx) => {
      const src = seedItems[idx];
      if (!src) return;
      for (const m of src.months) {
        monthRows.push({
          itemId: dbItem.id,
          month: m.month,
          opening: m.opening,
          added: m.added,
          usage: m.usage,
          damage: 0,
          closing: m.closing,
        });
      }
    });

    // Insert in chunks to stay well within any single-request payload limits.
    const CHUNK = 1000;
    for (let i = 0; i < monthRows.length; i += CHUNK) {
      await prisma.monthlyMovement.createMany({ data: monthRows.slice(i, i + CHUNK) });
    }

    const count = await prisma.item.count();
    return NextResponse.json({ ok: true, itemsSeeded: count });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Reset failed. Check server logs." }, { status: 500 });
  }
}
