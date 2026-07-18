import { prisma } from "./prisma";
import seedItems from "../data/inventory.json";

let seededThisInstance = false;

export async function ensureSeeded() {
  if (seededThisInstance) return;

  const count = await prisma.item.count();
  if (count > 0) {
    seededThisInstance = true;
    return;
  }

  // Bulk-create all items first (fast, single statement).
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

  // Fetch them back in insertion order so we can attach each one's months.
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

  await prisma.monthlyMovement.createMany({ data: monthRows });

  seededThisInstance = true;
}
