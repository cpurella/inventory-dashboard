import { prisma } from "./prisma";
import seedItems from "../data/inventory.json";

let seededThisInstance = false;

// Existing items created before "seedIndex" existed have it as NULL.
// Backfill it once, in original insertion order, so file re-uploads can
// match rows correctly and merge instead of duplicating them.
async function backfillSeedIndex() {
  await prisma.$executeRawUnsafe(`
    UPDATE "Item" AS t
    SET "seedIndex" = sub.rn
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) - 1 AS rn
      FROM "Item"
      WHERE "seedIndex" IS NULL
    ) AS sub
    WHERE t.id = sub.id;
  `);
}

// Existing MonthlyMovement rows created before "baseline*" fields existed
// have them at their default (0) with baselineSet = false. Snapshot the
// current added/usage/damage/opening as the baseline, so a future file
// re-upload can compute a correct delta on top of whatever has already
// happened (instead of double-counting or wiping it).
async function backfillMonthlyBaseline() {
  await prisma.$executeRawUnsafe(`
    UPDATE "MonthlyMovement"
    SET "baselineOpening" = "opening",
        "baselineAdded" = "added",
        "baselineUsage" = "usage",
        "baselineDamage" = "damage",
        "baselineSet" = true
    WHERE "baselineSet" = false;
  `);
}

export async function ensureSeeded() {
  if (seededThisInstance) return;

  const count = await prisma.item.count();
  if (count > 0) {
    await backfillSeedIndex();
    await backfillMonthlyBaseline();
    seededThisInstance = true;
    return;
  }

  // Bulk-create all items first (fast, single statement).
  await prisma.item.createMany({
    data: seedItems.map((it, idx) => ({
      seedIndex: idx,
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
        baselineOpening: m.opening,
        baselineAdded: m.added,
        baselineUsage: m.usage,
        baselineDamage: 0,
        baselineSet: true,
      });
    }
  });

  const CHUNK = 1000;
  for (let i = 0; i < monthRows.length; i += CHUNK) {
    await prisma.monthlyMovement.createMany({ data: monthRows.slice(i, i + CHUNK) });
  }

  seededThisInstance = true;
}
