import { prisma } from "./prisma";
import seedItems from "@/data/inventory.json";

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

// Databases seeded before Upload History existed have no record of the
// original file that set everything up. Backfill one entry, once, so it
// shows up in the list.
async function backfillInitialUploadLog(itemCount) {
  const existing = await prisma.uploadLog.count();
  if (existing > 0) return;
  await prisma.uploadLog.create({
    data: {
      filename: "INV-THF.xlsx + THI-INVENTORY_REPORTING_-_07-07-2026.xlsx (initial setup)",
      uploadedByName: null,
      itemsUpdated: 0,
      itemsAdded: itemCount,
      itemsUntouched: 0,
    },
  });
}

// Databases seeded before AppSetting existed have no "as of" date recorded
// yet. Backfill it once with the original bundled file's date; any later
// file upload will overwrite it with that file's real "AS AT" date.
async function backfillAppSetting() {
  const existing = await prisma.appSetting.findUnique({ where: { id: 1 } });
  if (existing) return;
  await prisma.appSetting.create({
    data: { id: 1, inventoryAsOfDate: new Date("2026-07-07") },
  });
}

export async function ensureSeeded() {
  if (seededThisInstance) return;

  const count = await prisma.item.count();
  if (count > 0) {
    await backfillSeedIndex();
    await backfillMonthlyBaseline();
    await backfillInitialUploadLog(count);
    await backfillAppSetting();
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

  await prisma.uploadLog.create({
    data: {
      filename: "INV-THF.xlsx + THI-INVENTORY_REPORTING_-_07-07-2026.xlsx (initial setup)",
      uploadedByName: null,
      itemsUpdated: 0,
      itemsAdded: createdItems.length,
      itemsUntouched: 0,
    },
  });

  await prisma.appSetting.upsert({
    where: { id: 1 },
    update: { inventoryAsOfDate: new Date("2026-07-07") },
    create: { id: 1, inventoryAsOfDate: new Date("2026-07-07") },
  });

  seededThisInstance = true;
}
