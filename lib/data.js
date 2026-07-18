import { prisma } from "./prisma";
import { ensureSeeded } from "./ensure-seeded";

export { MONTH_KEYS, MONTH_LABELS, BULK_CATEGORIES, currentMonthKey } from "./constants";

function mapItem(it) {
  const months = [...it.months]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({
      month: m.month,
      opening: m.opening,
      added: m.added,
      usage: m.usage,
      damage: m.damage,
      closing: m.closing,
    }));

  const yearTotal = {
    opening: months[0]?.opening ?? 0,
    added: months.reduce((s, m) => s + m.added, 0),
    usage: months.reduce((s, m) => s + m.usage, 0),
    damage: months.reduce((s, m) => s + (m.damage || 0), 0),
    closing: it.currentStock,
  };

  return {
    id: it.id,
    code: it.code,
    description: it.description,
    category: it.category,
    uom: it.uom,
    packingSize: it.packingSize,
    currentStock: it.currentStock,
    avgPerDay: it.avgPerDay,
    runoutDays: it.runoutDays,
    runoutDate: it.runoutDate,
    discontinued: it.discontinued,
    updatedAt: it.updatedAt,
    months,
    yearTotal,
  };
}

export async function getAllItems() {
  await ensureSeeded();
  const items = await prisma.item.findMany({
    include: { months: true },
    orderBy: { id: "asc" },
  });
  return items.map(mapItem);
}

export async function getItemById(id) {
  await ensureSeeded();
  const it = await prisma.item.findUnique({
    where: { id: Number(id) },
    include: { months: true },
  });
  return it ? mapItem(it) : null;
}

export async function getCategories() {
  await ensureSeeded();
  const rows = await prisma.item.findMany({
    distinct: ["category"],
    select: { category: true },
  });
  return rows.map((r) => r.category).sort();
}

export async function getRecentTransactions(limit = 25) {
  await ensureSeeded();
  const rows = await prisma.transaction.findMany({
    include: { item: { select: { code: true, description: true, uom: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    code: r.item.code,
    description: r.item.description,
    uom: r.item.uom,
    type: r.type,
    quantity: r.quantity,
    date: r.date.toISOString().slice(0, 10),
    note: r.note,
  }));
}
