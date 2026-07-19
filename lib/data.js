import { prisma } from "./prisma";
import { ensureSeeded } from "./ensure-seeded";
import { MONTH_KEYS } from "./constants";

export { MONTH_KEYS, MONTH_LABELS, BULK_CATEGORIES, currentMonthKey } from "./constants";

function round2(n) {
  return Math.round((n || 0) * 100) / 100;
}

// Combines the Excel-sourced baseline (MonthlyMovement) with every live
// GRN/Usage/Damage entry logged in the app (Transaction) for this item, and
// computes the resulting opening/closing chain fresh every time.
//
// This is intentional: MonthlyMovement is only ever REPLACED wholesale when
// a new inventory file is uploaded, and Transaction rows are only ever
// created/edited/deleted by the Inventory Thilafushi entry forms -- neither
// one mutates the other, so re-uploading a refreshed Excel file can never
// wipe out anything logged in the app, and vice versa.
function computeItemView(it) {
  const baseByMonth = {};
  for (const mk of MONTH_KEYS) baseByMonth[mk] = { added: 0, usage: 0, damage: 0 };
  for (const m of it.months || []) {
    if (baseByMonth[m.month]) {
      baseByMonth[m.month].added = m.added;
      baseByMonth[m.month].usage = m.usage;
      baseByMonth[m.month].damage = m.damage || 0;
    }
  }

  const liveByMonth = {};
  for (const mk of MONTH_KEYS) liveByMonth[mk] = { added: 0, usage: 0, damage: 0 };
  for (const tx of it.transactions || []) {
    // Historical bin-card imports are ALREADY counted inside the monthly
    // baseline totals above (that's literally what those totals were built
    // from) -- adding them again here would double-count every quantity.
    // Only entries logged live in the app should top up the baseline.
    if (tx.source === "historical-import") continue;
    const mk = tx.date.toISOString().slice(0, 7);
    if (!liveByMonth[mk]) liveByMonth[mk] = { added: 0, usage: 0, damage: 0 };
    if (tx.type === "GRN") liveByMonth[mk].added += tx.quantity;
    else if (tx.type === "USAGE") liveByMonth[mk].usage += tx.quantity;
    else if (tx.type === "DAMAGE") liveByMonth[mk].damage += tx.quantity;
  }

  const firstBase = (it.months || []).find((m) => m.month === MONTH_KEYS[0]);
  let running = firstBase ? firstBase.opening : 0;

  const months = MONTH_KEYS.map((mk) => {
    const base = baseByMonth[mk];
    const live = liveByMonth[mk];
    const added = round2(base.added + live.added);
    const usage = round2(base.usage + live.usage);
    const damage = round2(base.damage + live.damage);
    const opening = round2(running);
    const closing = round2(opening + added - usage - damage);
    running = closing;
    return { month: mk, opening, added, usage, damage, closing };
  });

  const currentStock = round2(running);

  let runoutDays = null;
  let runoutDate = null;
  if (it.avgPerDay > 0) {
    runoutDays = round2(currentStock / it.avgPerDay);
    const d = new Date();
    d.setDate(d.getDate() + Math.max(0, Math.round(runoutDays)));
    runoutDate = d.toISOString().slice(0, 10);
  }

  const yearTotal = {
    opening: months[0]?.opening ?? 0,
    added: round2(months.reduce((s, m) => s + m.added, 0)),
    usage: round2(months.reduce((s, m) => s + m.usage, 0)),
    damage: round2(months.reduce((s, m) => s + m.damage, 0)),
    closing: currentStock,
  };

  return {
    id: it.id,
    code: it.code,
    description: it.description,
    category: it.category,
    uom: it.uom,
    packingSize: it.packingSize,
    currentStock,
    avgPerDay: it.avgPerDay,
    runoutDays,
    runoutDate,
    discontinued: it.discontinued,
    months,
    yearTotal,
  };
}

// Bin-card style ledger: every individual dated transaction (manual entries
// plus the historical bin-card import) in chronological order, with a
// running balance. Starts from the item's January opening baseline.
function computeLedger(it) {
  const sorted = [...(it.transactions || [])].sort((a, b) => {
    const d = new Date(a.date) - new Date(b.date);
    if (d !== 0) return d;
    return a.id - b.id;
  });

  const firstBase = (it.months || []).find((m) => m.month === MONTH_KEYS[0]);
  let running = firstBase ? firstBase.opening : 0;

  return sorted.map((tx) => {
    if (tx.type === "GRN") running = round2(running + tx.quantity);
    else running = round2(running - tx.quantity); // USAGE or DAMAGE
    return {
      id: tx.id,
      date: tx.date.toISOString().slice(0, 10),
      type: tx.type,
      quantity: tx.quantity,
      note: tx.note,
      source: tx.source,
      balance: running,
    };
  });
}

export async function getAllItems() {
  await ensureSeeded();
  const items = await prisma.item.findMany({
    include: { months: true, transactions: true },
    orderBy: { id: "asc" },
  });
  return items.map(computeItemView);
}

export async function getItemById(id) {
  await ensureSeeded();
  const it = await prisma.item.findUnique({
    where: { id: Number(id) },
    include: { months: true, transactions: true },
  });
  if (!it) return null;
  return { ...computeItemView(it), ledger: computeLedger(it) };
}

// Lightweight helper for API routes that just need the freshly computed
// current stock after a transaction is created/edited/deleted.
export async function getCurrentStock(id) {
  const it = await prisma.item.findUnique({
    where: { id: Number(id) },
    include: { months: true, transactions: true },
  });
  return it ? computeItemView(it).currentStock : null;
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
