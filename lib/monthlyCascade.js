import { prisma } from "./prisma";
import { MONTH_KEYS } from "./constants";

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function fieldForType(type) {
  return type === "GRN" ? "added" : type === "USAGE" ? "usage" : "damage";
}

// Recomputes opening/closing for every month of this item (in order), then
// updates the item's live currentStock + runoutDays/runoutDate. Call this
// any time a MonthlyMovement row's added/usage/damage changes.
export async function recomputeCascade(itemId) {
  const months = await prisma.monthlyMovement.findMany({
    where: { itemId },
    orderBy: { month: "asc" },
  });
  const byMonth = Object.fromEntries(months.map((m) => [m.month, m]));

  let running = byMonth[MONTH_KEYS[0]]?.opening ?? 0;
  for (const mk of MONTH_KEYS) {
    const row = byMonth[mk];
    if (!row) continue;
    const opening = round2(running);
    const closing = round2(opening + row.added - row.usage - row.damage);
    if (row.opening !== opening || row.closing !== closing) {
      await prisma.monthlyMovement.update({
        where: { id: row.id },
        data: { opening, closing },
      });
    }
    running = closing;
  }

  const currentStock = round2(running);
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  let runoutDays = null;
  let runoutDate = null;
  if (item && item.avgPerDay > 0) {
    runoutDays = round2(currentStock / item.avgPerDay);
    const d = new Date();
    d.setDate(d.getDate() + Math.max(0, Math.round(runoutDays)));
    runoutDate = d.toISOString().slice(0, 10);
  }

  await prisma.item.update({
    where: { id: itemId },
    data: { currentStock, runoutDays, runoutDate },
  });

  return currentStock;
}
