import inventory from "../data/inventory.json";

const MONTH_LABELS = {
  "2026-01": "Jan",
  "2026-02": "Feb",
  "2026-03": "Mar",
  "2026-04": "Apr",
  "2026-05": "May",
  "2026-06": "Jun",
  "2026-07": "Jul",
  "2026-08": "Aug",
  "2026-09": "Sep",
  "2026-10": "Oct",
  "2026-11": "Nov",
  "2026-12": "Dec",
};

export function getAllItems() {
  return inventory;
}

export function getItemByCode(code) {
  return inventory.find((it) => String(it.code) === String(code));
}

export function getMonthKeys() {
  return Object.keys(MONTH_LABELS);
}

export function getMonthLabel(key) {
  return MONTH_LABELS[key] || key;
}

// Returns opening/added/usage/closing for a given item at a given month key.
export function getMonthData(item, monthKey) {
  return item.months.find((m) => m.month === monthKey);
}

// Summary totals for a given month across all items, grouped by UOM
// (since different items use different units, we can't add TON + BAG + NOS together).
export function getMonthSummaryByUom(monthKey) {
  const byUom = {};
  for (const item of inventory) {
    const md = getMonthData(item, monthKey);
    if (!md) continue;
    if (!byUom[item.uom]) {
      byUom[item.uom] = { uom: item.uom, opening: 0, added: 0, usage: 0, closing: 0, itemCount: 0 };
    }
    byUom[item.uom].opening += md.opening;
    byUom[item.uom].added += md.added;
    byUom[item.uom].usage += md.usage;
    byUom[item.uom].closing += md.closing;
    byUom[item.uom].itemCount += 1;
  }
  return Object.values(byUom).sort((a, b) => b.closing - a.closing);
}

export function getItemsWithLowRunout(days = 30) {
  return inventory
    .filter((it) => it.runoutDays != null && it.runoutDays <= days)
    .sort((a, b) => a.runoutDays - b.runoutDays);
}
